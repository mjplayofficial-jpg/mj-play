// Keep the saved position intact until the decoder confirms the resume seek.
export function resumePosition(video,startAt,{now=()=>Date.now(),confirmationMs=1000}={}){
 let pending=Number.isFinite(startAt)&&startAt>0,confirmedAt=null;
 return {
  apply(){
   if(!pending)return true;
   if(!Number.isFinite(video.duration)||video.duration<=0)return false;
   const target=Math.min(startAt,Math.max(0,video.duration-1));
   if(!video.seeking&&video.readyState>=3&&video.currentTime>=target-2&&video.currentTime<=target+10){
    if(confirmedAt===null)confirmedAt=now();
    if(now()-confirmedAt>=confirmationMs){pending=false;return true;}
    return false;
   }
   confirmedAt=null;
   if(!video.seeking&&Math.abs(video.currentTime-target)>=2){try{video.currentTime=target;}catch{}}
   return false;
  },
  reset(){pending=false;confirmedAt=null;},
  get pending(){return pending;}
 };
}
