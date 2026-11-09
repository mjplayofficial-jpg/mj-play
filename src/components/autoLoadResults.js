// Prefetch near the last two rows, without moving the remote focus.
export function mountAutoLoad(root,grid,load){
 if(!grid?.querySelectorAll)return ()=>{};
 let timer;const check=()=>{clearTimeout(timer);timer=setTimeout(()=>{const cards=[...grid.querySelectorAll('.card')];if(!cards.length)return;const focused=cards.indexOf(grid.ownerDocument.activeElement),last=cards[cards.length-1].getBoundingClientRect();if(focused>=Math.max(0,cards.length-10)||last.top<globalThis.innerHeight+500)load();},100);};
 root.addEventListener('focusin',check);globalThis.addEventListener?.('scroll',check,{passive:true});
 return ()=>{clearTimeout(timer);root.removeEventListener('focusin',check);globalThis.removeEventListener?.('scroll',check);};
}
