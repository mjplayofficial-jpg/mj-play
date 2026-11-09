// Count actual playback time, excluding pauses, stalls and seek jumps.
export function createCreditsCountdown({now=()=>performance.now()}={}){
 let elapsed=0,lastNow=null,lastPosition=null,running=false;
 const reset=()=>{elapsed=0;lastNow=null;lastPosition=null;running=false;};
 return {reset,update({position,marker,playing}){
  const clock=now(),inCredits=!!marker&&position>=marker.start;
  const protectedScene=inCredits&&marker.hasPostCredits&&(!Number.isFinite(marker.postCreditsEnd)||position<marker.postCreditsEnd);
  if(!inCredits||protectedScene){reset();return {active:false,protectedScene,seconds:10,due:false};}
  if(running&&playing&&lastNow!==null&&lastPosition!==null){const movement=position-lastPosition;if(movement===0)return {active:true,protectedScene:false,seconds:Math.max(0,10-elapsed),due:elapsed>=10};if(movement>0&&movement<2)elapsed+=Math.max(0,Math.min(1,(clock-lastNow)/1000));}
  lastNow=clock;lastPosition=position;running=!!playing;
  return {active:true,protectedScene:false,seconds:Math.max(0,10-elapsed),due:elapsed>=10};
 }};
}
