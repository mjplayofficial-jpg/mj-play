// Parent-owned playback surface only. Explicit buttons keep their normal action.
export function mountProviderRemote(doc,surface,controls,capabilities){
 const handler=e=>{
  if(doc.activeElement!==surface||!capabilities.supportsRemoteControls)return;
  const key=e.key&&e.key!=='Unidentified'?e.key:({37:'ArrowLeft',39:'ArrowRight',13:'Enter'}[e.keyCode]);
  const seek=(key==='ArrowLeft'||key==='ArrowRight')&&capabilities.supportsSeek&&typeof controls.seekBy==='function';
  const toggle=key==='Enter'&&capabilities.supportsPlayPause&&typeof controls.play==='function'&&typeof controls.pause==='function';
  if(!seek&&!toggle)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(seek)controls.seekBy(key==='ArrowLeft'?-10:10);
  else if(!e.repeat){const playing=controls.isPlaying?.();if(playing===true)controls.pause();else if(playing===false)controls.play();else controls.requestStatus?.();}
 };
 const options={capture:true};
 doc.addEventListener('keydown',handler,options);
 return ()=>doc.removeEventListener('keydown',handler,options);
}
