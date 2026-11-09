import {sevFramePath,sevFrameLayout} from './SevDirect.js';
// Observed in the channel trial. Blocking lasts only for this inspector session.
export const liveAdDomains=['ingage.tech','spendsdetachment.com','histats.com','xadsmart.com','profitableratecpmnetwork.com','thirstacock.com','briguefidibus.com','adexchangerapid.com','adsco.re','portalfluently.com','protrafficinspector.com','llvpn.com','usrpubtrk.com','luugy.com','runnerwailaki.qpon','premiumvertising.com','manilioshred.cfd','connatix.com','thatdisform.cyou','rubiconproject.com'];
liveAdDomains.push('eqgjmqagdjx.com','hnvfkwxwqcf.com','ntwkbc21.com','ntwkbc42.com','wcgbetyplakno.website','d11enq2rymy0yl.cloudfront.net','d2j042cj1421wi.cloudfront.net');
liveAdDomains.push('browserpro.online','ay267.com','piousshiners.com','joualsfelafelheroine.cyou','ceriphtibbit.cfd','streamtraffichub.cfd','flushpersist.com','gombeencistron.cyou');
// Ad hosts observed in the WS player, separate from its media delivery hosts.
liveAdDomains.push('cogwayskerb.com','gurlleviter.cyou','rapidadexchange.com','apzptquixoyr.com','usrpubtrck.com');
export const liveAdPatterns=()=>liveAdDomains.flatMap(d=>[d,'*.'+d].map(host=>({urlPattern:'*://'+host+'/*',requestStage:'Request'})));
export const liveUnmuteScript=`(()=>{if(location.hostname!=='dembed.st'||location.pathname!=='/premiumtv/daddy.php'||new URLSearchParams(location.search).get('id')!=='38')return;const b=document.querySelector('#unmute');if(b&&b.getBoundingClientRect().width)b.click();if(typeof jwplayer==='function'){const p=jwplayer('player');p.setMute(false);p.setVolume(100);if(['idle','paused'].includes(p.getState()))p.play(true);}const v=document.querySelector('video');if(v){v.muted=false;v.volume=1;if(v.paused)v.play().catch(()=>{});}})()`;
export function channelFrameIds(tree,name){const ids=new Set();const walk=(node,bound=false)=>{if(!node)return;const f=node.frame;bound=bound||f.name===name;if(bound)ids.add(f.id);for(const child of node.childFrames||[])walk(child,bound);};walk(tree);return ids;}
export const liveBridgeSetup=`(()=>{
 if(location.hostname!=='dembed.st'||location.pathname!=='/premiumtv/daddy.php'||new URLSearchParams(location.search).get('id')!=='38')return false;
 if(document.querySelector('#mj-live-video'))return document.querySelector('#mj-live-video').readyState>=2&&!!window.__mjLiveHls;
 if(typeof jwplayer!=='function')return false;
 const player=jwplayer('player'),h=player._lwHls||player.getProvider?.()?.hlsjs||player.getProvider?.()?.hls,old=document.querySelector('#player video');
 if(!h||!old||old.readyState<2)return false;
 // Keep the already decoding media and its loader alive: restarting loses the handshake.
 const v=old;v.id='mj-live-video';v.playsInline=true;v.muted=false;v.volume=1;
 const style=document.createElement('style');style.textContent='html,body{margin:0!important;background:black!important;overflow:hidden!important}#player{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;z-index:2147483646!important}#player .jw-controls,#player .jw-overlays,#player .jw-title,#unmute{display:none!important}#mj-live-video{object-fit:contain!important}';document.head.append(style);
 player.setMute(false);player.setVolume(100);window.open=()=>null;window.__mjLiveHls=h;return true;
})()`;
export function cleanLiveDocument(html){
 const decoder=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]).find(body=>/\bconst SRC\s*=/.test(body)&&body.includes('class LiveLoader'));
 const end=decoder?.indexOf('const p2pConfig =');
 if(end>0){
  // Keep the source's unwrap loader in its original origin, without its player shell.
  const loader=decoder.slice(0,end);
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body,#player{margin:0;width:100%;height:100%;background:#000;overflow:hidden}video{width:100%;height:100%;object-fit:contain}#msg{position:absolute;bottom:12px;left:12px;color:white;font:18px sans-serif}</style><script src="https://cdn.jsdelivr.net/npm/pako@2/dist/pako.min.js"></script><script src="https://cdn.jsdelivr.net/npm/hls.js@1.6.13/dist/hls.min.js"></script></head><body><div id="player"><video id="mj-live-video" autoplay playsinline></video></div><div id="msg"></div><script>${loader}
  const video=document.querySelector('video');video.muted=false;video.volume=1;
  if(typeof Hls==='undefined'||!Hls.isSupported()){show('TV HLS playback unavailable');}
  else{
   const hls=new Hls({loader:LiveLoader,enableWorker:false,maxBufferLength:10,maxMaxBufferLength:12,maxBufferSize:8000000,backBufferLength:0,liveSyncDurationCount:3,liveMaxLatencyDurationCount:8,defaultAudioCodec:CFG.audio_codec||'mp4a.40.2',maxAudioFramesDrift:CFG.max_audio_frames_drift||8,manifestLoadingTimeOut:30000,fragLoadingTimeOut:45000});
   window.__mjLiveHls=hls;hls.on(Hls.Events.MEDIA_ATTACHED,()=>hls.loadSource(SRC));hls.on(Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>show('Press Play to start')));hls.on(Hls.Events.ERROR,(_,e)=>{if(e.fatal)show('Live playback error: '+e.details);});video.addEventListener('playing',hide);hls.attachMedia(video);
   window.addEventListener('pagehide',()=>{video.pause();hls.destroy();},{once:true});
  }
  </script></body></html>`;
 }
 const clean=html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,(full,attributes,body)=>{
  const src=attributes.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
  if(src){try{const host=new URL(src,'https://dembed.st').hostname;return ['cdn.jsdelivr.net','cdn.jwplayer.com','ssl.p.jwpcdn.com'].includes(host)?full:'';}catch{return '';}}
  return /\bconst SRC\s*=/.test(body)&&body.includes('class LiveLoader')?full:'';
 });
 return clean.replace(/\b(maxBufferLength|maxMaxBufferLength|backBufferLength|maxBufferSize)\s*:\s*\d+/g,(_,key)=>key+':'+({maxBufferLength:10,maxMaxBufferLength:12,backBufferLength:0,maxBufferSize:8000000}[key]))
  .replace(/\bback_buffer_seconds\s*:\s*\d+/g,'back_buffer_seconds:0')
  .replace(/\bhlsjsConfig\s*:\s*\{/g,'hlsjsConfig:{maxBufferLength:10,maxMaxBufferLength:12,backBufferLength:0,maxBufferSize:8000000,');
}
export async function openLiveCapture(frame,{signal,onBridge,onStatus}={}){
 const report=message=>onStatus?.({message});
 report('Connecting to TV playback engine…');
 const response=await fetch('http://127.0.0.1:9998/json/list',{signal});if(!response.ok)throw Error('Inspector unavailable');
 const target=(await response.json()).find(t=>{try{const u=new URL(t.url);return u.protocol==='file:'&&u.pathname.includes('/com.mjentertainment.mjplay/');}catch{return false;}});
 if(!target?.webSocketDebuggerUrl)throw Error('Inspector unavailable');
 const address=new URL(target.webSocketDebuggerUrl);address.hostname='127.0.0.1';address.port='9998';
 const socket=new WebSocket(address.href),pending=new Map(),contexts=new Map();let serial=0,timer,closed=false,busy=false,frames=new Set(),bridgeContext,scriptId;
 const call=(method,params={},timeoutMs=8000)=>new Promise((resolve,reject)=>{const id=++serial,timeout=setTimeout(()=>{pending.delete(id);reject(Error('Live inspector timeout: '+method));},timeoutMs);pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));});
 const dispose=async()=>{if(closed)return;closed=true;clearInterval(timer);signal?.removeEventListener('abort',dispose);try{if(socket.readyState===1){await call('Fetch.disable');if(scriptId)await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:scriptId});}}catch{}socket.close();for(const p of pending.values()){clearTimeout(p.timeout);p.reject(Error('Live capture closed'));}pending.clear();};
 const cleanResponse=async p=>{try{
  if(p.responseStatusCode===undefined){await call('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return;}
  report('Preparing '+new URL(p.request.url).hostname+'…');
  if(p.responseStatusCode!==200){await call('Fetch.continueRequest',{requestId:p.requestId});return;}
  const result=await call('Fetch.getResponseBody',{requestId:p.requestId},20000);
  const html=result.base64Encoded?new TextDecoder().decode(Uint8Array.from(atob(result.body),c=>c.charCodeAt(0))):result.body;
  const text=cleanLiveDocument(html),bytes=new TextEncoder().encode(text);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  await call('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:(p.responseHeaders||[]).filter(h=>!['content-length','content-encoding','transfer-encoding'].includes(h.name.toLowerCase())),body:btoa(binary)});
  report(text.includes('id="mj-live-video"')?'Starting decoded video…':'Opening embedded channel…');
 }catch(error){report('Channel preparation error: '+error.message);try{await call('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});}catch{}}};
 signal?.addEventListener('abort',dispose,{once:true});
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timeout);pending.delete(m.id);m.error?p.reject(Error('Live inspector error: '+m.error.message)):p.resolve(m.result);}}else if(m.method==='Fetch.requestPaused')void cleanResponse(m.params);else if(m.method==='Runtime.exceptionThrown'){const d=m.params.exceptionDetails;if(contexts.get(d.executionContextId)?.origin==='https://dembed.st')report('Decoder error: '+(d.exception?.description||d.text).slice(0,200));}else if(m.method==='Runtime.executionContextCreated')contexts.set(m.params.context.id,m.params.context);else if(m.method==='Runtime.executionContextDestroyed')contexts.delete(m.params.executionContextId);else if(m.method==='Runtime.executionContextsCleared')contexts.clear();};
 try{
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Inspector unavailable')),4000);socket.onopen=()=>{clearTimeout(timeout);resolve();};socket.onerror=()=>{clearTimeout(timeout);reject(Error('Inspector unavailable'));};});
  if(signal?.aborted)throw Error('Cancelled');
  // Network.enable here would observe this very inspector WebSocket and amplify
  // its own protocol traffic. Fetch pauses only the explicitly listed requests.
  await call('Runtime.enable');await call('Page.enable');
  await call('Fetch.enable',{patterns:[{urlPattern:'https://dlive.sx/stream/stream-38.php*',resourceType:'Document',requestStage:'Response'},{urlPattern:'https://dembed.st/premiumtv/daddy.php?id=38',resourceType:'Document',requestStage:'Response'},...liveAdDomains.flatMap(d=>[d,'*.'+d].map(host=>({urlPattern:'*://'+host+'/*',requestStage:'Request'})))]});
  scriptId=(await call('Page.addScriptToEvaluateOnNewDocument',{source:`if(['dlive.sx','dembed.st'].includes(location.hostname)){window.open=()=>null;window.alert=()=>{};window.confirm=()=>false;}`})).identifier;
  timer=setInterval(async()=>{if(closed||busy)return;busy=true;try{
   const tree=(await call('Page.getFrameTree')).frameTree;frames=channelFrameIds(tree,frame.name);
   if(bridgeContext){if(!contexts.has(bridgeContext))throw Error('Channel disconnected');const r=await call('Runtime.evaluate',{contextId:bridgeContext,returnByValue:true,expression:`(()=>{const v=document.querySelector('#mj-live-video');return v&&{time:v.currentTime,ready:v.readyState,height:v.videoHeight,paused:v.paused,error:v.error?.code};})()`});onStatus?.(r.result?.value);return;}
   for(const [contextId,c] of contexts){if(!frames.has(c.auxData?.frameId)||c.origin!=='https://dembed.st'||c.auxData?.isDefault===false)continue;
    const state=await call('Runtime.evaluate',{contextId,returnByValue:true,expression:`(()=>({message:document.querySelector('#msg')?.textContent,own:!!document.querySelector('#mj-live-video'),hls:typeof Hls,ready:document.querySelector('video')?.readyState}))()`});
    const v=state.result?.value;if(v?.message)report(v.message);else if(v?.own&&v.hls==='undefined')report('Waiting for HLS library…');
    const result=await call('Runtime.evaluate',{contextId,returnByValue:true,expression:liveBridgeSetup});
    if(result.result?.value){bridgeContext=contextId;const path=sevFramePath(tree,c.auxData.frameId);for(let i=0;i<path.length-1;i++){if(path[i].url.startsWith('file:'))continue;const parent=[...contexts.values()].find(x=>x.auxData?.frameId===path[i].id&&x.auxData?.isDefault!==false);if(parent)await call('Runtime.evaluate',{contextId:parent.id,expression:sevFrameLayout(path[i+1].url)});}
     const command=code=>call('Runtime.evaluate',{contextId,expression:`(()=>{const v=document.querySelector('#mj-live-video');if(v){${code}}})()`});onBridge?.({play:()=>command('return v.play();'),pause:()=>command('v.pause();')});return;}
   }
   for(const [contextId,c] of contexts){if(!frames.has(c.auxData?.frameId))continue;await call('Runtime.evaluate',{contextId,expression:liveUnmuteScript}).catch(()=>{});}
  }catch(error){report('Playback connection error: '+error.message);}finally{busy=false;}},1000);
  return dispose;
 }catch(error){await dispose();throw error;}
}
