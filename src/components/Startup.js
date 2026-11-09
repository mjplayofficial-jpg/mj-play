import {startStartupSound} from './StartupSound.js';
export function startStartup(){
 let stopSound=()=>{},ready=false,disposed=false,scheduled=false,played=false;
 let loaded=document.readyState==='complete';
 let launched=!window.PalmSystem||loaded;
 let stopTimer;
 const dispose=()=>{
  if(disposed)return;disposed=true;clearTimeout(stopTimer);stopSound();
  document.removeEventListener('visibilitychange',onVisibility);
  document.removeEventListener('webOSLaunch',onLaunch);
  document.removeEventListener('keydown',onInput,true);
  document.removeEventListener('pointerdown',onInput,true);
  window.removeEventListener('load',onLoad);
 };
 const canPlay=()=>ready&&loaded&&launched&&!document.hidden&&!disposed&&!!document.querySelector('[data-focus="hero-play"]');
 const maybePlay=()=>{
  if(!canPlay()||scheduled||played)return;
  scheduled=true;
  // Rendered HTML alone is insufficient: let Home paint in the foreground first.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   scheduled=false;if(!canPlay())return;
   played=true;stopSound=startStartupSound();stopTimer=setTimeout(dispose,2000);
  }));
 };
 const onVisibility=()=>{if(document.hidden&&played)dispose();else maybePlay();};
 const onLaunch=()=>{launched=true;maybePlay();};
 const onLoad=()=>{loaded=true;maybePlay();};
 const onInput=()=>dispose();
 document.addEventListener('visibilitychange',onVisibility);
 document.addEventListener('webOSLaunch',onLaunch);
 document.addEventListener('keydown',onInput,true);
 document.addEventListener('pointerdown',onInput,true);
 window.addEventListener('load',onLoad);
 return {finish(){ready=true;maybePlay();}};
}
