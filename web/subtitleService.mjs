import {fetchEnglishSubtitle,subtitleKey} from '../src/services/englishSubtitles.js';
export function createSubtitleService({key,token,fetcher=fetch}){
 const memory=new Map(),pending=new Map();
 const storage={getItem:k=>k===subtitleKey?key:memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 return async(type,id,season,episode,{duration,alternate=false}={})=>{
  if(!key)throw Error('English subtitle service is not configured.');
  if(!['movie','tv'].includes(type)||!/^\d{1,10}$/.test(String(id))||Number(id)<1||type==='tv'&&![season,episode].every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid subtitle title.');
  if(!Number.isFinite(duration)||duration<=0||duration>86400)throw Error('Invalid playback duration.');
  const identity=[type,id,season,episode,Math.round(duration),alternate].join('/');
  if(pending.has(identity))return pending.get(identity);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  const request=fetchEnglishSubtitle({type,tmdbId:Number(id)},season,episode,{duration,alternate,signal:controller.signal,storage,fetcher:(url,options={})=>fetcher(url,{...options,redirect:'error',headers:{...options.headers,'User-Agent':'MJPlay v1.3.27',...(new URL(url).hostname==='api.opensubtitles.com'&&token?{Authorization:'Bearer '+token}:{})}})}).finally(()=>{clearTimeout(timer);pending.delete(identity);});
  pending.set(identity,request);return request;
 };
}
