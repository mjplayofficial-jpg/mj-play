import {mountLiveWatchBrowse} from './LiveWatchBrowse.js';
import {bindFullscreenShortcut} from './playerShortcuts.js';
import {playbackAllowed,trackUsage} from '../firebaseClient.js';
import {attachWebSource} from './webPlayerSupport.js';
import {mountLiveMiniGuide} from './LiveMiniGuide.js';
import {liveFavourites,toggleLiveFavourite} from './liveCatalogue.js';
import {bindLiveBack} from './liveBack.js';
export function mountWebLive(root,state,options={}){
 const usageType=state.channel?.sports?'sport':'live';
 if(!playbackAllowed(usageType==='sport'?'sports':'live')){root.querySelector('.live-trial-status').textContent='Live playback is temporarily paused for maintenance.';return()=>{};}
 trackUsage('playback_requested',{content_type:usageType});
 const channel=state.channel,number=Number(channel.wsNumber||channel.number),host=root.querySelector('[data-live-host]'),shell=root.querySelector('.live-player-shell'),status=root.querySelector('.live-trial-status'),toggle=root.querySelector('[data-live-toggle]'),reload=root.querySelector('[data-live-reload]'),favourite=root.querySelector('[data-live-favourite]'),previous=root.querySelector('[data-live-previous-channel]');
 const video=document.createElement('video');video.className='alternative-live-media';video.dataset.usageType=usageType;video.playsInline=true;video.muted=false;video.volume=1;video.autoplay=true;host.append(video);shell.tabIndex=0;toggle.hidden=false;previous.hidden=true;
 const paths={Play:'M8 5v14l11-7Z',Pause:'M7 5v14M17 5v14',Favourite:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z',Reload:'M4 4v6h6M4 10a8 8 0 1 1 1 8',Upcoming:'M4 5h16v16H4ZM8 3v4M16 3v4M4 10h16M8 14h3M8 17h6'};
 const iconButton=(button,label,path=paths[label])=>{button.setAttribute('aria-label',label);button.title=label;button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg><span class="web-live-control-label">'+label+'</span>';};iconButton(reload,'Reload');
 const notice=document.createElement('div');notice.className='web-live-notice';notice.setAttribute('role','status');host.append(notice);const updateNotice=()=>{const text=status.textContent.trim();notice.textContent=text==='LIVE · MJ PLAYER'?'':text;notice.hidden=!notice.textContent;};const noticeObserver=new MutationObserver(updateNotice);noticeObserver.observe(status,{childList:true,subtree:true,characterData:true});
 let disposed=false,attempt=0,timer;const guide=mountLiveMiniGuide(root,{channel,onSwitch:options.onSwitch});
 const back=bindLiveBack(document,()=>options.onBack?.()),exit=document.createElement('button');exit.className='web-live-back';exit.setAttribute('aria-label',channel.sports?'Back to streams':'Back to channels');exit.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg><span>Back</span>';exit.onclick=()=>back.back();shell.append(exit);if(channel.sports)favourite.hidden=true;
 const strip=root.querySelector('[data-live-upcoming]'),guideButton=document.createElement('button');guideButton.className='web-live-guide-toggle';iconButton(guideButton,'Upcoming');guideButton.setAttribute('aria-expanded','false');if(strip&&!channel.sports){strip.before(guideButton);guideButton.onclick=()=>{const open=shell.classList.toggle('web-live-guide-open');guideButton.setAttribute('aria-expanded',String(open));reveal();};}
 const browse=mountLiveWatchBrowse(shell,channel,options.onSwitch);
 let request;
 const reveal=()=>{shell.classList.remove('live-ui-hidden');clearTimeout(timer);timer=setTimeout(()=>{if(!disposed&&!video.paused&&!shell.classList.contains('web-live-guide-open'))shell.classList.add('live-ui-hidden');},4000);};
 const fullscreen=document.createElement('button');fullscreen.className='web-live-fullscreen';fullscreen.setAttribute('aria-label','Fullscreen');fullscreen.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';root.querySelector('.live-controls').append(fullscreen);
 fullscreen.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(shell.requestFullscreen)await shell.requestFullscreen({navigationUI:'hide'});else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();else status.textContent='Fullscreen is unavailable in this browser.';}catch{status.textContent='Fullscreen was blocked. Try again.';}reveal();};
 const stopFullscreenShortcut=bindFullscreenShortcut(document,()=>fullscreen.click()); const fullscreenChanged=()=>{fullscreen.setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Fullscreen');reveal();};document.addEventListener('fullscreenchange',fullscreenChanged);
 const soundPlay=async()=>{video.muted=false;try{await video.play();status.textContent='LIVE · MJ PLAYER';}catch{status.textContent='Press Play to start with sound.';reveal();}};
 const paint=()=>{iconButton(toggle,video.paused?'Play':'Pause');if(!video.paused){delete video.dataset.webError;status.textContent='LIVE · MJ PLAYER';}reveal();};iconButton(toggle,'Play');video.onplaying=paint;video.onpause=paint;video.onerror=()=>{if(!disposed){status.textContent='Live stream unavailable. Reload or go back.';iconButton(toggle,'Play');reveal();}};
 const fresh=async()=>{request?.abort();request=new AbortController();const timer=setTimeout(()=>request.abort(),35000);try{const r=await fetch('/api/live/'+number,{signal:request.signal});if(!r.ok)throw Error();return {...await r.json(),live:true,refresh:fresh};}finally{clearTimeout(timer);}};
 const load=async()=>{const current=++attempt;video.__mjDispose?.();video.__mjHls?.destroy();status.textContent='Loading live channel…';reveal();try{const source=await fresh();if(disposed||current!==attempt)return;await attachWebSource(video,source);if(disposed||current!==attempt)return;await soundPlay();}catch{if(!disposed&&current===attempt){status.textContent='Live stream unavailable. Reload or go back.';reveal();}}};
 toggle.onclick=()=>{if(video.paused)void soundPlay();else video.pause();};reload.onclick=load;
 const paintFavourite=()=>{const saved=liveFavourites().has(channel.number);iconButton(favourite,saved?'Favourite saved':'Favourite',paths.Favourite);favourite.setAttribute('aria-pressed',String(saved));};paintFavourite();favourite.onclick=()=>{toggleLiveFavourite(channel.number);paintFavourite();reveal();};
 const revealEvents=['pointermove','pointerdown','touchstart','click'];for(const event of revealEvents)shell.addEventListener(event,reveal,{capture:true,passive:true});void load();
 return()=>{stopFullscreenShortcut();disposed=true;attempt++;request?.abort();clearTimeout(timer);noticeObserver.disconnect();notice.remove();for(const event of revealEvents)shell.removeEventListener(event,reveal,true);document.removeEventListener('fullscreenchange',fullscreenChanged);fullscreen.remove();guideButton.remove();back.dispose();exit.remove();guide.dispose();browse.dispose();video.__mjDispose?.();video.__mjHls?.destroy();video.pause();video.removeAttribute('src');video.load();video.remove();toggle.onclick=reload.onclick=favourite.onclick=null;};
}



