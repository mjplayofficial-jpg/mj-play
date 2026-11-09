import {channelFrameIds,liveAdDomains} from './liveCapture.js';
export const sportsAdDomains=[...new Set([...liveAdDomains,'dikastruthful.cfd','axsr.org','budgetezy.org'])];
export const sportsAdPatterns=()=>sportsAdDomains.flatMap(d=>[d,'*.'+d].map(host=>({urlPattern:'*://'+host+'/*',requestStage:'Request'})));
export function blockSportsDecoration(request,source,rootFrames){return source.provider==='S8'&&rootFrames.has(request.frameId)&&['Image','Font'].includes(request.resourceType);}
export function sportsAdRequest(value){try{const host=new URL(value).hostname;return sportsAdDomains.some(d=>host===d||host.endsWith('.'+d));}catch{return false;}}
export function sportsContextKind(value,source){
 try{const u=new URL(value),root=new URL(source.url);if(u.protocol!=='https:'||u.username||u.password)return null;
  if(u.origin===root.origin&&u.pathname===root.pathname)return 'root';
  if(source.provider==='SS'&&(['dervlin.me','embedsports.me'].includes(u.hostname))&&(u.pathname.startsWith('/sd0embed/')||u.hostname==='embedsports.me'))return 'media';
  if(source.provider==='S8'&&/^ppdd\d+\.playaindg\d+\.xyz$/.test(u.hostname)&&u.pathname==='/live.html')return 'media';
 }catch{}return null;
}
// Inject only into this app's selected match frame and recognised player children.
export function prepareSportsFrame(kind,provider,preferred){
 const state=window.__mjSportsRemote||(window.__mjSportsRemote={attempts:0,last:0});
 if(preferred)state.preferred=preferred;
 if(!state.keys){state.keys=true;document.addEventListener('keydown',e=>{if(e.keyCode===461||e.key==='Escape'||e.key==='Backspace'&&!e.target?.matches?.('input,textarea')){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&typeof window.__mjSportsKey==='function')window.__mjSportsKey('back');}},true);}
 const text=(document.body?.innerText||'').slice(0,8000),verification=/drag to fit the puzzle|slide.{0,35}verif|complete.{0,25}verification/i.test(text);
 const v=document.querySelector('video');
 // Use the site's published embed, rather than deriving a URL from a match slug.
 if(kind==='root'&&provider==='SS'&&!document.querySelector('iframe[src*="dervlin.me/sd0embed/"],iframe[title="Video player"],iframe[src*="embedsports.me/"]')){
  for(const field of document.querySelectorAll('textarea')){
   const value=field.value||field.textContent||'',match=value.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);if(!match)continue;
   try{const u=new URL(match[1]);if(u.protocol!=='https:'||u.hostname!=='embedsports.me'||u.username||u.password||!/^\/[a-z-]+\/[\w-]+$/.test(u.pathname))continue;
    const embed=document.createElement('iframe');embed.title='Video player';embed.allow='autoplay; fullscreen; encrypted-media';embed.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-presentation');embed.referrerPolicy='strict-origin-when-cross-origin';embed.src=u.href;document.body.append(embed);break;
   }catch{}
  }
 }
 let target=kind==='root'?(provider==='SS'?document.querySelector('iframe[src*="dervlin.me/sd0embed/"]')||document.querySelector('iframe[title="Video player"],iframe[src*="embedsports.me/"]'):document.querySelector('.video-player-wrapper')):document.querySelector('.jwplayer')||v;
 if(kind==='root'&&state.preferred)target=[...document.querySelectorAll('iframe')].find(f=>{try{const a=new URL(f.src),b=new URL(state.preferred);return a.origin===b.origin&&a.pathname===b.pathname;}catch{return false;}})||target;
 if(verification&&kind==='media')target=null;
 if(kind==='root'&&provider==='S8'&&!target)target=document.querySelector('#iframe-el-id');
 // Preserve the provider's framework and verification UI; change layout only.
 if(target){let node=target;while(node&&node!==document.documentElement){if(node.style){node.style.setProperty('display','block','important');for(const [k,value] of Object.entries({position:'fixed',inset:'0',width:'100%',height:'100%',maxWidth:'none',maxHeight:'none',margin:'0',padding:'0',border:'0',borderRadius:'0',overflow:'hidden',background:'black',zIndex:'1'}))if(node.style[k]!==value)node.style[k]=value;}
   for(const sibling of node.parentElement?.children||[])if(sibling!==node&&!['SCRIPT','STYLE','LINK'].includes(sibling.tagName))if(sibling.style?.getPropertyValue('display')!=='none')sibling.style?.setProperty('display','none','important');node=node.parentElement;}
  if(!state.rootStyled){document.documentElement.style.cssText+=';margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000';state.rootStyled=true;}
 }
 if(verification)return {verification:true,isolated:!!target,hasVideo:false,ready:0};
 if(v){if(state.video!==v){state.video=v;state.attempts=0;state.started=false;state.audioSet=false;}if(v.readyState>=2&&!v.paused)state.started=true;
  if(!state.started&&state.attempts<3&&Date.now()-state.last>2000){state.last=Date.now();state.attempts++;
   const selectors=['.jw-display-icon-container .jw-icon-playback','.jw-icon-display','.player-poster.clickable','.vjs-big-play-button'];
   for(const selector of selectors){const b=document.querySelector(selector);if(b&&b.getClientRects().length&&!/verif|captcha|advert|consent/i.test(b.textContent||'')){b.click();break;}}
   v.muted=false;v.volume=1;try{v.play()?.catch(()=>{});}catch{}
  }
  if(state.started&&!state.audioSet){v.muted=false;v.volume=1;state.audioSet=true;}
  const rect=v.getBoundingClientRect?.(),top=rect?document.elementFromPoint?.(rect.left+rect.width/2,rect.top+rect.height/2):null,visible=!!rect&&rect.width>0&&rect.height>0&&getComputedStyle(v).visibility!=='hidden'&&(!top||top===v||top.contains?.(v)||v.contains?.(top)||top.closest?.('.jw-controls'));
  return {hasVideo:true,isolated:!!target,visible,verification:false,ready:v.readyState,paused:v.paused,muted:v.muted,height:v.videoHeight,time:v.currentTime,error:v.error?.code,decoded:v.webkitDecodedFrameCount};
 }
 return {hasVideo:false,isolated:!!target,verification:false,ready:0,waiting:/stream starts in|reload page/i.test(text)};
}
export async function connectSportsRemote(frame,source,{signal,onState,onBack}={}){
 const abortFetch=new AbortController(),fetchTimer=setTimeout(()=>abortFetch.abort(),4000),abort=()=>abortFetch.abort();signal?.addEventListener('abort',abort,{once:true});
 let response;try{response=await fetch('http://127.0.0.1:9998/json/list',{signal:abortFetch.signal});}finally{clearTimeout(fetchTimer);signal?.removeEventListener('abort',abort);}
 const targets=await response.json(),target=targets.find(t=>t.url?.startsWith('file:')&&t.url.includes('/com.mjentertainment.mjplay/'));if(!target?.webSocketDebuggerUrl||signal?.aborted)throw Error('Player controls unavailable');
 const address=new URL(target.webSocketDebuggerUrl);address.hostname='127.0.0.1';address.port='9998';
 const ws=new WebSocket(address.href),pending=new Map(),contexts=new Map(),rootFrames=new Set();let id=0,closed=false,timer,busy=false,active,allowed=new Set();
 const call=(method,params={})=>new Promise((resolve,reject)=>{if(closed||signal?.aborted)return reject(Error('Cancelled'));const n=++id,t=setTimeout(()=>{pending.delete(n);reject(Error('Player timeout'));},4000);pending.set(n,{resolve,reject,t});ws.send(JSON.stringify({id:n,method,params}));});
 const stop=()=>{if(closed)return;closed=true;clearInterval(timer);signal?.removeEventListener('abort',stop);if(ws.readyState===1)ws.send(JSON.stringify({id:++id,method:'Fetch.disable'}));ws.close();for(const p of pending.values()){clearTimeout(p.t);p.reject(Error('Closed'));}pending.clear();};signal?.addEventListener('abort',stop,{once:true});
 ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){clearTimeout(p.t);pending.delete(m.id);m.error?p.reject(Error('Player control failed')):p.resolve(m.result);return;}
  const d=m.params||{};if(m.method==='Runtime.executionContextCreated')contexts.set(d.context.id,d.context);if(m.method==='Runtime.executionContextDestroyed'){contexts.delete(d.executionContextId);if(active===d.executionContextId)active=null;}if(m.method==='Runtime.executionContextsCleared'){contexts.clear();active=null;}
  if(m.method==='Page.frameNavigated'){const f=d.frame;if(sportsContextKind(f?.url,source)==='root')rootFrames.add(f.id);else rootFrames.delete(f?.id);}
  if(m.method==='Fetch.requestPaused'){const params={requestId:d.requestId};if(sportsAdRequest(d.request?.url)||blockSportsDecoration(d,source,rootFrames))void call('Fetch.failRequest',{...params,errorReason:'BlockedByClient'}).catch(()=>{});else void call('Fetch.continueRequest',params).catch(()=>{});}
  if(m.method==='Runtime.bindingCalled'&&d.name==='__mjSportsKey'&&allowed.has(d.executionContextId)&&d.payload==='back')onBack?.();
 };
 try{await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Player connection unavailable')),4000);ws.onopen=()=>{clearTimeout(t);resolve();};ws.onerror=()=>{clearTimeout(t);reject(Error('Player connection unavailable'));};});
  await call('Page.enable');await call('Fetch.enable',{patterns:[...sportsAdPatterns(),...(source.provider==='S8'?['Image','Font'].map(resourceType=>({urlPattern:'*',resourceType,requestStage:'Request'})):[])]});await call('Runtime.enable');await call('Runtime.addBinding',{name:'__mjSportsKey'});
  timer=setInterval(async()=>{if(closed||busy)return;busy=true;try{const tree=(await call('Page.getFrameTree')).frameTree,ids=channelFrameIds(tree,frame.name),urls=new Map(),parents=new Map();const walk=t=>{urls.set(t.frame.id,t.frame.url);for(const c of t.childFrames||[]){parents.set(c.frame.id,t.frame.id);walk(c);}};walk(tree);
   const selected=[...contexts.values()].filter(c=>c.auxData?.isDefault!==false&&ids.has(c.auxData?.frameId)).map(c=>({c,kind:sportsContextKind(urls.get(c.auxData.frameId),source)})).filter(v=>v.kind);allowed=new Set(selected.map(v=>v.c.id));let best;
   for(const {c,kind} of selected){const result=await call('Runtime.evaluate',{contextId:c.id,returnByValue:true,expression:`(${prepareSportsFrame.toString()})(${JSON.stringify(kind)},${JSON.stringify(source.provider)})`}),value=result.result?.value;
    if(value?.verification&&!best?.hasVideo){best=value;active=null;}if(value?.hasVideo&&(!best?.hasVideo||value.ready>best.ready)){best=value;active=c.id;}else if(!best&&value)best=value;
   }
   if(best?.ready>=2&&active){const media=contexts.get(active);for(const {c,kind} of selected.filter(v=>v.kind==='root')){let child=media?.auxData?.frameId;while(child&&parents.get(child)!==c.auxData.frameId)child=parents.get(child);if(child){await call('Runtime.evaluate',{contextId:c.id,expression:`(${prepareSportsFrame.toString()})('root',${JSON.stringify(source.provider)},${JSON.stringify(urls.get(child))})`});const shown=await call('Runtime.evaluate',{contextId:c.id,returnByValue:true,expression:`(()=>{const expected=new URL(${JSON.stringify(urls.get(child))});const f=[...document.querySelectorAll('iframe')].find(f=>{try{const u=new URL(f.src);return u.origin===expected.origin&&u.pathname===expected.pathname;}catch{return false;}});if(!f)return false;const r=f.getBoundingClientRect(),top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.width>0&&r.height>0&&getComputedStyle(f).visibility!=='hidden'&&(top===f||f.contains(top));})()`});best.visibleChain=shown.result?.value===true&&best.visible;}}}
   if(best)onState?.(best);
  }catch{active=null;}finally{busy=false;}},900);
  const toggle=()=>active?call('Runtime.evaluate',{contextId:active,expression:`(()=>{const v=document.querySelector('video');if(v){window.__mjSportsRemote.started=true;if(v.paused){v.muted=false;v.play().catch(()=>{});}else v.pause();}})()`}):Promise.resolve();
  return {stop,toggle};
 }catch(error){stop();throw error;}
}




