import {channelFrameIds,liveAdPatterns,cleanLiveDocument} from './liveCapture.js';
export function liveFrameLayout(){
 const clean=()=>{for(const frame of document.querySelectorAll?.('iframe[srcdoc]')||[]){if(!/thatdisform\.cyou/i.test(frame.srcdoc||''))continue;const parent=frame.parentElement;if(parent?.classList?.contains('notranslate'))parent.remove();else frame.remove();}};
 clean();if(typeof MutationObserver==='function'&&!window.__mjLiveOverlayObserver){window.__mjLiveOverlayObserver=new MutationObserver(clean);window.__mjLiveOverlayObserver.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['srcdoc']});}
 if(document.querySelector('#mj-live-frame-layout')||!document.head)return;
 const style=document.createElement('style');style.id='mj-live-frame-layout';
 style.textContent='html,body{margin:0!important;padding:0!important;width:100%!important;height:100%!important;background:#000!important;overflow:hidden!important}html,body,iframe,video,#player,.jwplayer,.jw-wrapper,.jw-media,:focus{outline:none!important;outline-offset:0!important;border:0!important;box-shadow:none!important}body>iframe,iframe#thatframe,#player{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important}';
 document.head.append(style);
 style.textContent+='iframe[srcdoc]{display:none!important;pointer-events:none!important}';
}
// Change the media element without invoking provider mute/recovery callbacks.
export function setLiveMuted(muted){
 const v=document.querySelector('video');if(!v)return;
 const state=window.__mjLiveRemoteState||(window.__mjLiveRemoteState={});state.muted=muted;
 const btn=document.querySelector('#unmute');if(btn)btn._lwSound=!muted;
 // Time spent muted must not count as stalled audio after unmuting.
 v._lwAudioAt=null;v._lwAudioBytes=v.webkitAudioDecodedByteCount;
 v.muted=muted;
}
// Optional control only. The iframe owns playback even if this connection fails.
export function liveRemoteState(channelNumber=38){
 if(location.hostname!=='dembed.st'||location.pathname!=='/premiumtv/daddy.php'||new URLSearchParams(location.search).get('id')!==String(channelNumber))return null;
 const state=window.__mjLiveRemoteState||(window.__mjLiveRemoteState={attempts:0,last:0,started:false});
 const unmute=()=>{const video=document.querySelector('video'),button=document.querySelector('#unmute');if(!video)return;const now=Date.now();if(state.audioVideo!==video){state.audioVideo=video;state.audioDeadline=now+20000;state.audioLast=0;state.audioStable=0;state.unmutedVideo=null;}if(now>state.audioDeadline||state.audioStable&&now-state.audioStable>=5000)return;
  if(!video.muted&&video.volume>0){if(!video.paused&&video.readyState>=2)state.audioStable=state.audioStable||now;if(state.unmutedVideo===video)return;}else state.audioStable=0;
  if(now-state.audioLast<1000&&(!button||state.unmutedVideo===video))return;state.audioLast=now;
  if(button&&typeof button.click==='function'){state.unmutedVideo=video;button.click();}else{try{const p=typeof jwplayer==='function'?jwplayer('player'):null;p?.setMute?.(false);p?.setVolume?.(100);}catch{}}
  video._lwAudioAt=null;video.muted=false;video.volume=1;
 };
 if(!state.observer&&typeof MutationObserver==='function'){state.observer=new MutationObserver(unmute);state.observer.observe(document.documentElement,{childList:true,subtree:true});}
 unmute();
 const v=document.querySelector('video');if(!v)return null;
 if(v.readyState>=2&&document.createElement&&!document.querySelector('#mj-live-ui')){const style=document.createElement('style');style.id='mj-live-ui';style.textContent='.jw-controls,.jw-overlays,.jw-logo,#unmute{display:none!important}#player video{object-fit:contain!important}';document.head.append(style);}
 if(!v.paused&&v.readyState>=2)state.started=true;
 if(!state.started&&state.attempts<3&&Date.now()-state.last>=2000){state.last=Date.now();state.attempts++;v.muted=false;v.volume=1;try{const p=typeof jwplayer==='function'?jwplayer('player'):null;if(p?.setMute)p.setMute(false);if(p?.setVolume)p.setVolume(100);if(p?.play)p.play(true);else v.play().catch(()=>{});}catch{}}
 if(!state.keys){state.keys=true;document.addEventListener('keydown',e=>{
  const code=e.keyCode;let action;
  if(code===461||e.key==='Escape'||e.key==='Backspace')action='back';
  else if(code===415)action='play';else if(code===19)action='pause';else if(code===179||e.key==='MediaPlayPause')action='toggle';
  else if((code===13||e.key==='Enter')&&!e.target?.closest?.('button,a,input,select,[role="button"]'))action='toggle';
  else if(code===38||e.key==='ArrowUp')action='controls';
 if(!action||typeof window.__mjLiveRemoteKey!=='function')return;e.preventDefault();e.stopImmediatePropagation();if(action==='controls'){const style=document.querySelector('#mj-live-ui');if(style)style.disabled=false;}if(!e.repeat)window.__mjLiveRemoteKey(action);
 },true);document.addEventListener('pointermove',()=>{if(typeof window.__mjLiveRemoteKey==='function'&&Date.now()-(state.activity||0)>1500){state.activity=Date.now();window.__mjLiveRemoteKey('activity');}},true);}
 const box=v.getBoundingClientRect?.();return {paused:v.paused,ready:v.readyState,muted:v.muted,height:v.videoHeight,visible:box?box.width>0&&box.height>0&&getComputedStyle(v).visibility!=='hidden':false,error:v.error?.code};
}
export async function connectLiveRemote(frame,{channelNumber=38,signal,onState,onBack,onControls,onActivity}={}){
 const socketAbort=new AbortController(),timeout=setTimeout(()=>socketAbort.abort(),4000);
 const abortFetch=()=>socketAbort.abort();signal?.addEventListener('abort',abortFetch,{once:true});
 let response;try{response=await fetch('http://127.0.0.1:9998/json/list',{signal:socketAbort.signal});}finally{clearTimeout(timeout);signal?.removeEventListener('abort',abortFetch);}
 if(!response.ok)throw Error('TV controls unavailable');
 const target=(await response.json()).find(t=>t.url?.startsWith('file:')&&t.url.includes('/com.mjentertainment.mjplay/'));
 if(!target?.webSocketDebuggerUrl||signal?.aborted)throw Error('TV controls unavailable');
 const address=new URL(target.webSocketDebuggerUrl);address.hostname='127.0.0.1';address.port='9998';
 const socket=new WebSocket(address.href),pending=new Map(),contexts=new Map();let serial=0,timer,closed=false,busy=false,active,lastRead=0,playing=false,windowLayoutAt=0;
 const call=(method,params={})=>new Promise((resolve,reject)=>{if(closed)return reject(Error('Closed'));const id=++serial,timeout=setTimeout(()=>{pending.delete(id);reject(Error('Control timeout'));},4000);pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));});
 const command=action=>active?call('Runtime.evaluate',{contextId:active,expression:`(()=>{const v=document.querySelector('video');if(!v)return;const action=${JSON.stringify(action)},style=document.querySelector('#mj-live-ui');if(action==='provider'){if(style)style.disabled=!style.disabled;return;}if(style)style.disabled=false;if(action==='mute'){(${setLiveMuted.toString()})(!v.muted);return;}const play=action==='play'||(action==='toggle'&&v.paused);window.__mjLiveRemoteState.started=true;if(play){v.muted=window.__mjLiveRemoteState.muted===true;v.play().catch(()=>{});}else v.pause();})()`}):Promise.resolve();
 const stop=()=>{if(closed)return;if(socket.readyState===1)socket.send(JSON.stringify({id:++serial,method:'Fetch.disable'}));closed=true;clearInterval(timer);signal?.removeEventListener('abort',stop);socket.close();for(const p of pending.values()){clearTimeout(p.timeout);p.reject(Error('Closed'));}pending.clear();};
 signal?.addEventListener('abort',stop,{once:true});
 socket.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){clearTimeout(p.timeout);pending.delete(m.id);m.error?p.reject(Error('Control unavailable')):p.resolve(m.result);return;}const d=m.params||{};
  if(m.method==='Fetch.requestPaused')void (async()=>{try{if(d.responseStatusCode!==undefined){if(d.responseStatusCode!==200){await call('Fetch.continueRequest',{requestId:d.requestId});return;}const body=await call('Fetch.getResponseBody',{requestId:d.requestId});const html=body.base64Encoded?new TextDecoder().decode(Uint8Array.from(atob(body.body),c=>c.charCodeAt(0))):body.body;const clean=cleanLiveDocument(html);if(!clean.includes('id="mj-live-video"')){await call('Fetch.continueRequest',{requestId:d.requestId});return;}const bytes=new TextEncoder().encode(clean);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));await call('Fetch.fulfillRequest',{requestId:d.requestId,responseCode:200,responseHeaders:(d.responseHeaders||[]).filter(h=>!['content-length','content-encoding','transfer-encoding','content-security-policy'].includes(h.name.toLowerCase())),body:btoa(binary)});}else await call('Fetch.failRequest',{requestId:d.requestId,errorReason:'BlockedByClient'});}catch{await call('Fetch.continueRequest',{requestId:d.requestId}).catch(()=>{});}})();
  if(m.method==='Runtime.executionContextCreated')contexts.set(d.context.id,d.context);
  if(m.method==='Runtime.executionContextDestroyed'){contexts.delete(d.executionContextId);if(active===d.executionContextId)active=null;}
  if(m.method==='Runtime.executionContextsCleared'){contexts.clear();active=null;}
  if(m.method==='Runtime.bindingCalled'&&d.name==='__mjLiveRemoteKey'&&d.executionContextId===active){if(d.payload==='back')onBack?.();else if(d.payload==='controls')onControls?.();else if(d.payload==='activity')onActivity?.();else if(['play','pause','toggle'].includes(d.payload)){onActivity?.();void command(d.payload).catch(()=>{});}}
 };
 try{
  await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Control connection unavailable')),4000);socket.onopen=()=>{clearTimeout(t);resolve();};socket.onerror=()=>{clearTimeout(t);reject(Error('Control connection unavailable'));};});
  if(signal?.aborted)throw Error('Cancelled');
  await call('Fetch.enable',{patterns:[...liveAdPatterns(),{urlPattern:'https://dembed.st/premiumtv/daddy.php?id='+String(channelNumber),resourceType:'Document',requestStage:'Response'}]});await call('Runtime.enable');await call('Runtime.addBinding',{name:'__mjLiveRemoteKey'});
  timer=setInterval(async()=>{if(closed||busy||playing&&Date.now()-lastRead<1000)return;busy=true;try{
   if(!active||Date.now()-(windowLayoutAt||0)>2000){windowLayoutAt=Date.now();const tree=(await call('Page.getFrameTree')).frameTree,ids=channelFrameIds(tree,frame.name),channelContexts=[...contexts.values()].filter(c=>c.auxData?.isDefault!==false&&ids.has(c.auxData?.frameId)&&['https://dlive.sx','https://thedaddy.pk','https://dembed.st'].includes(c.origin));for(const c of channelContexts)await call('Runtime.evaluate',{contextId:c.id,expression:`(${liveFrameLayout.toString()})()`});active=channelContexts.find(c=>c.origin==='https://dembed.st')?.id;}
   if(active){lastRead=Date.now();const r=await call('Runtime.evaluate',{contextId:active,expression:`(${liveFrameLayout.toString()})();(${liveRemoteState.toString()})(${JSON.stringify(channelNumber)})`,returnByValue:true});if(r.result?.value){playing=r.result.value.ready>=2;onState?.(r.result.value);}}
  }catch{active=null;playing=false;}finally{busy=false;}},250);
  return {stop,play:()=>command('play'),pause:()=>command('pause'),toggle:()=>command('toggle'),mute:()=>command('mute'),provider:()=>command('provider')};
 }catch(e){stop();throw e;}
}




