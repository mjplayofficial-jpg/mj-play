import {liveSourceConfig} from './liveSourceConfig.mjs';
import {randomBytes} from 'node:crypto';import {decodeLiveSegment} from './liveDecode.mjs';
import {mediaRequestAllowed} from './previewAccess.mjs';
const defaultEdge='https://edge.cowedd4855ws.sbs';
const headers={Referer:'https://dembed.st/',Origin:'https://dembed.st'};
export function liveTarget(value,channel=38,edge=defaultEdge){try{const u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&!u.hash&&(u.origin===edge&&u.pathname.startsWith('/premium'+channel+'/')||/^p(?:16|19)-common-sign\.tiktokcdn-us\.com$/.test(u.hostname))?u:null;}catch{return null;}}
export function createLiveRelay(channel=38,{sourceConfig=liveSourceConfig,fetcher=fetch,now=Date.now}={}){
 if(!Number.isSafeInteger(channel)||channel<1||channel>999999)throw Error('Invalid live channel');
 const player='https://dembed.st/premiumtv/daddy.php?id='+channel;let edge=defaultEdge;
 const refs=new Map(),reverse=new Map(),segments=new Map(),segmentFlights=new Map();let segmentBytes=0,lastActivity=now();let token='',expires=0,flight;
 async function read(url,max){const r=await fetcher(url,{headers,redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Live upstream HTTP '+r.status);let size=0;const chunks=[];for await(const bytes of r.body){size+=bytes.length;if(size>max)throw Error('Live response too large');chunks.push(bytes);}return Buffer.concat(chunks);}
 async function auth(){if(token&&expires>now())return token;if(flight)return flight;flight=(async()=>{const data=JSON.parse((await read(edge+'/api/playlist-token?slug=premium'+channel,65536)).toString());if(typeof data.token!=='string'||data.token.length>8192)throw Error('Live handshake unavailable');token=data.token;expires=now()+30000;return token;})();try{return await flight;}finally{flight=null;}}
 function register(url){const target=liveTarget(url,channel,edge);if(!target)throw Error('Unexpected live host');const previous=reverse.get(target.href);if(previous&&refs.get(previous)?.expires>now()){refs.get(previous).expires=now()+180000;return '/api/live/'+channel+'/media/'+previous;}for(const [id,row]of refs)if(row.expires<now()&&!(row.playlist&&now()-lastActivity<180000)){refs.delete(id);reverse.delete(row.url);}if(refs.size>=500)throw Error('Live relay capacity');const id=randomBytes(24).toString('hex');refs.set(id,{url:target.href,playlist:target.pathname.endsWith('.m3u8'),expires:now()+180000});reverse.set(target.href,id);return '/api/live/'+channel+'/media/'+id;}
 async function segment(url){
  const key=url.href,cached=segments.get(key);if(cached&&cached.expires>now())return cached.data;
  if(segmentFlights.has(key))return segmentFlights.get(key);
  const flight=(async()=>{const data=decodeLiveSegment(await read(url,16777216));for(const [id,row]of segments)if(row.expires<now()){segmentBytes-=row.data.length;segments.delete(id);}while(segmentBytes+data.length>8*1024*1024&&segments.size){const id=segments.keys().next().value;segmentBytes-=segments.get(id).data.length;segments.delete(id);}if(data.length<=8*1024*1024){const old=segments.get(key);if(old)segmentBytes-=old.data.length;segments.set(key,{data,expires:now()+30000});segmentBytes+=data.length;}return data;})();segmentFlights.set(key,flight);try{return await flight;}finally{segmentFlights.delete(key);}
 }
 async function serve(req,res,path){
  if(!mediaRequestAllowed(req)){res.writeHead(403).end();return;}
  try{
   if(path===''){lastActivity=now();const html=(await read(player,1048576)).toString(),src=html.match(/const SRC\s*=\s*("[^"\n]+")/)?.[1];if(!src)throw Error('Live source changed');const discovered=new URL(JSON.parse(src)),approved=await sourceConfig.getHosts();if(discovered.protocol!=='https:'||!approved.includes(discovered.hostname)||discovered.port||discovered.username||discovered.password||discovered.hash||!discovered.pathname.startsWith('/premium'+channel+'/'))throw Error('Unexpected live source');if(edge!==discovered.origin){token='';expires=0;}edge=discovered.origin;res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify({url:register(JSON.parse(src)),streamType:'hls'}));return;}
   const match=path.match(/^\/media\/([a-f0-9]{48})$/),entry=match&&refs.get(match[1]);if(!entry||(entry.expires<now()&&!(entry.playlist&&now()-lastActivity<180000))){res.writeHead(404).end();return;}
   lastActivity=now();entry.expires=now()+180000;const u=new URL(entry.url);if(u.pathname.endsWith('.m3u8')){
    u.searchParams.set('t',await auth());u.searchParams.set('_',now());const text=(await read(u,2097152)).toString();if(!text.startsWith('#EXTM3U'))throw Error('Invalid live playlist');
    const body=text.split(/\r?\n/).map(line=>!line.trim()?line:line.startsWith('#')?line.replace(/URI="([^"]+)"/g,(_,v)=>'URI="'+register(new URL(v,u).href)+'"'):register(new URL(line.trim(),u).href)).join('\n');res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl','Cache-Control':'no-store'}).end(body);
   }else{const data=await segment(u);res.writeHead(200,{'Content-Type':'video/mp2t','Cache-Control':'no-store','Content-Length':data.length}).end(data);}
  }catch(error){console.warn('Live relay:',error.message);token='';res.writeHead(502,{'Content-Type':'application/json'}).end('{"error":"Live stream unavailable. Reload or go back."}');}
 }
 return {serve,register};
}
