import {mountTVPlayerMenus} from './TVPlayerMenus.js';
import {library} from '../storage/library.js';
import {advanceContinueWatching,finishedMovieProgress} from './continueSeries.js';
import {mountCreditsController} from './creditsController.js';
import {mountIntroPrompt} from './IntroPrompt.js';
import {mountPlaybackLifecycle} from './playbackLifecycle.js';
import {resumePosition} from './resumePosition.js';
import {seekPreview} from './seekPreview.js';
import {mountPlayerRemoteOk} from './playerRemoteOk.js';
import {mountPlaybackExtras} from './PlaybackExtras.js';
import {mountPlayerOverlay} from './playerOverlay.js';
import {progressStore} from '../storage/progress.js';
import {escapeHtml as esc} from './ui.js';
const icon=path=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
const playIcon=icon('M8 5v14l11-7z'),pauseIcon=icon('M6 5h4v14H6zM14 5h4v14h-4z');
export function mountDirectVideoControls(video,panel,{item,season,episode,provider,startAt,isMenuOpen,onNextEpisode,prepareNextEpisode,onOptions,onQuality}){
 const doc=video.ownerDocument;let tvMenus=null;const externalMenu=isMenuOpen;isMenuOpen=()=>externalMenu()||!!tvMenus?.isOpen();
 panel.classList.add('cinema-controls');
 panel.innerHTML=`<div class="cinema-top"><div class="cinema-top-actions" data-focus-row><button data-back data-focus="player-back">${icon('M15 4L7 12l8 8')}Exit</button><button data-focus="direct-restart">${icon('M5 7v5h5M5 12a7 7 0 1 1 2 5')}Play from beginning</button>${item.type==='tv'&&onNextEpisode?`<button data-focus="direct-next">${icon('M5 5v14l10-7zM18 5v14')}Next episode</button>`:''}</div><span class="cinema-brand">MJ <b>PLAY</b></span></div><div class="cinema-bottom"><div class="cinema-heading"><div><p>${item.type==='tv'?`SEASON ${season} · EPISODE ${episode}`:'NOW PLAYING'}</p><h2>${esc(item.title||'')}</h2></div><span class="cinema-quality" data-quality></span></div><button class="cinema-seek" data-focus="direct-seek" role="slider" aria-label="Playback position" aria-valuemin="0"><span class="cinema-track"><span class="cinema-buffer"></span><span class="cinema-progress"></span><span class="cinema-thumb"></span></span></button><div class="cinema-times"><span data-elapsed></span><span data-remaining></span></div><div class="cinema-bottom-actions"><div class="cinema-transport" data-focus-row><button id="player-toggle" data-focus="player-toggle" aria-label="Pause"></button><button data-focus="direct-rewind" aria-label="Rewind 10 seconds">${icon('M4 8v5h5M4 13a8 8 0 1 1 3 6')}<small>10</small></button><button data-focus="direct-forward" aria-label="Forward 10 seconds">${icon('M20 8v5h-5M20 13a8 8 0 1 0-3 6')}<small>10</small></button></div><button class="cinema-quality-action" data-focus="direct-quality" aria-label="Video quality">${icon('M3 5h18v14H3zM7 9v6M7 12h4M11 9v6M15 9h3v6h-3z')}<span data-quality-label>Quality</span></button><button class="cinema-options" data-focus="direct-options">Playback options</button></div><p class="cinema-message" role="status"></p></div>`;
 const bar=panel.querySelector('.cinema-seek'),toggle=panel.querySelector('#player-toggle'),message=panel.querySelector('.cinema-message');
 const format=value=>{const n=Math.floor(Math.max(0,value||0));return (n>=3600?Math.floor(n/3600)+':':'')+String(Math.floor(n/60)%60).padStart(n>=3600?2:1,'0')+':'+String(n%60).padStart(2,'0');};
 let credits=null;
 let continuationBusy=false,continuationQueued=false;
 const queueContinuation=()=>{if(!prepareNextEpisode||item.type!=='tv'||continuationBusy||continuationQueued)return;continuationBusy=true;advanceContinueWatching(item,season,episode,prepareNextEpisode).then(advanced=>{continuationQueued=advanced;}).catch(()=>{}).finally(()=>{continuationBusy=false;});};
 let lastSave=0;const resume=resumePosition(video,startAt);
 let recentRecorded=false;const save=()=>{if(!recentRecorded&&!resume.pending&&video.currentTime>=30&&Number.isFinite(video.duration)&&video.duration-video.currentTime>15){recentRecorded=library.record(item,season,episode);}if(!resume.pending&&Number.isFinite(video.duration)&&video.duration>0)progressStore.save(provider,item,season,episode,{position:Math.min(video.currentTime,video.duration),duration:video.duration,completed:video.ended||!!credits&&video.currentTime>=credits.start});if(!resume.pending&&item.type==='movie'&&Number.isFinite(video.duration)&&video.duration>0&&(video.ended||credits&&video.currentTime>=credits.start||finishedMovieProgress({position:video.currentTime,duration:video.duration})))library.removeRecent('movie',item.tmdbId??item.id);if(!resume.pending&&(video.ended||credits&&video.currentTime>=credits.start||video.duration-video.currentTime<=15))queueContinuation();};
 const stopLifecycle=mountPlaybackLifecycle(video,save);
 let scrub;
 const update=()=>{resume.apply();const duration=Number.isFinite(video.duration)?video.duration:0,position=scrub?.position??video.currentTime??0;let buffered=position;try{if(video.buffered.length)buffered=video.buffered.end(video.buffered.length-1);}catch{}
 bar.style.setProperty('--played',`${duration?position/duration*100:0}%`);bar.style.setProperty('--buffered',`${duration?buffered/duration*100:0}%`);bar.setAttribute('aria-valuemax',String(duration));bar.setAttribute('aria-valuenow',String(Math.floor(position)));bar.setAttribute('aria-valuetext',`${format(position)} of ${format(duration)}`);
 panel.querySelector('[data-elapsed]').textContent=format(position);panel.querySelector('[data-remaining]').textContent='−'+format(duration-position);const height=video.videoHeight;panel.querySelector('[data-quality]').textContent=height?(height>=2160?'4K':height>=1080?'FULL HD':height>=720?'HD':`${height}p`):'';
 const qualityLabel=panel.querySelector('[data-quality-label]');if(qualityLabel)qualityLabel.textContent=height?'Quality · '+height+'p':'Quality';
 toggle.innerHTML=video.paused?playIcon:pauseIcon;toggle.setAttribute('aria-label',video.paused?'Play':'Pause');if(Date.now()-lastSave>5000){save();lastSave=Date.now();}};
 const play=()=>video.play().catch(()=>{message.textContent='Press Play to resume.';});
 scrub=seekPreview(video,{onPreview:update,onCommit:()=>resume.reset()});
 const seek=delta=>scrub.step(delta);
 toggle.onclick=()=>video.paused?play():video.pause();
 const stopRemoteOk=mountPlayerRemoteOk(doc,panel,toggle,{isMenuOpen,onToggle:()=>toggle.onclick()});
 panel.querySelector('[data-focus="direct-rewind"]').onclick=()=>seek(-10);panel.querySelector('[data-focus="direct-forward"]').onclick=()=>seek(10);
 panel.querySelector('[data-focus="direct-restart"]').onclick=()=>{scrub.cancel();resume.reset();video.currentTime=0;if(Number.isFinite(video.duration)&&video.duration>0)progressStore.save(provider,item,season,episode,{position:0,duration:video.duration,completed:false,restarted:true});play();};panel.querySelector('[data-focus="direct-options"]').onclick=onOptions;
 panel.querySelector('[data-focus="direct-quality"]').onclick=onQuality;
 const next=panel.querySelector('[data-focus="direct-next"]');if(next)next.onclick=async()=>{next.disabled=true;message.textContent='Loading next episode…';try{if(!await onNextEpisode())message.textContent='No more episodes available.';}catch{message.textContent='Could not load the next episode. Try again.';next.disabled=false;}finally{next.disabled=false;}};
 bar.onclick=e=>{if(e.detail&&Number.isFinite(video.duration)){const rect=bar.getBoundingClientRect();video.currentTime=Math.max(0,Math.min(video.duration-.1,(e.clientX-rect.left)/rect.width*video.duration));}else toggle.onclick();};
 const keys=e=>{if(isMenuOpen())return;const key=e.key||({37:'ArrowLeft',38:'ArrowUp',39:'ArrowRight'}[e.keyCode]);const prompt=doc.activeElement?.closest?.('[data-playback-prompt]:not([hidden])');if(prompt){if(key==='ArrowUp'||prompt.classList.contains('cinema-skip-intro')&&['ArrowLeft','ArrowRight'].includes(key)){panel.hidden=false;bar.focus();if(key!=='ArrowUp')seek(key==='ArrowLeft'?-10:10);e.preventDefault();e.stopImmediatePropagation();}return;}if(panel.hidden&&key?.startsWith('Arrow')){panel.hidden=false;bar.focus();e.preventDefault();e.stopImmediatePropagation();return;}if((doc.activeElement===bar||!doc.activeElement?.closest('.cinema-controls'))&&(key==='ArrowLeft'||key==='ArrowRight')){seek(key==='ArrowLeft'?-10:10);e.preventDefault();e.stopImmediatePropagation();}};
 const releaseSeek=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)||[37,39].includes(e.keyCode))scrub.commit();};
 doc.addEventListener('keydown',keys,true);doc.addEventListener('keyup',releaseSeek,true);
 const loaded=()=>update();
 const creditsController=mountCreditsController(video,item,season,episode,{onChange:marker=>{credits=marker;video.dataset.creditsStart=marker?String(marker.start):'';video.dataset.creditsSource=marker?.source||'';save();}});
 const events=['timeupdate','progress','play','pause','ended','seeked','resize'];for(const name of events)video.addEventListener(name,update);for(const name of ['pause','seeked','ended'])video.addEventListener(name,save);video.addEventListener('loadedmetadata',loaded);if(video.readyState>=1)loaded();else update();
 const extras=mountPlaybackExtras(video,panel,{item,season,episode,getCredits:()=>credits,onNextEpisode:item.type==='tv'?onNextEpisode:null,isInteracting:()=>scrub.position!==null,prepareNextEpisode:item.type==='tv'?prepareNextEpisode:null,isMenuOpen});
 const qualityAction=panel.querySelector('[data-focus="direct-quality"]'),subtitleAction=panel.querySelector('[data-focus="subtitle-menu"]');if(qualityAction&&subtitleAction)subtitleAction.insertAdjacentElement('afterend',qualityAction);
 if(globalThis.location?.protocol==='file:')tvMenus=mountTVPlayerMenus(panel,{item,season,episode});
 const introPrompt=mountIntroPrompt(video,panel,{item,season,episode,isBlocked:()=>isMenuOpen()||extras.keepVisible()||scrub.position!==null,onSeek:()=>{scrub.cancel();resume.reset();}});
 const stopOverlay=mountPlayerOverlay(doc,panel,()=>scrub.position!==null||isMenuOpen()||extras.keepVisible()||video.paused||video.ended);
 return ()=>{tvMenus?.dispose();introPrompt.dispose();creditsController.dispose();stopLifecycle();stopRemoteOk();scrub.cancel();save();extras.dispose();stopOverlay();doc.removeEventListener('keydown',keys,true);doc.removeEventListener('keyup',releaseSeek,true);video.removeEventListener('loadedmetadata',loaded);for(const name of events)video.removeEventListener(name,update);for(const name of ['pause','seeked','ended'])video.removeEventListener(name,save);};
}






