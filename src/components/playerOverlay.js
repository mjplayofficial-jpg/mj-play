// Embedded players do not expose their seek-bar visibility to the parent.
export function mountPlayerOverlay(doc,element,isMenuOpen,scheduler=globalThis){
 let timer,disposed=false;
 const hide=()=>{if(disposed||isMenuOpen())return;element.hidden=true;};
 const show=e=>{if(disposed||e?.target?.closest?.('[data-playback-prompt]')||e?.type==='focusin'&&e.target?.tagName==='VIDEO')return;element.hidden=false;scheduler.clearTimeout(timer);timer=scheduler.setTimeout(hide,3000);};
 const events=['keydown','pointermove','pointerdown','focusin'];
 for(const event of events)doc.addEventListener(event,show,true);
 show();
 return ()=>{disposed=true;scheduler.clearTimeout(timer);for(const event of events)doc.removeEventListener(event,show,true);};
}
