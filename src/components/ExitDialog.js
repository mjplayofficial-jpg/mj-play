export function createExitDialog(root,focus,onConfirm=()=>window.close()){
 let dialog,previous;
 function cancel(){if(!dialog)return;dialog.remove();dialog=null;focus.restore(previous||'nav-Home');}
 return {isOpen:()=>!!dialog,cancel,show(){if(dialog)return;previous=document.activeElement?.dataset.focus;
  dialog=document.createElement('div');dialog.className='exit-overlay';dialog.setAttribute('data-modal','exit');
  dialog.innerHTML='<section class="exit-dialog" role="dialog" aria-modal="true" aria-labelledby="exit-title"><h2 id="exit-title">Close MJ Play?</h2><p>Your list and recently opened titles are saved on this TV.</p><div class="actions" data-focus-row><button class="primary" data-focus="exit-cancel" data-exit-cancel>Keep Watching</button><button data-focus="exit-confirm" data-exit-confirm>Close App</button></div></section>';
  root.append(dialog);dialog.querySelector('[data-exit-cancel]').onclick=cancel;
  dialog.querySelector('[data-exit-confirm]').onclick=onConfirm;focus.restore('exit-cancel');
 }};
}
