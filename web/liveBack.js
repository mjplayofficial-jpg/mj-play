export function bindLiveBack(doc,exit){
 let leaving=false,exitingFullscreen=false;
 const back=async()=>{if(leaving||exitingFullscreen)return;if(doc.fullscreenElement&&doc.exitFullscreen){exitingFullscreen=true;try{await doc.exitFullscreen();}catch{}finally{exitingFullscreen=false;}return;}leaving=true;exit();};
 const keys=e=>{if(e.key==='Escape'||e.key==='Backspace'||e.key==='BrowserBack'||e.keyCode===461||e.altKey&&e.key==='ArrowLeft'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)back();}};
 doc.addEventListener('keydown',keys,true);
 return {back,dispose:()=>doc.removeEventListener('keydown',keys,true)};
}
