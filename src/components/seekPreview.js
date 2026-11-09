// Preview repeated input without repeatedly restarting the media decoder.
export function seekPreview(video,{onPreview=()=>{},onCommit=()=>{},scheduler=globalThis}={}){
 let target=null,timer;
 const cancel=()=>{scheduler.clearTimeout(timer);target=null;};
 const commit=()=>{if(target===null)return;scheduler.clearTimeout(timer);const position=target;target=null;onCommit();video.currentTime=position;onPreview();};
 return {get position(){return target;},step(delta){if(!Number.isFinite(video.duration)||video.duration<=0)return;target=Math.max(0,Math.min(video.duration-.1,(target??video.currentTime??0)+delta));scheduler.clearTimeout(timer);timer=scheduler.setTimeout(commit,700);onPreview();},commit,cancel};
}
