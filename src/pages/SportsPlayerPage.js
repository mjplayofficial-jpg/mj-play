import {streamLabel} from './SportsPage.js';
import {escapeHtml as esc} from '../components/ui.js';
import {createPlaybackIframe} from '../components/playbackIframe.js';
import {validateSportsEmbed} from '../services/sportsCipher.js';
import {connectSportsRemote} from '../components/sportsRemote.js';
export function sportsCountdown(event,now=Date.now()){const seconds=Math.max(0,Math.ceil((event.starts-now)/1000));return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');}
export function SportsPlayerPage({event,source}={}){return `<section class="sports-player live-player-shell"><div data-sports-player-host></div><div class="sports-player-heading"><span class="sports-provider-tag">${esc(source?streamLabel(source):'Sports')}</span><h1>${esc(event?.title||'Live sports')}</h1></div><div class="sports-player-controls" data-focus-row><button data-focus="sports-player-back" data-back>Other streams</button><button data-focus="sports-player-toggle" data-sports-toggle hidden>Pause</button><button data-focus="sports-player-interact" data-sports-interact>Use player</button><button data-focus="sports-player-reload" data-sports-reload>Reload</button><p data-sports-player-status role="status">Connecting to your match… · BACK returns</p></div></section>`;}
export function mountSportsPlayer(root,state,{onBack}={}){
 const shell=root.querySelector('.sports-player'),host=root.querySelector('[data-sports-player-host]'),status=root.querySelector('[data-sports-player-status]'),toggle=root.querySelector('[data-sports-toggle]'),interact=root.querySelector('[data-sports-interact]'),reload=root.querySelector('[data-sports-reload]');
 const url=validateSportsEmbed(state.source?.url,state.source?.provider);if(!url){status.textContent='This stream cannot be opened. Press BACK to choose another.';return ()=>{};}
 if(state.source.provider==='S8'&&state.event.starts>Date.now()){
  const countdown=document.createElement('div');countdown.className='sports-countdown';host.append(countdown);interact.hidden=reload.hidden=true;
  let childCleanup,connected=false;const paint=()=>{if(connected)return;if(state.event.starts<=Date.now()){connected=true;clearInterval(timer);document.removeEventListener('keydown',back,true);countdown.remove();interact.hidden=reload.hidden=false;childCleanup=mountSportsPlayer(root,state,{onBack});return;}countdown.textContent='Kickoff in '+sportsCountdown(state.event);status.textContent='Waiting for scheduled kickoff · BACK returns';};const timer=setInterval(paint,1000);
  const back=e=>{if(e.keyCode===461||['Escape','Backspace'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)onBack?.();}};document.addEventListener('keydown',back,true);root.querySelector('[data-back]')?.focus({preventScroll:true});
  paint();return ()=>{clearInterval(timer);document.removeEventListener('keydown',back,true);countdown.remove();childCleanup?.();};
 }
 const frame=createPlaybackIframe(document,{url,label:state.event.title,useSandbox:true});frame.name='mj-sports-embed';frame.referrerPolicy='strict-origin-when-cross-origin';frame.removeAttribute('data-focus');frame.tabIndex=-1;frame.style.visibility='hidden';
 shell.tabIndex=0;shell.dataset.focus='sports-player-surface';let disposed=false,remote,hiddenTimer,paused=true,manual=false,verified=false,ready=false,timeout;const controller=new AbortController();
 const reveal=()=>{shell.classList.remove('sports-ui-hidden');clearTimeout(hiddenTimer);if(!manual&&!paused)hiddenTimer=setTimeout(()=>{if(!disposed){shell.focus({preventScroll:true});shell.classList.add('sports-ui-hidden');}},4000);};
 const focus=e=>{if(!disposed&&!manual&&document.activeElement===frame)shell.focus({preventScroll:true});};window.addEventListener('blur',focus);
 const keys=e=>{if(e.keyCode===461||e.key==='Escape'||e.key==='Backspace'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)onBack?.();return;}reveal();if((e.key==='ArrowUp'||e.keyCode===38)&&document.activeElement===shell){e.preventDefault();e.stopImmediatePropagation();(toggle.hidden?interact:toggle).focus({preventScroll:true});}else if((e.key==='Enter'||e.keyCode===13)&&document.activeElement===shell){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)void remote?.toggle().catch(()=>{});}};document.addEventListener('keydown',keys,true);
 interact.onclick=()=>{manual=true;shell.classList.add('sports-manual');shell.classList.add('sports-ui-hidden');frame.focus();};toggle.onclick=()=>{manual=false;shell.classList.remove('sports-manual');void remote?.toggle().catch(()=>{});reveal();};
 reload.onclick=()=>{if(!remote)return;ready=false;clearTimeout(timeout);timeout=setTimeout(failLoading,30000);manual=false;verified=false;shell.classList.remove('sports-manual');status.textContent='Reconnecting… · BACK returns';frame.style.visibility='hidden';frame.src=url;shell.focus({preventScroll:true});reveal();};host.append(frame);shell.focus({preventScroll:true});
 void connectSportsRemote(frame,state.source,{signal:controller.signal,onBack,onState:v=>{if(disposed)return;if(v.isolated||v.verification)frame.style.visibility='visible';
  if(v.verification){paused=true;toggle.hidden=true;status.textContent='Complete the verification with your pointer. Select Use player · BACK returns.';if(!verified){verified=true;reveal();}return;}
  if(v.hasVideo){ready=v.ready>=2&&v.visibleChain===true;if(ready)clearTimeout(timeout);toggle.hidden=false;paused=v.paused;toggle.textContent=paused?'Play':'Pause';status.textContent=v.error?'Stream unavailable · choose Other streams':v.ready>=2?`${v.height||''}${v.height?'p · ':''}${paused?'Paused':'Live'}`:'Preparing the stream… · BACK returns';if(ready&&manual){manual=false;shell.classList.remove('sports-manual');shell.focus({preventScroll:true});reveal();}if(ready&&!hiddenTimer)reveal();}
  else if(v.waiting)status.textContent='This source has no active player right now. Choose another stream.';
 }}).then(value=>{if(disposed)value.stop();else {remote=value;frame.src=url;}}).catch(()=>{if(!disposed)status.textContent='Protected player could not connect. Press BACK and try another stream.';});
 const failLoading=()=>{if(disposed||ready||verified)return;frame.src='about:blank';status.textContent='This stream did not start. Retry with Reload or choose Other streams.';toggle.hidden=true;reveal();reload.focus({preventScroll:true});};root.addEventListener('pointermove',reveal);timeout=setTimeout(failLoading,30000);
 return ()=>{disposed=true;clearTimeout(timeout);clearTimeout(hiddenTimer);controller.abort();remote?.stop();window.removeEventListener('blur',focus);document.removeEventListener('keydown',keys,true);root.removeEventListener('pointermove',reveal);interact.onclick=reload.onclick=toggle.onclick=null;frame.src='about:blank';frame.remove();};
}





