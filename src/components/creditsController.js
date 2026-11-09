import {fetchCredits} from '../services/credits.js';
export function mountCreditsController(video,item,season,episode,{onChange=()=>{},lookup=fetchCredits,scheduler=globalThis}={}){
 let disposed=false,marker=null,duration=0,attempts=0,busy=false,timer;const controller=new AbortController();
 const request=async()=>{
  if(disposed||!Number.isFinite(video.duration)||video.duration<300)return;
  if(Math.abs(duration-video.duration)>=1){duration=video.duration;marker=null;attempts=0;}
  if(busy||marker||attempts>=3)return;busy=true;attempts++;const expected=duration;
  try{const result=await lookup(item,season,episode,expected,{signal:controller.signal});if(!disposed&&Math.abs(video.duration-expected)<1){marker=result;onChange(marker);}}
  catch{}finally{busy=false;if(!disposed&&!marker&&attempts<3){scheduler.clearTimeout(timer);timer=scheduler.setTimeout(request,10000);}}
 };
 const schedule=()=>{scheduler.clearTimeout(timer);timer=scheduler.setTimeout(request,1000);};
 video.addEventListener('loadedmetadata',schedule);video.addEventListener('durationchange',schedule);video.addEventListener('playing',schedule);schedule();
 return {get marker(){return marker;},dispose(){disposed=true;controller.abort();scheduler.clearTimeout(timer);video.removeEventListener('loadedmetadata',schedule);video.removeEventListener('durationchange',schedule);video.removeEventListener('playing',schedule);}};
}
