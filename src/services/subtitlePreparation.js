import {fetchEnglishSubtitle,subtitleEdition} from './englishSubtitles.js';
const pending=new Map();
// Share preparation with the player so a handoff never downloads the same file twice.
export function prepareEnglishSubtitle(item,season,episode,{duration}={}){
 if(!Number.isFinite(duration)||duration<=0)return Promise.resolve(null);
 const key=subtitleEdition(item,season,episode,duration);
 if(pending.has(key))return pending.get(key);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 const request=fetchEnglishSubtitle(item,season,episode,{signal:controller.signal,duration}).finally(()=>{clearTimeout(timer);pending.delete(key);});
 pending.set(key,request);return request;
}
