import {mountTVLive,tvLiveSession} from '../components/TVLivePlayer.js';
import {mountTVLiveRelay,trialBase} from '../components/TVLiveRelayTrial.js';
import {mountAlternativeLive} from '../components/AlternativeLivePlayer.js';
import {mountLiveMiniGuide} from '../components/LiveMiniGuide.js';
import {createPlaybackIframe} from '../components/playbackIframe.js';
import {trialChannel,channelEmbedUrl} from '../components/liveChannels.js';
import {liveFavourites,toggleLiveFavourite} from '../components/liveCatalogue.js';
import {escapeHtml} from '../components/ui.js';
import {connectLiveRemote} from '../components/liveRemote.js';
export const liveTrialSource=Object.freeze({label:trialChannel.title,url:trialChannel.url,useSandbox:true});
export function LiveTrialPage(state={}){const channel=state.channel||trialChannel;return '<section class="live-trial live-player-shell"><div class="live-trial-bar"><strong>'+escapeHtml(channel.title)+'<small>'+escapeHtml(channel.sports?'MJ PLAY · SPORTS'+(channel.sourceLabel?' · '+channel.sourceLabel:''):'MJ PLAY · LIVE TV')+'</small></strong></div><div data-live-host></div><div class="live-controls" data-focus-row><span class="live-badge"><i></i>LIVE</span><button data-focus="live-toggle" data-live-toggle hidden>Play</button><button data-focus="live-favourite" data-live-favourite>Favourite</button><button data-focus="live-reload" data-live-reload>Reload</button><div class="live-upcoming-strip" data-live-upcoming aria-label="Upcoming programmes"></div><button data-focus="live-previous-channel" data-live-previous-channel>Previous channel</button><p class="live-trial-status live-ready" role="status">Loading channel…</p></div></section>';}
export function mountLiveTrial(root,state={},options={}){
 if(location.protocol==='file:'&&!state.useOriginalLive&&tvLiveSession()&&(!state.channel?.provider||state.channel.provider==='WS_DDL'))return mountTVLive(root,state.channel?state:{...state,channel:trialChannel},options);
 if(state.tvRelayTrial&&trialBase())return mountTVLiveRelay(root,{...state,channel:state.channel||trialChannel},options);
 const channel=state.channel||trialChannel;if(channel.provider&&channel.provider!=='WS_DDL')return mountAlternativeLive(root,{...state,channel},options);const source={label:channel.title,url:channelEmbedUrl(channel.wsNumber||channel.number),useSandbox:true};
 const host=root.querySelector('[data-live-host]'),status=root.querySelector('.live-trial-status'),reload=root.querySelector('[data-live-reload]'),shell=root.querySelector('.live-player-shell');
 const frame=createPlaybackIframe(document,source);frame.name='mj-live-channel-'+channel.number;frame.referrerPolicy='strict-origin-when-cross-origin';frame.removeAttribute('data-focus');frame.tabIndex=-1;
 // Keep remote input in the app, including while the external frame is loading.
 shell.tabIndex=0;shell.setAttribute('data-focus','live-surface');
 let miniGuide;let disposed=false,remote,paused=true,hideTimer,started=false,interacted=false,loadTimer;const controller=new AbortController();
 const toggle=root.querySelector('[data-live-toggle]'),favourite=root.querySelector('[data-live-favourite]');if(channel.sports){favourite.hidden=true;favourite.removeAttribute('data-focus');}
 const reveal=()=>{if(disposed)return;shell.classList.remove('live-ui-hidden');clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!disposed&&!paused&&!miniGuide?.isOpen()){shell.focus({preventScroll:true});shell.classList.add('live-ui-hidden');}},4000);};
 miniGuide=mountLiveMiniGuide(root,{channel,onSwitch:value=>options.onSwitch?.(value),onClose:()=>{shell.focus({preventScroll:true});reveal();}});
 const previousButton=root.querySelector('[data-live-previous-channel]');previousButton.hidden=!!channel.sports||!state.previousChannel;previousButton.onclick=()=>{if(state.previousChannel)options.onSwitch?.(state.previousChannel);};
 const interact=()=>{interacted=true;reveal();};root.addEventListener('pointerdown',interact);root.addEventListener('pointermove',reveal);
 const updateFavourite=()=>{const saved=liveFavourites().has(channel.number);favourite.textContent=saved?'★ Favourite':'☆ Favourite';favourite.setAttribute('aria-pressed',String(saved));};updateFavourite();favourite.onclick=()=>{toggleLiveFavourite(channel.number);updateFavourite();reveal();};
 toggle.onclick=()=>{void remote?.toggle().catch(()=>{});reveal();};
 const keys=e=>{const code=e.keyCode;if(code===461||e.key==='Escape'||e.key==='Backspace'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){if(miniGuide.isOpen())miniGuide.close();else options.onBack?.();}return;}if(miniGuide.isOpen()){reveal();return;}if(!channel.sports&&(code===427||code===428||e.key==='ChannelUp'||e.key==='ChannelDown')){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)miniGuide.adjacent(code===428||e.key==='ChannelDown'?-1:1);return;}interacted=true;reveal();if((code===38||e.key==='ArrowUp')&&document.activeElement===shell){e.preventDefault();e.stopImmediatePropagation();(toggle.hidden?favourite:toggle).focus({preventScroll:true});return;}let action;if(code===415)action='play';else if(code===19)action='pause';else if(code===179||e.key==='MediaPlayPause'||((code===13||e.key==='Enter')&&document.activeElement===shell))action='toggle';if(!action)return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)void remote?.[action]().catch(()=>{});};document.addEventListener('keydown',keys,true);
 const reclaimFocus=()=>{if(!disposed&&document.activeElement===frame)shell.focus({preventScroll:true});};
 const focusChanged=()=>queueMicrotask(reclaimFocus);window.addEventListener('blur',focusChanged);frame.addEventListener('focus',focusChanged);
 frame.onload=()=>{if(!disposed){status.textContent='Loading live player · BACK exits';reclaimFocus();}};host.append(frame);frame.src='about:blank';shell.focus({preventScroll:true});
 void connectLiveRemote(frame,{channelNumber:channel.wsNumber||channel.number,signal:controller.signal,onBack:()=>{if(miniGuide.isOpen())miniGuide.close();else options.onBack?.();},onControls:()=>{reveal();(toggle.hidden?favourite:toggle).focus({preventScroll:true});},onActivity:reveal,onState:value=>{
  if(disposed)return;paused=value.paused;toggle.hidden=false;
  if(toggle.dataset.paused!==String(paused)){toggle.dataset.paused=String(paused);toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+(paused?'<path d="m8 4 13 8-13 8Z"/>':'<path d="M6 4h4v16H6ZM14 4h4v16h-4Z"/>')+'</svg><span>'+(paused?'Play':'Pause')+'</span>';}
  if(value.ready>=2&&value.visible!==false)clearTimeout(loadTimer);status.textContent=value.error?'Playback error · Reload or press BACK':value.ready>=2&&value.visible!==false?(value.height?value.height+'p':'Live')+(paused?' · Paused':''):'Starting channel…';
  if(paused||value.error)reveal();else if(value.ready>=2&&value.visible!==false&&!started){started=true;if(!interacted)shell.focus({preventScroll:true});reveal();}
 }}).then(value=>{if(disposed)value.stop();else{remote=value;frame.src=source.url;}}).catch(()=>{if(!disposed)status.textContent='Player protection unavailable · Reload or press BACK';});
 const failed=()=>{if(disposed||started)return;frame.src='about:blank';status.textContent='This channel did not start. Reload or press BACK to choose another.';reveal();reload.focus({preventScroll:true});};loadTimer=setTimeout(failed,30000);reload.onclick=()=>{if(!disposed){if(!remote){options.onBack?.();return;}clearTimeout(loadTimer);loadTimer=setTimeout(failed,30000);started=false;status.textContent='Reloading channel…';frame.src=source.url;shell.focus({preventScroll:true});reveal();}};
 return ()=>{disposed=true;miniGuide.dispose();previousButton.onclick=null;clearTimeout(loadTimer);clearTimeout(hideTimer);controller.abort();remote?.stop();root.removeEventListener('pointerdown',interact);root.removeEventListener('pointermove',reveal);document.removeEventListener('keydown',keys,true);window.removeEventListener('blur',focusChanged);frame.removeEventListener('focus',focusChanged);reload.onclick=null;toggle.onclick=null;favourite.onclick=null;frame.onload=null;frame.src='about:blank';frame.remove();};
}



