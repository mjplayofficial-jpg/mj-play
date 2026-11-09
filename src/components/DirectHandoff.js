// Keep the embedded player visible until native playback is decoded and aligned.
export function prepareDirectVideo(doc,host,url,{getPosition,signal,timeoutMs=15000}={}){
 return new Promise((resolve,reject)=>{
  const video=doc.createElement('video');
  video.playsInline=true;video.preload='auto';video.muted=true;
  video.style.cssText='position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none';
  let settled=false,targetPosition;
  const listeners=[];
  const listen=(name,fn)=>{video.addEventListener(name,fn);listeners.push([name,fn]);};
  const clean=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);for(const [name,fn] of listeners)video.removeEventListener(name,fn);};
  const fail=()=>{if(settled)return;settled=true;clean();video.pause();video.removeAttribute('src');video.load();video.remove();reject(Error('Direct preparation unavailable'));};
  const abort=()=>fail();
  const position=()=>{if(targetPosition===undefined){const n=getPosition?.();targetPosition=Number.isFinite(n)&&n>=0?n:0;}return Math.min(targetPosition,Math.max(0,video.duration-.1));};
  const align=()=>{if(Number.isFinite(video.duration)&&Math.abs(video.currentTime-position())>1.5){try{video.currentTime=position();}catch{}return false;}return true;};
  const ready=()=>{if(settled||video.readyState<3||video.seeking)return;if(!align())return;settled=true;clean();resolve(video);};
  const timer=setTimeout(fail,timeoutMs);
  signal?.addEventListener('abort',abort,{once:true});
  listen('error',fail);listen('loadedmetadata',align);listen('playing',ready);listen('seeked',ready);listen('timeupdate',ready);
  if(signal?.aborted){fail();return;}
  host.append(video);video.src=url;
  try{Promise.resolve(video.play()).catch(fail);}catch{fail();}
 });
}

