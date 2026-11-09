import Hls from 'hls.js';
import {bindFullscreenShortcut} from './playerShortcuts.js';
import {createStreamRecovery} from './streamRecovery.js';
import {tmdb} from '../services/tmdb.js';
import {escapeHtml,artwork} from './ui.js';
export async function attachWebSource(video,source){
 const hlsSource=source.streamType==='hls'||/\.m3u8(?:[?#]|$)/i.test(source.url);
 if(source.subtitles?.length||hlsSource)video.crossOrigin='anonymous';
 for(const value of source.subtitles||[]){const track=video.ownerDocument.createElement('track');track.kind='subtitles';track.label=value.label||'English';track.srclang=value.language||'en';track.src=value.url;video.append(track);}
 if(hlsSource&&Hls.isSupported()){
  const hls=new Hls({maxBufferLength:30,backBufferLength:15});video.__mjHls=hls;
  const candidates=[...new Set([source.url,...(source.candidates||[])])];let index=0;
  await new Promise((resolve,reject)=>{
   let disposed=false,restore=null,renewalTimer,lastTime=video.currentTime,lastProgress=Date.now();
   const fail=()=>{if(disposed)return;clearTimeout(timer);clearTimeout(renewalTimer);video.dataset.webError='Stream recovery failed. Retry or choose another server.';reject(Error(video.dataset.webError));video.dispatchEvent(new Event('error'));};
   const recovery=source.refresh?createStreamRecovery({refresh:source.refresh,snapshot:()=>restore||({time:source.live?-1:video.currentTime||0,paused:video.paused}),reload:async(fresh,state)=>{restore=state;delete video.dataset.webError;clearTimeout(renewalTimer);renewalTimer=setTimeout(fail,30000);hls.loadSource(fresh.url);lastProgress=Date.now();},onFailure:fail}):null;
   const timer=setTimeout(()=>{if(recovery)void recovery.recover();else fail();},45000);
   const resume=()=>{if(!restore||disposed)return;const state=restore;restore=null;clearTimeout(renewalTimer);if(state.time>0)video.currentTime=state.time;if(!state.paused)void video.play().catch(()=>{});};
   video.addEventListener('loadedmetadata',resume);video.addEventListener('canplay',resume);
   const watchdog=setInterval(()=>{if(disposed||video.paused||video.ended||video.seeking)return;if(video.currentTime>lastTime+.1){lastTime=video.currentTime;lastProgress=Date.now();}else if(Date.now()-lastProgress>25000){lastProgress=Date.now();if(recovery)void recovery.recover();}},5000);
   video.__mjDispose=()=>{disposed=true;clearTimeout(timer);clearTimeout(renewalTimer);clearInterval(watchdog);recovery?.dispose();video.removeEventListener('loadedmetadata',resume);video.removeEventListener('canplay',resume);};
   hls.on(Hls.Events.MANIFEST_PARSED,()=>{clearTimeout(timer);if(restore)hls.startLoad(restore.time);resolve();});
   hls.on(Hls.Events.ERROR,(_,error)=>{if(!error.fatal||disposed)return;video.dataset.webFailureDetail=String(error.details||'stream error')+' '+String(error.reason||error.error?.message||'').replace(/https?:\\S+/g,'[URL]')+(error.response?.code?' HTTP '+error.response.code:'');if(error.type===Hls.ErrorTypes.NETWORK_ERROR&&index<candidates.length-1){hls.loadSource(candidates[++index]);return;}if(recovery&&(error.type===Hls.ErrorTypes.NETWORK_ERROR||error.type===Hls.ErrorTypes.MEDIA_ERROR)){void recovery.recover();return;}fail();});
   hls.loadSource(source.url);hls.attachMedia(video);
  });
 }else video.src=source.url;
}
export function addWebPlayerActions(video,panel,{item,season,episode}={}){
 video.dataset.usageType=item?.type==='tv'?'tv':'movie';
 const mobile=matchMedia('(max-width: 1000px), (max-width: 1400px) and (pointer: coarse)');
 const settings=video.ownerDocument.createElement('button');settings.className='web-player-settings';settings.setAttribute('aria-label','Player settings');settings.setAttribute('aria-expanded','false');settings.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 17h16M9 4v6M15 14v6"/></svg>';
 const sheet=video.ownerDocument.createElement('div');sheet.className='web-player-sheet';
 const close=video.ownerDocument.createElement('button');close.textContent='Done';close.className='web-player-sheet-close';
 const applyMobile=()=>{panel.classList.toggle('web-touch-player',mobile.matches);};applyMobile();mobile.addEventListener('change',applyMobile);
 const setOpen=value=>{panel.classList.toggle('web-settings-open',value);settings.setAttribute('aria-expanded',String(value));if(value)sheet.setAttribute('data-modal','');else sheet.removeAttribute('data-modal');};settings.onclick=()=>setOpen(!panel.classList.contains('web-settings-open'));close.onclick=()=>setOpen(false);
 for(const element of [panel.querySelector('.cinema-extras'),panel.querySelector('.cinema-quality-action'),panel.querySelector('.cinema-options')])if(element)sheet.append(element);
 const handle=video.ownerDocument.createElement('button');handle.className='web-sheet-handle';handle.setAttribute('aria-label','Close player settings');handle.innerHTML='<span></span>';sheet.prepend(handle);
 const dismissSheet=()=>{sheet.querySelector('[data-focus="subtitle-close"]')?.click();sheet.querySelector('#quality-return')?.click();setOpen(false);};
 handle.onclick=dismissSheet;
 let sheetDrag=null;
 const resetSheetDrag=()=>{sheetDrag=null;sheet.style.transform='';sheet.classList.remove('web-sheet-dragging');};
 const sheetDown=e=>{if(e.pointerType==='mouse'||!mobile.matches)return;sheetDrag={id:e.pointerId,y:e.clientY,distance:0};handle.setPointerCapture(e.pointerId);sheet.classList.add('web-sheet-dragging');};
 const sheetMove=e=>{if(!sheetDrag||e.pointerId!==sheetDrag.id)return;sheetDrag.distance=Math.max(0,e.clientY-sheetDrag.y);sheet.style.transform='translateY('+sheetDrag.distance+'px)';};
 const sheetUp=e=>{if(!sheetDrag||e.pointerId!==sheetDrag.id)return;const dismiss=sheetDrag.distance>=60;resetSheetDrag();if(dismiss)dismissSheet();};
 handle.addEventListener('pointerdown',sheetDown);handle.addEventListener('pointermove',sheetMove);handle.addEventListener('pointerup',sheetUp);handle.addEventListener('pointercancel',resetSheetDrag);
 sheet.append(close);panel.querySelector('.cinema-bottom').append(sheet);panel.querySelector('.cinema-bottom-actions').append(settings);
 let drawer=null,drawerDisposed=false,drawerRequest=0;
 const episodesButton=docButton('Episodes','M3 4h18v4H3ZM3 11h18v4H3ZM3 18h18v3H3Z');
 function docButton(label,path){const b=video.ownerDocument.createElement('button');b.className='web-player-episodes';b.setAttribute('aria-label',label);b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';return b;}
 if(item?.type==='tv'){
  drawer=video.ownerDocument.createElement('div');drawer.className='web-episode-drawer';drawer.hidden=true;panel.append(drawer);panel.querySelector('.cinema-bottom-actions').insertBefore(episodesButton,settings);
  const closeDrawer=()=>{drawer.hidden=true;drawer.removeAttribute('data-modal');episodesButton.focus();};
  const load=async selected=>{const request=++drawerRequest;drawer.innerHTML='<div class="web-drawer-top"><h3>Episodes</h3><button class="web-drawer-close" aria-label="Close episodes">Close</button></div><p role="status">Loading episodes…</p>';drawer.querySelector('button').onclick=closeDrawer;
   try{const data=await tmdb.seasonDetails(item.tmdbId??item.id,selected);if(drawerDisposed||request!==drawerRequest)return;drawer.innerHTML='<div class="web-drawer-top"><h3>'+escapeHtml(item.title)+'</h3><button class="web-drawer-close" aria-label="Close episodes">Close</button></div><label class="web-drawer-season">Season <select aria-label="Season">'+(item.seasons||[{season_number:season,name:'Season '+season}]).filter(s=>s.season_number>0).map(s=>'<option value="'+s.season_number+'" '+(s.season_number===selected?'selected':'')+'>'+escapeHtml(s.name||'Season '+s.season_number)+'</option>').join('')+'</select></label><div class="web-drawer-episodes">'+(data.episodes||[]).map(ep=>'<button class="web-drawer-episode" data-play="tv/'+(item.tmdbId??item.id)+'" data-season="'+selected+'" data-episode="'+ep.episode_number+'" '+(selected===season&&ep.episode_number===episode?'aria-current="true"':'')+'><img loading="lazy" src="'+artwork(ep.still_path,'w300')+'" alt=""><span><strong>'+ep.episode_number+'. '+escapeHtml(ep.name)+'</strong><small>'+(selected===season&&ep.episode_number===episode?'Now playing · ':'')+(ep.runtime?ep.runtime+' min':'')+'</small></span></button>').join('')+'</div>';drawer.querySelector('.web-drawer-close').onclick=closeDrawer;drawer.querySelector('select').onchange=e=>load(Number(e.target.value));
   }catch{if(!drawerDisposed&&request===drawerRequest)drawer.querySelector('[role="status"]').textContent='Episodes could not load. Close and try again.';}
  };
  episodesButton.onclick=()=>{setOpen(false);drawer.hidden=false;drawer.setAttribute('data-modal','');void load(Number(season)||1);};
 }
 const modalObserver=new MutationObserver(()=>{if(panel.hidden&&panel.querySelector('[data-modal]'))panel.hidden=false;});modalObserver.observe(panel,{attributes:true,attributeFilter:['hidden']});
 const seekBar=panel.querySelector('.cinema-seek');let dragging=false;
 const seekTouch=e=>{if(!mobile.matches||!Number.isFinite(video.duration))return;const rect=seekBar.getBoundingClientRect();video.currentTime=Math.max(0,Math.min(video.duration-.1,(e.clientX-rect.left)/rect.width*video.duration));};
 const down=e=>{if(e.pointerType==='mouse')return;dragging=true;seekBar.setPointerCapture(e.pointerId);seekTouch(e);};const move=e=>{if(dragging)seekTouch(e);};const up=()=>{dragging=false;};seekBar.addEventListener('pointerdown',down);seekBar.addEventListener('pointermove',move);seekBar.addEventListener('pointerup',up);seekBar.addEventListener('pointercancel',up);
 const doc=video.ownerDocument,row=panel.querySelector('.cinema-bottom-actions'),button=doc.createElement('button');button.dataset.focus='web-fullscreen';button.className='web-fullscreen';button.setAttribute('aria-label','Fullscreen');button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
 button.onclick=()=>{const shell=panel.parentElement;if(!doc.fullscreenElement&&!shell.requestFullscreen){panel.querySelector('.cinema-message').textContent='Fullscreen is unavailable in this browser.';return;}const action=doc.fullscreenElement?doc.exitFullscreen():shell.requestFullscreen();action?.catch(()=>{panel.querySelector('.cinema-message').textContent='Fullscreen was blocked by this browser.';});};row.append(button);
 const stopFullscreenShortcut=bindFullscreenShortcut(doc,()=>button.click());
 const space=e=>{if(e.code!=='Space'||e.repeat||doc.querySelector('[data-modal]')||/INPUT|TEXTAREA|SELECT|BUTTON/.test(doc.activeElement?.tagName||''))return;e.preventDefault();if(video.paused)void video.play().catch(()=>{});else video.pause();};doc.addEventListener('keydown',space);
 return()=>{stopFullscreenShortcut();drawerDisposed=true;drawerRequest++;modalObserver.disconnect();drawer?.remove();episodesButton.remove();mobile.removeEventListener('change',applyMobile);seekBar.removeEventListener('pointerdown',down);seekBar.removeEventListener('pointermove',move);seekBar.removeEventListener('pointerup',up);seekBar.removeEventListener('pointercancel',up);doc.removeEventListener('keydown',space);button.remove();settings.remove();sheet.remove();};
}






