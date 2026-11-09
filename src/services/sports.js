import {appNow} from './appClock.js';
import {decryptSportsLink,validateSportsEmbed} from './sportsCipher.js';
export const sportsCategories=[['Match','All sports'],['Highlights','Highlights'],['football','Football'],['basketball','Basketball'],['tennis','Tennis'],['cricket','Cricket'],['baseball','Baseball'],['rugby','Rugby'],['american-football','American Football'],['ice-hockey','Ice Hockey'],['ufc','UFC'],['motorsport','Motorsport']];
export const sportsBlogId='9205612625018620342';
const origin='https://livesports.streambros.xyz',cache=new Map();let sequence=0;
const text=value=>typeof value==='string'?value.trim().slice(0,250):'';
export function sportsImage(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function sportsServer(server,index=0){
 const rawNumber=Number(server.id)||Number(String(server.title||'').match(/server\s*(\d+)/i)?.[1])||index+1;const serverNumber=Number.isSafeInteger(rawNumber)&&rawNumber>0&&rawNumber<1000?rawNumber:index+1;
 try{if(['SS','S8'].includes(server.fb_id)){const url=validateSportsEmbed(decryptSportsLink(server.url),server.fb_id);return url?{kind:'embed',provider:server.fb_id,serverNumber,url,title:text(server.title)||server.fb_id}:null;}const u=new URL(server.url);if(u.protocol!=='https:'||u.username||u.password)return null;
  if(server.fb_id==='WS_DDL'&&['wsdss.mp','dlive.sx','dembed.st'].includes(u.hostname)){
   const id=u.pathname.match(/^\/stream\/stream-([1-9]\d{0,5})\.php$/)?.[1]||(u.pathname==='/premiumtv/daddy.php'?u.searchParams.get('id'):null);
   if(!/^[1-9]\d{0,5}$/.test(id))return null;return {kind:'channel',provider:'WS_DDL',serverNumber,number:Number(id),title:text(server.title)||'Live stream'};
  }
  if(server.fb_id==='YT'&&['www.youtube.com','youtube.com','www.youtube-nocookie.com','youtu.be'].includes(u.hostname)){
   const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.pathname.match(/^\/embed\/([-\w]{11})$/)?.[1]||u.searchParams.get('v');
   if(/^[-\w]{11}$/.test(id))return {kind:'youtube',provider:'YT',serverNumber,key:id,title:'Watch highlights'};
  }
 }catch{}return null;
}
export function sportsEvent(post){
 try{const labels=(post.category||[]).map(c=>text(c.term)),html=post.content?.$t||'',match=html.match(/<script\b[^>]*\bid=["']__STR34M_X_D4T4__["'][^>]*>([\s\S]*?)<\/script>/i);if(!match||match[1].length>150000)return null;
  const data=JSON.parse(match[1]);if(data.module!=='MIC'||!Array.isArray(data.servers))return null;
  const id=String(post.id?.$t||'').match(/post-(\d+)$/)?.[1];if(!id)return null;
  const starts=Date.parse(data.event?.starts),ends=Date.parse(data.event?.ends);if(!Number.isFinite(starts)||!Number.isFinite(ends)||ends<=starts||ends-starts>172800000)return null;
  const m=data.event?.match||{},servers=data.servers.map(sportsServer).filter(Boolean).filter((s,i,a)=>a.findIndex(v=>v.kind===s.kind&&(s.kind==='channel'?v.number===s.number:s.kind==='embed'?v.url===s.url:v.key===s.key))===i);
  const team=t=>({name:text(t?.name),logo:sportsImage(t?.logo)});
  return {id,title:text(data.title)||text(post.title?.$t)||'Sports event',starts,ends,highlight:labels.includes('Highlights')||data.event?.status==='Highlights'||data.is_live===false&&servers.some(s=>s.kind==='youtube'),sport:sportsCategories.find(([key])=>!['Match','Highlights'].includes(key)&&labels.includes(key))?.[0]||'Match',league:text(m.league?.name),leagueLogo:sportsImage(m.league?.logo),home:team(m.home),away:team(m.away),image:sportsImage(data.thumb),servers};
 }catch{return null;}
}
export function eventStatus(event,now=appNow()){return event.highlight?'Highlights':now<event.starts?'Upcoming':now<event.ends?'Live':'Finished';}
export function orderSports(events,now=appNow()){
 return events.filter(e=>e.highlight||e.ends>now-86400000).sort((a,b)=>{
  const rank=e=>e.highlight?3:eventStatus(e,now)==='Live'?0:e.starts>now?1:2;
  return rank(a)-rank(b)||Number(!a.servers.length)-Number(!b.servers.length)||(rank(a)>=2?b.starts-a.starts:a.starts-b.starts);
 });
}
// Blogger's public JSONP endpoint supports the TV file origin without an API key.
export function readSportsFeed(category,{signal,doc=globalThis.document,win=globalThis.window,timeoutMs=8000}={}){
 if(!sportsCategories.some(([key])=>key===category))return Promise.reject(Error('Unknown sport'));
 return new Promise((resolve,reject)=>{if(signal?.aborted){reject(Error('Cancelled'));return;}const callback='__mjSportsFeed'+(++sequence),script=doc.createElement('script'),url=new URL('/feeds/posts/default/-/'+category,origin);let settled=false;
  url.search=new URLSearchParams({alt:'json-in-script',callback,'max-results':category==='Highlights'?'40':'150',orderby:'published'}).toString();
  const finish=(error,data)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);delete win[callback];script.remove();error?reject(error):resolve(data);};
  const abort=()=>finish(Error('Cancelled')),timer=setTimeout(()=>finish(Error('Sports could not load. Please retry.')),timeoutMs);
  win[callback]=value=>{if(!String(value?.feed?.id?.$t||'').endsWith('blog-'+sportsBlogId)||!Array.isArray(value?.feed?.entry||[])){finish(Error('Invalid sports feed'));return;}finish(null,value.feed.entry||[]);};
  script.onerror=()=>finish(Error('Sports could not load. Please retry.'));script.src=url.href;script.referrerPolicy='no-referrer';signal?.addEventListener('abort',abort,{once:true});doc.head.append(script);
 });
}
export async function loadSports(category='Match',options={}){
 const previous=cache.get(category);if(previous&&!options.refresh&&appNow()-previous.updated<120000)return previous.events;
 try{const posts=await readSportsFeed(category,options),events=posts.map(sportsEvent).filter(Boolean);cache.set(category,{updated:appNow(),events});return events;}
 catch(error){if(previous&&!options.signal?.aborted)return previous.events;throw error;}
}
