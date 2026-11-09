export function mountLoadingCancel(doc,{isLoading,cancel}){
 const key=e=>{if(!isLoading()||!(e.key==='Escape'||e.key==='Backspace'||e.keyCode===461))return;e.preventDefault();e.stopImmediatePropagation();cancel();};
 doc.addEventListener('keydown',key,true);
 return ()=>doc.removeEventListener('keydown',key,true);
}
