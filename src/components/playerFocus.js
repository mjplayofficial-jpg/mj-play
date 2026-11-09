// Keep remote keys in the app. Provider menus remain usable with pointer clicks.
// Only inspect the parent-owned iframe element, never its cross-origin document.
export function keepPlayerRemoteFocus(document,frame,backButton,scheduler=globalThis){
 const restore=()=>{if(document.activeElement===frame)backButton.focus({preventScroll:true});};
 backButton.focus({preventScroll:true});
 const timer=scheduler.setInterval(restore,150);
 return ()=>scheduler.clearInterval(timer);
}
