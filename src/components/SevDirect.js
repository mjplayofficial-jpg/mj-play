// Decode media in its required origin. Only small control/status messages cross CDP.
// Bind every operation to the named iframe for the selected title and episode.
export function sevPlayerFrameIds(tree,name){
 const ids=[];
 function visit(node,bound=false){const f=node.frame;bound=bound||f.name===name;
  if(bound){try{const u=new URL(f.url);if(u.hostname==='streamingnow.mov'&&u.pathname==='/vipstream_vfx.php')ids.push(f.id);}catch{}}
  for(const child of node.childFrames||[])visit(child,bound);
 }visit(tree);return ids;
}
export function readSevMediaSetup(text){
 if(!text.includes('makeObfHlsLoader'))return null;
 const url=text.match(/\bfile\s*:\s*["']([^"']+)["']/)?.[1];
 try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||!u.pathname.endsWith('.m3u8'))return null;return {url:u.href};}catch{return null;}
}
export function sevFramePath(tree,id){
 if(tree.frame.id===id)return [tree.frame];
 for(const child of tree.childFrames||[]){const path=sevFramePath(child,id);if(path.length)return [tree.frame,...path];}
 return [];
}
export function sevFrameLayout(childUrl){
 return `(()=>{const child=Array.from(document.querySelectorAll('iframe')).find(f=>f.src===${JSON.stringify(childUrl)});if(!child)return false;let style=document.querySelector('#mj-sev-layout');if(!style){style=document.createElement('style');style.id='mj-sev-layout';document.head.append(style);}style.textContent='html,body{margin:0!important;background:black!important;overflow:hidden!important}body *{visibility:hidden!important;transform:none!important}iframe[data-mj-sev-active]{visibility:visible!important;position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;border:0!important;z-index:2147483647!important}';child.dataset.mjSevActive='1';return true;})()`;
}
export function sevVideoSetup(url,startAt=0){
 return `(()=>{if(location.hostname!=='streamingnow.mov'||location.pathname!=='/vipstream_vfx.php'||!window.Hls||!window.makeObfHlsLoader)throw Error('SEV media frame unavailable');window.__mjSevHls?.destroy();try{window.player?.api('pause');}catch{}for(const v of document.querySelectorAll('video')){v.pause();v.removeAttribute('src');v.load();}const v=document.createElement('video');v.id='mj-sev-video';v.playsInline=true;v.preload='auto';v.style='position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:black';document.body.replaceChildren(v);const style=document.createElement('style');style.textContent='video::cue{font-size:28px;background:rgba(0,0,0,.6)}video.large-subtitles::cue{font-size:40px}';document.head.append(style);document.documentElement.style='background:black;overflow:hidden';document.body.style='margin:0;background:black;overflow:hidden';window.__mjSevError=null;const h=new Hls({loader:makeObfHlsLoader(Hls),enableWorker:false,maxBufferLength:15,maxMaxBufferLength:25,backBufferLength:0,maxBufferSize:12000000,startPosition:${Number.isFinite(startAt)?Math.max(0,startAt):0}});window.__mjSevHls=h;h.on(Hls.Events.MANIFEST_PARSED,()=>{const levels=h.levels||[];let best=-1;for(let i=0;i<levels.length;i++){if(best<0||(levels[i].height||0)>(levels[best].height||0)||((levels[i].height||0)===(levels[best].height||0)&&(levels[i].bitrate||0)>(levels[best].bitrate||0)))best=i;}if(best>=0)h.currentLevel=best;v.play().catch(()=>{});});h.on(Hls.Events.ERROR,(_,d)=>{if(d.fatal)window.__mjSevError=d.details||'Media unavailable';});h.loadSource(${JSON.stringify(url)});h.attachMedia(v);return true;})()`;
}
export function sevStatusExpression(){return `(()=>{const v=document.querySelector('#mj-sev-video');if(!v)return null;return {currentTime:v.currentTime,duration:Number.isFinite(v.duration)?v.duration:0,paused:v.paused,ended:v.ended,readyState:v.readyState,seeking:v.seeking,videoHeight:v.videoHeight,buffered:v.buffered.length?v.buffered.end(v.buffered.length-1):0,error:window.__mjSevError||v.error?.code,tracks:Array.from(v.textTracks).map(t=>({language:t.language,label:t.label,kind:t.kind,mode:t.mode}))};})()`;}
export function applySevStatus(video,state,next){
 const previous={...state};Object.assign(state,next);
 if((previous.readyState<1&&state.readyState>=1)||JSON.stringify(previous.tracks||[])!==JSON.stringify(state.tracks||[]))video.dispatchEvent(new Event('loadedmetadata'));
 if(previous.paused!==state.paused)video.dispatchEvent(new Event(state.paused?'pause':'play'));
 if(state.readyState>=3&&!state.paused){if(previous.readyState<3||previous.paused)video.dispatchEvent(new Event('playing'));}
 else if(previous.readyState>=3&&state.readyState<3)video.dispatchEvent(new Event('waiting'));
 if(state.ended&&!previous.ended)video.dispatchEvent(new Event('ended'));
 if(state.error&&!previous.error)video.dispatchEvent(new Event('error'));
 if(previous.seeking&&!state.seeking)video.dispatchEvent(new Event('seeked'));
 video.dispatchEvent(new Event('timeupdate'));video.dispatchEvent(new Event('progress'));
}
export async function connectSevDirect(doc,frame,{name,startAt=0,signal,onStatus}={}){
 const list=await(await fetch('http://127.0.0.1:9998/json/list',{signal})).json();
 const target=list.find(t=>t.url?.startsWith('file:')&&t.url.includes('/com.mjentertainment.mjplay/'));
 if(!target)throw Error('TV Developer Mode inspector unavailable');
 const address=new URL(target.webSocketDebuggerUrl);address.hostname='127.0.0.1';address.port='9998';
 const ws=new WebSocket(address.href),pending=new Map(),contexts=new Map(),scripts=[];let id=0,closed=false,poll,contextId,frameId,debugging=false,subtitleObserver,seekTimer,seekDeadline=0,queuedSeek;
 const call=(method,params={})=>new Promise((resolve,reject)=>{if(closed||signal?.aborted){reject(Error('SEV closed'));return;}const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error('SEV inspector timed out'));},4000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
 const close=()=>{if(closed)return;closed=true;clearInterval(poll);clearTimeout(seekTimer);subtitleObserver?.disconnect();signal?.removeEventListener('abort',close);if(ws.readyState===1&&contextId)ws.send(JSON.stringify({id:++id,method:'Runtime.evaluate',params:{contextId,expression:`window.__mjSevHls?.destroy();document.querySelector('#mj-sev-video')?.pause();`}}));if(ws.readyState===1&&debugging)ws.send(JSON.stringify({id:++id,method:'Debugger.disable'}));ws.close();for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('SEV closed'));}pending.clear();};
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(!p)return;clearTimeout(p.timer);pending.delete(m.id);m.error||m.result?.exceptionDetails?p.reject(Error('SEV frame unavailable')):p.resolve(m.result);}else if(m.method==='Runtime.executionContextCreated')contexts.set(m.params.context.id,m.params.context);else if(m.method==='Runtime.executionContextDestroyed')contexts.delete(m.params.executionContextId);else if(m.method==='Runtime.executionContextsCleared')contexts.clear();else if(m.method==='Debugger.scriptParsed')scripts.push(m.params);};
 signal?.addEventListener('abort',close,{once:true});
 try{
  await new Promise((resolve,reject)=>{const t=setTimeout(()=>{close();reject(Error('TV inspector unavailable'));},4000);ws.onopen=()=>{clearTimeout(t);resolve();};ws.onerror=()=>{clearTimeout(t);reject(Error('TV inspector unavailable'));};});
  ws.onclose=close;await call('Runtime.enable');await call('Page.enable');
  const deadline=Date.now()+45000;let setup;
  while(!closed&&Date.now()<deadline&&!setup){
   const tree=await call('Page.getFrameTree'),ids=sevPlayerFrameIds(tree.frameTree,name);
   const context=Array.from(contexts.values()).find(c=>ids.includes(c.auxData?.frameId)&&c.auxData?.isDefault!==false);
   if(context){contextId=context.id;frameId=context.auxData.frameId;scripts.length=0;await call('Debugger.enable');debugging=true;
    for(const script of scripts.filter(s=>s.executionContextId===contextId&&(!s.url||s.url.includes('streamingnow.mov')))){
     const result=await call('Debugger.getScriptSource',{scriptId:script.scriptId});setup=readSevMediaSetup(result.scriptSource||'');if(setup)break;
    }
    await call('Debugger.disable');debugging=false;
   }
   if(!setup)await new Promise(r=>setTimeout(r,600));
  }
  if(!setup||closed)throw Error('SEV source could not be prepared');
  const layoutTree=await call('Page.getFrameTree'),path=sevFramePath(layoutTree.frameTree,frameId);
  for(let i=0;i<path.length-1;i++){
   if(path[i].url.startsWith('file:'))continue;
   const parent=Array.from(contexts.values()).find(c=>c.auxData?.frameId===path[i].id&&c.auxData?.isDefault!==false);
   if(parent)await call('Runtime.evaluate',{contextId:parent.id,expression:sevFrameLayout(path[i+1].url)});
  }
  await call('Runtime.evaluate',{contextId,expression:sevVideoSetup(setup.url,startAt),returnByValue:true});
  const video=doc.createElement('video'),state={currentTime:0,duration:0,paused:true,ended:false,readyState:0,seeking:false,videoHeight:0,buffered:0,tracks:[]};
  const command=expression=>call('Runtime.evaluate',{contextId,expression:`(()=>{const v=document.querySelector('#mj-sev-video');if(!v)throw Error('SEV video unavailable');${expression}})()`});
  for(const field of ['duration','paused','ended','readyState','seeking','videoHeight'])Object.defineProperty(video,field,{get:()=>state[field]});
  Object.defineProperty(video,'currentTime',{get:()=>queuedSeek??state.currentTime,set:value=>{
   if(closed||seekDeadline||!Number.isFinite(value)||state.duration<=0)return;
   queuedSeek=Math.max(0,Math.min(value,state.duration-.1));clearTimeout(seekTimer);
   seekTimer=setTimeout(()=>{const target=queuedSeek;queuedSeek=undefined;seekDeadline=Date.now()+10000;state.seeking=true;
    command(`v.currentTime=${target};`).catch(()=>{if(!closed){onStatus?.({error:'Seek failed'});close();}});
   },250);
  }});
  Object.defineProperty(video,'buffered',{get:()=>({length:state.buffered?1:0,end:()=>state.buffered})});
  Object.defineProperty(video,'textTracks',{get:()=>state.tracks.map((track,index)=>({...track,get mode(){return track.mode;},set mode(value){if(!['showing','hidden','disabled'].includes(value))return;track.mode=value;command(`if(v.textTracks[${index}])v.textTracks[${index}].mode=${JSON.stringify(value)};`).catch(()=>{});}}))});
  subtitleObserver=new MutationObserver(()=>{command(`v.classList.toggle('large-subtitles',${video.classList.contains('large-subtitles')});`).catch(()=>{});});subtitleObserver.observe(video,{attributes:true,attributeFilter:['class']});
  video.play=()=>command('return v.play();');video.pause=()=>{command('v.pause();').catch(()=>{});};
  let busy=false;
  poll=setInterval(async()=>{if(busy||closed)return;busy=true;try{
   if(!contexts.has(contextId)||contexts.get(contextId).auxData?.frameId!==frameId)throw Error('SEV frame changed');
   const r=await call('Runtime.evaluate',{contextId,expression:sevStatusExpression(),returnByValue:true});const value=r.result?.value;if(!value)throw Error('SEV video disappeared');applySevStatus(video,state,value);onStatus?.(value);
   if(seekDeadline){if(!value.seeking&&value.readyState>=3)seekDeadline=0;else if(Date.now()>seekDeadline)throw Error('SEV seek stalled');}
  }catch{if(!closed)onStatus?.({error:'SEV connection lost'});close();}finally{busy=false;}},500);
  return {video,dispose:close};
 }catch(e){close();throw e;}
}

