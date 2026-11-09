import {qualitySource,qualityChoices,qualityPreference,setQualityPreference} from '../components/videoQuality.js';
import {protectedStorage as localStorage} from '../storage/protectedStorage.js';
import {mountLoadingCancel} from '../components/loadingCancel.js';
import {prepareDirectVideo} from '../components/DirectHandoff.js';
import {prepareEnglishSubtitle} from '../services/subtitlePreparation.js';
import {hasReadyDirectStream} from '../components/directStreamCache.js';
import {mountPlayerOverlay} from '../components/playerOverlay.js';
import {watchPlayback} from '../components/PlaybackDiagnostics.js';
import {mountProviderRemote} from '../components/providerRemote.js';
import {directTrialKey} from '../providers/DirectTrialProvider.js';
import {mountDirectVideoControls} from '../components/DirectVideoControls.js';
import {captureOnTV} from '../components/tvLocalCapture.js';


import {progressStore} from '../storage/progress.js';
import {readEpisodeProgressEvent,resumable} from '../components/PlaybackProgress.js';
import {createPlaybackIframe} from '../components/playbackIframe.js';
import {keepPlayerRemoteFocus} from '../components/playerFocus.js';
import {library} from '../storage/library.js';
import {playbackProvider,selectedPlaybackProvider,selectPlaybackProvider,createPlaybackProvider,playbackConfig,isDirectPlaybackProvider,directEmbedProvider} from '../config/playback.js';
import {providerOptions} from '../config/testProviders.js';
import {escapeHtml as esc,artwork} from '../components/ui.js';
export function PlayerPage(state){
 const iframe=playbackProvider.capabilities.playerType==='iframe';
 return `<section class="player-page"><div id="player-host"></div><div id="player-status" class="player-status"><div class="spinner"></div><h2>Starting playback…</h2><button data-focus="player-loading-back" data-back>Back</button></div>${iframe?`<button class="iframe-back" data-focus="iframe-back" data-back aria-label="Back to details">← Back</button>`:`<div class="player-controls"><p class="eyebrow">${esc(playbackProvider.capabilities.name)}</p><h2>${esc(state.item?.title||'Playback')}</h2><p>Press OK to pause or resume; Left / Right seeks 10 seconds. BACK returns to details.</p><div class="actions" data-focus-row><button data-focus="player-toggle" id="player-toggle">Pause / Resume</button><button data-focus="player-back" data-back>Back</button></div></div>`}</section>`;
}
export function mountPlayer(state,root,{onNextEpisode,prepareNextEpisode,onCancel}={}){const host=root.querySelector('#player-host'),status=root.querySelector('#player-status');let activeProvider=playbackProvider,directBypassed=false,preparingDirect=false;let disposed=false,timeout,readyTimer,media,attempt=0,stopRemoteFocus=()=>{},stopProgress=()=>{},stopDiagnostics=()=>{},controls=null,stopControls=()=>{},recovery=null,menuOpen=false,qualityPaused=false;
 const loading=()=>{const item=state.item||{};return `<div class="direct-loading"><img class="direct-loading-art" src="${esc(artwork(item.backdrop||item.poster,'w1280'))}" alt=""><div class="direct-loading-content"><p class="eyebrow">MJ PLAY</p><h2>${esc(item.title||'Playback')}</h2><p>${item.type==='tv'?`Season ${state.season} · Episode ${state.episode}`:'Starting your movie'}</p><div class="spinner"></div><span>Preparing playback…</span><button data-focus="player-loading-back" data-back>Back</button></div></div>`;};

 const initialSaved=progressStore.latest(playbackProvider.capabilities.name,state.item,state.season,state.episode);
 const requestedResume=state.restart?0:resumable(initialSaved)?initialSaved.position:0;
 try{if(isDirectPlaybackProvider()&&localStorage.getItem('mj-subtitle-language')!=='off')prepareEnglishSubtitle(state.item,state.season,state.episode).catch(()=>{});}catch{}
 const tools=document.createElement('div');tools.className='playback-recovery';tools.innerHTML='<button data-focus="player-help" id="player-help">Playback options</button>';host.parentElement?.append(tools);
 const stopOverlay=mountPlayerOverlay(document,tools,()=>menuOpen); let directRequest=null; let fallbackServer=isDirectPlaybackProvider()?directEmbedProvider():selectedPlaybackProvider();
 const remember=()=>{if(!state.item)return;const saved=progressStore.latest(activeProvider.capabilities.name,state.item,state.season,state.episode);const position=controls?.getCurrentTime?.()??(media?.tagName==='VIDEO'?media.currentTime:null)??(resumable(saved)?saved.position:null);if(Number.isFinite(position)&&position>=0)recovery={position,season:state.season,episode:state.episode};};
 const options=()=>{if(disposed)return;status.classList.remove('quality-popover');menuOpen=true;status.setAttribute?.('data-modal','');stopRemoteFocus();stopRemoteFocus=()=>{};status.hidden=false;status.innerHTML=`<h2>Playback options</h2><p>${esc(state.item?.title||'Playback')}${state.item?.type==='tv'?` · S${state.season} E${state.episode}`:''}</p><div class="actions" data-focus-row><button id="player-retry" data-focus="player-retry">Retry</button><button id="player-switch" data-focus="player-switch">Switch Server</button>${media?.tagName==='IFRAME'?'<button id="player-try-direct" data-focus="player-try-direct">Try Direct Player</button>':''}${isDirectPlaybackProvider()?'<button id="player-fallback" data-focus="player-fallback">Play with VidSrc</button>':''}${media&&(media.tagName!=='IFRAME'||!isDirectPlaybackProvider())?'<button id="player-close-options" data-focus="player-close-options">Continue</button>':''}<button data-focus="player-options-back" data-back>Back</button></div>`;root.querySelector('#player-retry').onclick=()=>{remember();start();};root.querySelector('#player-switch').onclick=chooseServer; const tryDirect=root.querySelector('#player-try-direct');if(tryDirect)tryDirect.onclick=requestDirect;const fallback=root.querySelector('#player-fallback');if(fallback)fallback.onclick=()=>{remember();selectPlaybackProvider('primary');directBypassed=true;state.restart=false;start();};const close=root.querySelector('#player-close-options');if(close)close.onclick=()=>{menuOpen=false;status.removeAttribute?.('data-modal');status.hidden=true;if(media?.tagName==='IFRAME')stopRemoteFocus=keepPlayerRemoteFocus(document,media,controls?host:(root.querySelector('.iframe-back')||tools.querySelector('#player-help')));else root.querySelector('#player-toggle')?.focus();};root.querySelector('#player-retry').focus();};
 function chooseQuality(){
 if(media?.tagName!=='VIDEO')return;
 menuOpen=true;status.hidden=false;status.classList.add('quality-popover');status.setAttribute('data-modal','');
 const entry=globalThis.__mjDirectTrialSources?.[directTrialKey(state.item.type,{...state.item,season:state.season,episode:state.episode})]||{};
 const choices=qualityChoices(entry),selected=qualityPreference();
 status.innerHTML=`<div class="quality-menu-heading"><div><h2>Video quality</h2><p>${choices.length?'Available for this stream':'Single quality stream'}</p></div><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM7 9v6m0-3h4m0-3v6m4-6h3v6h-3z"/></svg></div><div class="quality-menu-list">${choices.map(([id,label])=>`<button data-focus="quality-${id}" data-video-quality="${id}" aria-pressed="${id===selected||(selected!=='auto'&&id!=='auto'&&qualitySource(entry,id)===qualitySource(entry,selected))}"><span>${esc(label)}<small>${id==='auto'?'Adjusts to your connection':Number(id)>=1080?'Full HD':Number(id)>=720?'HD':'Lower data use'}</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg></button>`).join('')}</div><button data-focus="quality-return" id="quality-return">Done</button>`;
 root.querySelectorAll('[data-video-quality]').forEach(button=>{button.onclick=()=>{qualityPaused=media.paused;remember();try{setQualityPreference(button.dataset.videoQuality);}catch{status.insertAdjacentHTML('afterbegin','<p>Could not save quality. Try again.</p>');return;}state.restart=false;start();};});
 root.querySelector('#quality-return').onclick=()=>{menuOpen=false;status.hidden=true;status.classList.remove('quality-popover');status.removeAttribute('data-modal');(root.querySelector('[data-focus="tv-player-settings"]')||root.querySelector('[data-focus="direct-quality"]'))?.focus();};
 (root.querySelector('[data-video-quality][aria-pressed="true"]')||root.querySelector('[data-video-quality]')||root.querySelector('#quality-return')).focus();
 }
 function chooseServer(){status.innerHTML=`<h2>Switch Server</h2><p>Continue this title${state.item?.type==='tv'?` · S${state.season} E${state.episode}`:''} with another server.</p><div class="recovery-servers" data-focus-row>${providerOptions.filter(([id])=>id!=='demo').map(([id,name])=>`<button data-focus="recover-${id}" data-recovery-server="${id}" aria-pressed="${id===selectedPlaybackProvider()}">${esc(name)}${id===selectedPlaybackProvider()?' · Active':''}</button>`).join('')}</div><button id="player-options-return" data-focus="player-options-return">Back to options</button>`;root.querySelectorAll?.('[data-recovery-server]').forEach(button=>{button.onclick=()=>{remember();try{if(!isDirectPlaybackProvider())fallbackServer=selectedPlaybackProvider();selectPlaybackProvider(button.dataset.recoveryServer);directBypassed=false;state.restart=false;start();}catch{fail('Could not save your server choice. Try again.');}};});root.querySelector('#player-options-return').onclick=options;root.querySelector('[data-recovery-server]')?.focus();}
 tools.querySelector?.('#player-help')?.addEventListener('click',options);
 let captureAbort=null,captureBusy=false,lastCapture=0,handoffAbort=null,captureRun=0;
 function requestDirect(){
  if(media?.tagName!=='IFRAME')return;
  captureAbort?.abort();captureAbort=new AbortController();lastCapture=0;
  directRequest={key:directTrialKey(state.item.type,{...state.item,season:state.season,episode:state.episode}),deadline:Date.now()+45000};
  if(!isDirectPlaybackProvider())fallbackServer=selectedPlaybackProvider();menuOpen=false;status.removeAttribute?.('data-modal');status.hidden=false;status.innerHTML=loading();
  tools.querySelector('#player-help').textContent='Preparing direct player…';
 }
 const directTimer=setInterval(()=>{
  if(disposed||!directRequest)return;
  let key;try{key=directTrialKey(state.item.type,{...state.item,season:state.season,episode:state.episode});}catch{directRequest=null;return;}
  if(key!==directRequest.key){directRequest=null;tools.querySelector('#player-help').textContent='Playback options';return;}
  const entry=globalThis.__mjDirectTrialSources?.[key];
  if((!entry||(entry.sourceProvider||'primary')!==fallbackServer||entry.expiresAt<=Date.now())&&!captureBusy&&Date.now()-lastCapture>500&&captureAbort){
   captureBusy=true;lastCapture=Date.now();const job=directRequest,run=++captureRun;
   captureOnTV(state.item,state.season,state.episode,{signal:captureAbort.signal,autoStart:true,sourceProvider:fallbackServer}).then(captured=>{if(captured&&!disposed&&directRequest===job)activateDirect();}).catch(()=>{}).finally(()=>{if(run===captureRun)captureBusy=false;});
  }
  if(entry&&(entry.sourceProvider||'primary')===fallbackServer&&entry.expiresAt>Date.now())activateDirect();
  else if(Date.now()>directRequest.deadline){directRequest=null;captureAbort?.abort();if(preparingDirect){preparingDirect=false;fail('Playback could not be prepared. Retry or choose Play with VidSrc.');return;}options();status.insertAdjacentHTML?.('afterbegin','<p>Direct capture is unavailable. TV Developer Mode is required for local capture. You can continue using this server.</p>');tools.querySelector('#player-help').textContent='Playback options';}
 },250);
  async function activateDirect(){
  if(handoffAbort||media?.tagName!=='IFRAME'||!directRequest)return;
  const key=directRequest.key,frame=media,current=attempt;
  const entry=globalThis.__mjDirectTrialSources?.[key];if(!entry)return;
  handoffAbort=new AbortController();directRequest=null;
  tools.querySelector('#player-help').textContent='Preparing playback…';
  const getPosition=()=>{
   const live=controls?.getCurrentTime?.()??progressStore.latest(activeProvider.capabilities.name,state.item,state.season,state.episode)?.position;
   const saved=progressStore.latest('Direct · Experimental',state.item,state.season,state.episode);
   if(state.restart)return Number.isFinite(live)?live:0;
   if(recovery)return recovery.position;
   if(preparingDirect)return requestedResume;
   return Number.isFinite(live)?live:resumable(saved)?saved.position:0;
  };
  try{
   const video=await prepareDirectVideo(document,host,qualitySource(entry),{getPosition,signal:handoffAbort.signal});
   if(disposed||current!==attempt||media!==frame){video.pause();video.removeAttribute('src');video.load();video.remove();return;}
   directBypassed=false;selectPlaybackProvider(fallbackServer==='vsembed-embed'?'vsembed':'direct-trial');start(video);
  }catch{
   if(disposed||current!==attempt)return;
   delete globalThis.__mjDirectTrialSources?.[key];preparingDirect=false;fail('Playback could not be prepared. Retry or choose Play with VidSrc.');
   tools.querySelector('#player-help').textContent='Playback options';
  }finally{handoffAbort=null;}
 }
 function release(preserveVideo){captureRun++;captureBusy=false;lastCapture=0;status.classList.remove('quality-popover');clearTimeout(readyTimer);status.classList.remove('player-ready');handoffAbort?.abort();handoffAbort=null;captureAbort?.abort();captureAbort=null;directRequest=null;const help=tools.querySelector?.('#player-help');if(help)help.textContent='Playback options';menuOpen=false;status.removeAttribute?.('data-modal');stopControls();stopControls=()=>{};controls?.dispose?.();controls=null;stopDiagnostics();stopDiagnostics=()=>{};stopProgress();stopProgress=()=>{};stopRemoteFocus();stopRemoteFocus=()=>{};clearTimeout(timeout);status.classList.remove('embed-verification');if(media){media.onplaying=media.onwaiting=media.onerror=media.onended=media.onload=null;if(media.tagName==='VIDEO'){media.pause();media.removeAttribute('src');media.load();}else media.src='about:blank';media.remove();media=null;}if(!preserveVideo)host.replaceChildren();}
 const fail=(message='The player could not start. Check the connection and try again.')=>{if(disposed)return;if(media?.tagName==='VIDEO'&&isDirectPlaybackProvider()){try{delete globalThis.__mjDirectTrialSources?.[directTrialKey(state.item.type,{...state.item,season:state.season,episode:state.episode})];}catch{}}remember();attempt++;release();options();status.insertAdjacentHTML?.('afterbegin',`<h1>Playback unavailable</h1><p>${esc(message)}</p>`);};
 async function start(preparedVideo){release(preparedVideo);activeProvider=playbackProvider;preparingDirect=false;if(isDirectPlaybackProvider()){fallbackServer=directEmbedProvider();if(directBypassed||!hasReadyDirectStream(state.item,state.season,state.episode,Date.now(),fallbackServer)){preparingDirect=!directBypassed;activeProvider=createPlaybackProvider({...playbackConfig,provider:fallbackServer,providers:{...playbackConfig.providers,primary:{...playbackConfig.providers.primary,autoNext:false}}});}}const current=++attempt;status.hidden=false;status.innerHTML=loading();timeout=setTimeout(()=>fail(),20000);
  try{const item=state.item||{};if(!['movie','tv'].includes(item.type))throw new Error('Unsupported media type');if(navigator.onLine===false)throw new Error('Network offline');console.info('Playback request',{provider:activeProvider.capabilities.name,contentType:item.type,tmdbId:item.tmdbId,imdbId:item.imdbId,season:state.season,episode:state.episode,playerType:activeProvider.capabilities.playerType});const saved=progressStore.latest(activeProvider.capabilities.name,item,state.season,state.episode);const startAt=(activeProvider.capabilities.supportsProgress)?(recovery&&recovery.season===state.season&&recovery.episode===state.episode?recovery.position:state.restart?0:requestedResume|| (resumable(saved)?saved.position:saved?0:undefined)):undefined;if(state.restart&&saved)progressStore.save(activeProvider.capabilities.name,item,state.season,state.episode,{position:0,duration:saved.duration,completed:false,restarted:true,restarted:true});const request={...item,season:state.season,episode:state.episode,startAt};const source=item.type==='tv'?await activeProvider.getEpisodeUrl(request):await activeProvider.getMovieUrl(request);if(disposed||current!==attempt)return;
   const kind=source.playerType||source.kind;if(kind!==activeProvider.capabilities.playerType)throw new Error('Provider player type mismatch');
   const url=new URL(source.url);if(url.protocol!=='https:'||url.username||url.password)throw new Error('Invalid playback URL');
   
   if(kind==='video'){
    let panel=root.querySelector('.player-controls');
    if(!panel){panel=document.createElement('div');panel.className='player-controls';panel.innerHTML=`<p class="eyebrow">${esc(source.label||'Direct playback')}</p><h2>${esc(item.title||'Playback')}</h2><p>OK pauses or resumes. Left / Right seeks 10 seconds.</p><div class="actions" data-focus-row><button data-focus="player-toggle" id="player-toggle">Pause / Resume</button><button data-focus="player-back" data-back>Back</button></div>`;host.parentElement.append(panel);panel.querySelector('#player-toggle').onclick=toggle;}
    panel.hidden=false;const embedBack=root.querySelector('.iframe-back');if(embedBack)embedBack.hidden=true;
    const video=preparedVideo||document.createElement('video');media=video;video.muted=false;if(preparedVideo){video.style.opacity='1';video.style.pointerEvents='auto';}video.id='video';video.playsInline=true;video.preload='auto';
    if(isDirectPlaybackProvider())stopProgress=mountDirectVideoControls(video,panel,{item,season:state.season,episode:state.episode,provider:activeProvider.capabilities.name,startAt:preparedVideo?Math.max(startAt||0,preparedVideo.currentTime||0):startAt,isMenuOpen:()=>menuOpen,onNextEpisode,prepareNextEpisode,onOptions:options,onQuality:chooseQuality});
    video.onplaying=()=>{if(current!==attempt)return;clearTimeout(timeout);if(menuOpen)return;const loadingFocused=status.contains(document.activeElement);status.classList.add('player-ready');clearTimeout(readyTimer);readyTimer=setTimeout(()=>{if(current!==attempt)return;status.hidden=true;status.classList.remove('player-ready');},180);if(loadingFocused)root.querySelector("#player-toggle").focus();};
    video.onwaiting=()=>{if(current!==attempt)return;clearTimeout(readyTimer);status.classList.remove('player-ready');status.hidden=false;status.innerHTML='<div class="spinner"></div><h2>Buffering..</h2>';clearTimeout(timeout);timeout=setTimeout(()=>fail(),20000);};
    video.onerror=()=>fail();video.onended=()=>{root.querySelector('#player-toggle')?.setAttribute('aria-label','Play again');};if(!preparedVideo){host.append(video);video.src=url.href;}await video.play();if(qualityPaused){qualityPaused=false;video.pause();status.hidden=true;}if(preparedVideo)video.onplaying();
   }else if(kind==='iframe'){
    const panel=root.querySelector('.player-controls');if(panel)panel.hidden=true;const embedBack=root.querySelector('.iframe-back');if(embedBack)embedBack.hidden=false;
    const frame=createPlaybackIframe(document,source);media=frame;stopDiagnostics=watchPlayback(frame,url.origin,{provider:activeProvider.capabilities.name,contentType:item.type,tmdbId:item.tmdbId,season:state.season,episode:state.episode});
    if(activeProvider.capabilities.supportsRemoteControls){
     controls=activeProvider.createControls?.({media:frame,source});
     if(controls){
      if(state.restart&&saved)progressStore.save(activeProvider.capabilities.name,item,state.season,state.episode,{position:0,duration:saved.duration,completed:false,restarted:true,restarted:true});
      host.tabIndex=-1;host.setAttribute('aria-label','Playback remote controls');
      const stopKeys=mountProviderRemote(document,host,controls,activeProvider.capabilities);
      let lastSave=0;
      const stopUpdates=controls.subscribe?.(value=>{if(disposed||current!==attempt)return;const now=Date.now();if(value.event==='timeupdate'&&now-lastSave<5000)return;lastSave=now;if(!progressStore.save(activeProvider.capabilities.name,item,state.season,state.episode,{position:value.currentTime,duration:value.duration,completed:value.completed}))console.warn('Playback progress could not be saved.');})||(()=>{});
      stopControls=()=>{stopKeys();stopUpdates();};
     }
    }
    if(activeProvider.capabilities.supportsProgress&&!controls){
     if(state.restart&&saved)progressStore.save(activeProvider.capabilities.name,item,state.season,state.episode,{position:0,duration:saved.duration,completed:false,restarted:true});
     let received=false;
     const onProgress=event=>{if(disposed||current!==attempt||preparingDirect||handoffAbort)return;const progress=activeProvider.readProgress?activeProvider.readProgress(event,frame,item,state.season,state.episode):readEpisodeProgressEvent(event,frame,url.origin,item,state.season,state.episode,source.autoNext);if(!progress)return;const {value,season,episode}=progress;if(value.position>=30&&!value.completed&&!library.record(item,season,episode))console.warn('Could not save viewing history');if(!received){received=true;console.info('Validated provider progress received.');}if(source.autoNext&&item.type==='tv'&&!value.completed&&(season!==state.season||episode!==state.episode)){state.season=season;state.episode=episode;state.restart=false;console.info('Provider episode transition',{season,episode});}if(!progressStore.save(activeProvider.capabilities.name,item,season,episode,value))console.warn('Playback progress could not be saved.');};
     window.addEventListener('message',onProgress);stopProgress=()=>window.removeEventListener('message',onProgress);
    }
    frame.onerror=()=>fail();frame.onload=()=>{if(current!==attempt)return;

     // Load means the provider document opened, not that media has started.
     // Leave provider controls unobstructed; parent cannot inspect frame content.
     clearTimeout(timeout);if(menuOpen)return;status.hidden=!(preparingDirect||handoffAbort);stopRemoteFocus();if(!preparingDirect&&!handoffAbort)stopRemoteFocus=keepPlayerRemoteFocus(document,frame,controls?host:(root.querySelector(".iframe-back")||tools.querySelector('#player-help')));controls?.requestStatus?.();};host.append(frame);frame.src=url.href;if(preparingDirect){clearTimeout(timeout);requestDirect();}
   }else throw new Error('Unsupported player type');
  }catch(e){if(disposed||current!==attempt)return;console.warn('Playback unavailable:',e.name);fail(e.message?.startsWith('No captured stream')?e.message:e.message==='Playback provider not configured'?'Playback provider not configured.':'The player could not start. Check the connection or provider configuration.');}
 }
 const toggle=()=>{if(media?.tagName==='VIDEO'){if(media.paused)media.play().catch(()=>fail());else media.pause();}};
 const toggleButton=root.querySelector('#player-toggle');if(toggleButton)toggleButton.onclick=toggle;
 const stopLoadingCancel=mountLoadingCancel(document,{isLoading:()=>!disposed&&!menuOpen&&!status.hidden,onCancel,cancel:()=>{disposed=true;attempt++;clearInterval(directTimer);release();onCancel?.();}});
 const loadingFocus=setInterval(()=>{if(!disposed&&!menuOpen&&!status.hidden&&media?.tagName==='IFRAME'&&document.activeElement===media)(status.querySelector('button')||tools.querySelector('#player-help'))?.focus({preventScroll:true});},100);
 const remote=e=>{if(e.defaultPrevented||document.activeElement?.closest?.('[data-playback-prompt]:not([hidden])'))return;const controlled=(media?.tagName==='VIDEO'?media:null);if(!controlled||menuOpen)return;if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&!document.activeElement?.closest('.cinema-controls')&&Number.isFinite(controlled.duration)){e.preventDefault();controlled.currentTime=Math.max(0,Math.min(controlled.duration-.1,controlled.currentTime+(e.key==='ArrowLeft'?-10:10)));return;}if(e.keyCode===415){e.preventDefault();controlled.play().catch(()=>fail());}if(e.keyCode===19){e.preventDefault();controlled.pause();}};document.addEventListener('keydown',remote);start();return ()=>{stopLoadingCancel();clearInterval(loadingFocus);disposed=true;attempt++;document.removeEventListener('keydown',remote);clearInterval(directTimer);directRequest=null;stopOverlay();tools.remove();release();};
}




































