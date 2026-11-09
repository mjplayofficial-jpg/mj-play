import {appNow} from '../services/appClock.js';
import {liveCatalogue} from '../data/liveCatalogue.js';
import {loadLiveGuide,guideWindow} from '../services/liveGuide.js';
import {escapeHtml as esc} from './ui.js';
export function adjacentChannel(channels,number,direction){const index=channels.findIndex(c=>c.number===number);return channels.length?channels[(Math.max(0,index)+direction+channels.length)%channels.length]:null;}
export function upcomingStrip(programmes,now=appNow()){const items=guideWindow(programmes,now).upcoming.slice(0,3);return items.length?'<span class="live-upcoming-label">UP NEXT</span>'+items.map(p=>'<span class="live-upcoming-item"><time>'+esc(new Date(p.start).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))+'</time><span>'+esc(p.title)+'</span></span>').join(''):'<span class="live-upcoming-empty">Upcoming schedule unavailable</span>';}
export function mountLiveMiniGuide(root,{channel,onSwitch,onProgramme}){
 const strip=root.querySelector('[data-live-upcoming]');let disposed=false,programmes=[],loading=false;
 const update=async()=>{if(disposed||!strip||channel.sports||loading)return;loading=true;try{programmes=await loadLiveGuide(channel.number);if(!disposed){strip.innerHTML=upcomingStrip(programmes);onProgramme?.(guideWindow(programmes,appNow()).current);}}catch{if(!disposed)strip.innerHTML=upcomingStrip([]);}finally{loading=false;}};
 if(strip){strip.hidden=!!channel.sports;if(!channel.sports){strip.textContent='Loading upcoming shows...';void update();}}
 const timer=setInterval(update,60000);
 return {isOpen:()=>false,close(){},adjacent:direction=>{const next=adjacentChannel(liveCatalogue,channel.number,direction);if(next&&next.number!==channel.number)onSwitch(next);},dispose(){disposed=true;clearInterval(timer);}};
}
