import {tmdb} from '../services/tmdb.js';
import {createPlaybackProvider,playbackConfig,selectedPlaybackProvider} from '../config/playback.js';
import {hasReadyDirectStream} from './directStreamCache.js';
import {captureOnTV} from './tvLocalCapture.js';
import {createPlaybackIframe} from './playbackIframe.js';

// Opportunistic, silent preparation. Never interact with verification challenges.
export function mountDirectPreparation(root,type,id){
 if(selectedPlaybackProvider()!=='direct-trial')return ()=>{};
 let disposed=false,frame,controller,timer,poll,busy=false,serial=0,lastKey;
 const clear=()=>{clearTimeout(timer);clearInterval(poll);controller?.abort();frame?.remove();frame=null;};
 const prepare=async button=>{
  const season=Number(button?.dataset.season)||1,episode=Number(button?.dataset.episode)||1;
  const key=`${season}/${episode}`;if(key===lastKey)return;lastKey=key;
  clear();const current=++serial;controller=new AbortController();const signal=controller.signal;
  try{
   const item=await tmdb.details(type,id);if(disposed||current!==serial||hasReadyDirectStream(item,season,episode))return;
   const provider=createPlaybackProvider({...playbackConfig,provider:'primary',providers:{...playbackConfig.providers,primary:{...playbackConfig.providers.primary,autoNext:false,autoplay:'0'}}});
   const values={...item,season,episode},source=type==='tv'?await provider.getEpisodeUrl(values):await provider.getMovieUrl(values);
   if(disposed||current!==serial)return;
   frame=createPlaybackIframe(root.ownerDocument||document,source);
   frame.removeAttribute('data-focus');frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
   frame.setAttribute('allow',"autoplay 'none'; fullscreen; encrypted-media");
   frame.style.cssText='position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0';
   root.append(frame);frame.src=source.url;
   const deadline=Date.now()+15000;
   poll=setInterval(async()=>{
    if(disposed||current!==serial||busy)return;
    if(Date.now()>deadline){clear();return;}
    busy=true;
    try{if(await captureOnTV(item,season,episode,{signal}))clear();}catch{}finally{busy=false;}
   },750);
  }catch{if(current===serial)clear();}
 };
 const schedule=button=>{clearTimeout(timer);timer=setTimeout(()=>prepare(button),400);};
 const focus=e=>{const button=e.target.closest?.('[data-play]');if(button)schedule(button);};
 root.addEventListener('focusin',focus);
 const initial=root.querySelector('[data-focus="detail-continue"], [data-focus="detail-play"]');if(initial)schedule(initial);
 return ()=>{disposed=true;serial++;root.removeEventListener('focusin',focus);clear();};
}

