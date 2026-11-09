export function mountPlayerRemoteOk(doc,panel,toggle,{isMenuOpen=()=>false,onToggle}){
 let captured=false;
 const isOk=e=>e.key==='Enter'||e.keyCode===13;
 const down=e=>{
  if(!isOk(e))return;
  if(captured){e.preventDefault();e.stopImmediatePropagation();return;}
  if(isMenuOpen()||!panel.hidden||doc.activeElement?.closest?.('[data-playback-prompt]:not([hidden])'))return;
  captured=true;e.preventDefault();e.stopImmediatePropagation();
  panel.hidden=false;toggle.focus();onToggle();
 };
 const up=e=>{if(!isOk(e)||!captured)return;captured=false;e.preventDefault();e.stopImmediatePropagation();};
 doc.addEventListener('keydown',down,true);doc.addEventListener('keyup',up,true);
 return ()=>{doc.removeEventListener('keydown',down,true);doc.removeEventListener('keyup',up,true);};
}
