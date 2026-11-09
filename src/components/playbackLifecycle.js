export function mountPlaybackLifecycle(video,save){
 const doc=video.ownerDocument,win=doc.defaultView;
 const hide=()=>{save();if(!video.paused)video.pause();};
 const visibility=()=>{if(doc.hidden)hide();};
 doc.addEventListener('visibilitychange',visibility);win?.addEventListener('pagehide',hide);
 return ()=>{doc.removeEventListener('visibilitychange',visibility);win?.removeEventListener('pagehide',hide);};
}
