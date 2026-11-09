// One completion policy for shelves, details, collections and playback.
export function playbackState(value,type){
 if(!value||!Number.isFinite(value.duration)||value.duration<=0)return {watched:false,resumable:false,percent:0,remaining:0};
 const remaining=Math.max(0,value.duration-value.position),movie=type==='movie'||!type&&value.key?.includes('/movie/');
 const watched=!!value.completed||!(value.restarted&&value.position<10)&&(remaining<=15||movie&&value.duration>=3600&&remaining<=Math.min(300,value.duration*.05));
 return {watched,resumable:!watched&&value.position>=10,percent:watched?100:Math.max(0,Math.min(100,value.position/value.duration*100)),remaining};
}
