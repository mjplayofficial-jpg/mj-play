import {startNormalProviderPlayback} from './providerAutoStart.js';
import {boundedFetch} from '../services/boundedFetch.js';
import {parseSubtitle,subtitleIdentity} from '../services/englishSubtitles.js';
// Experimental: requires the TV's existing Developer Mode inspector.
// Only inspect this app; retain title-bound sources in memory, never on disk.
import {directTrialKey} from '../providers/DirectTrialProvider.js';

export async function captureOnTV(item,season,episode,{signal,autoStart=false,sourceProvider='primary'}={}){
 const key=directTrialKey(item.type,{...item,season,episode});
 const response=await fetch('http://127.0.0.1:9998/json/list',{signal});
 if(!response.ok)throw Error('TV-local capture unavailable');
 const targets=await response.json();
 const target=targets.find(t=>{try{const u=new URL(t.url);return u.protocol==='file:'&&u.pathname.includes('/com.mjentertainment.mjplay/');}catch{return false;}});
 if(!target?.webSocketDebuggerUrl)throw Error('App inspector unavailable');
 const address=new URL(target.webSocketDebuggerUrl);
 address.hostname='127.0.0.1';address.port='9998';
 const socket=new WebSocket(address.href),pending=new Map(),contexts=[];
 let id=0;
 const close=()=>socket.close();
 signal?.addEventListener('abort',close,{once:true});
 const call=(method,params={})=>new Promise((resolve,reject)=>{
  const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error('Capture timed out'));},4000);
  pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params}));
 });
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error('Capture unavailable')):p.resolve(m.result);}}else if(m.method==='Runtime.executionContextCreated')contexts.push(m.params.context);};
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Local inspector unavailable')),4000);socket.onopen=()=>{clearTimeout(timer);resolve();};socket.onerror=()=>{clearTimeout(timer);reject(Error('Local inspector unavailable'));};});
  if(signal?.aborted)return false;
  await call('Runtime.enable');
  const urls=[];
  for(const context of contexts){
   if(signal?.aborted)return false;
   const result=await call('Runtime.evaluate',{contextId:context.id,returnByValue:true,expression:'(()=>{const c=window.CONFIG||(()=>{try{const u=new URL(window.CFG?.playerUrl,location.href),m=u.pathname.match(/^\\/embed\\/player\\/(tv|movie)\\/([^/]+)(?:\\/(\\d+)\\/(\\d+))?$/);if(u.origin!==location.origin||!m)return null;return {mediaType:m[1],imdb:m[2],season:Number(m[3]),episode:Number(m[4])};}catch{return null;}})();if(!c||!["movie","tv"].includes(c.mediaType))return null;return {type:c.mediaType,id:c.imdb||c.mediaId,season:Number(c.season),episode:Number(c.episode),subtitles:performance.getEntriesByType("resource").map(r=>r.name).filter(u=>/\\.(srt|vtt)(?:$|\\?)/i.test(u)).slice(-8),urls:performance.getEntriesByType("resource").map(r=>r.name).filter(u=>/\\.m3u8(?:$|\\?)/i.test(u)).slice(-4)};})()'});
   const v=result?.result?.value;
   if(!v)continue;
   let candidate;try{candidate=directTrialKey(v.type,{imdbId:v.id,season:v.season,episode:v.episode});}catch{continue;}
   if(candidate===key){
    urls.push(...v.urls);
    const english=v.subtitles?.find(value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&/(?:^|[._/-])(?:eng|en|english)(?:[._/-]|$)/i.test(u.pathname);}catch{return false;}});
    if(english){globalThis.__mjProviderEnglish??=Object.create(null);const identity=subtitleIdentity(item,season,episode);
     for(const id of Object.keys(globalThis.__mjProviderEnglish))if(id!==identity&&(globalThis.__mjProviderEnglish[id].expiresAt<Date.now()||Object.keys(globalThis.__mjProviderEnglish).length>=3))delete globalThis.__mjProviderEnglish[id];
     if(!globalThis.__mjProviderEnglish[identity]||globalThis.__mjProviderEnglish[identity].expiresAt<Date.now())globalThis.__mjProviderEnglish[identity]={expiresAt:Date.now()+900000,promise:boundedFetch(english,{signal,timeoutMs:4000,credentials:'omit'}).then(r=>r.ok?{cues:parseSubtitle(r.text),release:'Stream English',fileId:'stream',source:'Stream'}:null).catch(()=>null)};
    }
    if(autoStart&&!signal?.aborted)await call('Runtime.evaluate',{contextId:context.id,returnByValue:true,expression:`(${startNormalProviderPlayback.toString()})()`});
   }
  }
  const candidates=[];
  for(const value of new Set(urls)){
   const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)continue;
   try{
    const r=await boundedFetch(url.href,{credentials:'omit',signal,timeoutMs:5000});if(!r.ok)continue;
    const text=r.text;if(!text.startsWith('#EXTM3U'))continue;
    const source=selectDirectVariant(text,url.href,codecs=>!globalThis.document||!!document.createElement('video').canPlayType(`video/mp4; codecs="${codecs}"`));if(!source)continue;
    if(signal?.aborted)return false;
    const lines=text.split(/\r?\n/);let height=0,bandwidth=0;
    for(let i=1;i<lines.length;i++){try{if(!lines[i].startsWith('#')&&new URL(lines[i].trim(),url.href).href===source){height=Number(lines[i-1].match(/RESOLUTION=\d+x(\d+)/)?.[1]||0);bandwidth=Number(lines[i-1].match(/BANDWIDTH=(\d+)/)?.[1]||0);}}catch{}}
    const variants=directVariants(text,url.href,codecs=>!globalThis.document||!!document.createElement('video').canPlayType('video/mp4; codecs="'+codecs+'"'));const adaptive=variants.length>1&&variants.length===(text.match(/^#EXT-X-STREAM-INF:/gm)||[]).length;candidates.push({url:source,height,bandwidth,variants,adaptive,masterUrl:url.href});
   }catch{if(signal?.aborted)return false;}
  }
  candidates.sort((a,b)=>b.height-a.height||b.bandwidth-a.bandwidth);
  if(!candidates.length||signal?.aborted)return false;
  globalThis.__mjDirectTrialSources??=Object.create(null);
  globalThis.__mjDirectTrialSources[key]={...candidates[0],sourceProvider,expiresAt:Date.now()+900000};
  return true;
 }finally{
  signal?.removeEventListener('abort',close);close();
  for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Capture closed'));}pending.clear();
 }
}

export function directVariants(text,base,supports=()=>true){
 const lines=text.split(/\r?\n/),variants=[];
 for(let i=0;i<lines.length;i++){
  if(!lines[i].startsWith('#EXT-X-STREAM-INF:'))continue;
  const m=lines[i].match(/RESOLUTION=(\d+)x(\d+)/);let j=i+1;
  while(j<lines.length&&(!lines[j].trim()||lines[j].startsWith('#')))j++;
  if(!m||!lines[j])continue;
  const codecs=lines[i].match(/CODECS="([^"]+)"/)?.[1];if(codecs&&!supports(codecs))continue;
  const url=new URL(lines[j].trim(),base);
  if(url.protocol==='https:'&&!url.username&&!url.password)variants.push({height:Number(m[2]),bandwidth:Number(lines[i].match(/BANDWIDTH=(\d+)/)?.[1]||0),url:url.href});
 }
 variants.sort((a,b)=>b.height-a.height||b.bandwidth-a.bandwidth);
 return variants;
}
export function selectDirectVariant(text,base,supports=()=>true,{adaptive=false}={}){const variants=directVariants(text,base,supports);if(adaptive&&variants.length>1&&variants.length===(text.match(/^#EXT-X-STREAM-INF:/gm)||[]).length)return base;return variants[0]?.url||(text.includes('#EXTINF:')?base:null);
}
