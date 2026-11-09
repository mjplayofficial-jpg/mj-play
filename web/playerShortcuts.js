export function bindFullscreenShortcut(doc,toggle){
 const key=e=>{
  if(e.key?.toLowerCase()!=='f'||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;
  const target=e.target||doc.activeElement;
  if(target?.isContentEditable||target?.closest?.('input,textarea,select,[contenteditable="true"],[role="textbox"]'))return;
  e.preventDefault();toggle();
 };
 doc.addEventListener('keydown',key);
 return()=>doc.removeEventListener('keydown',key);
}
