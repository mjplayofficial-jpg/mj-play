export function slideToSection(root,id){
 const section=root.querySelector('#'+id);if(!section)return;
 const target=section.querySelector('.episode')||section.querySelector('[data-focus]')||section;
 if(target===section){section.tabIndex=-1;section.setAttribute('data-focus','section-'+id);}
 target.focus({preventScroll:true});
 section.scrollIntoView({block:'start',behavior:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
export function createTitleConfirmation(root){
 let dialog,finish;
 const close=value=>{if(!dialog)return;const resolve=finish;dialog.remove();dialog=null;finish=null;resolve(value);};
 return {isOpen:()=>!!dialog,cancel:()=>close(false),ask(message,{confirmLabel='Remove'}={}){
  close(false);const previous=document.activeElement;
  return new Promise(resolve=>{
   finish=value=>{previous?.focus?.({preventScroll:true});resolve(value);};
   dialog=document.createElement('section');dialog.className='title-confirmation';dialog.setAttribute('data-modal','');dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','title-confirmation-label');
   const label=document.createElement('h2');label.id='title-confirmation-label';label.textContent=message;dialog.append(label);
   const actions=document.createElement('div');actions.className='actions';actions.setAttribute('data-focus-row','');
   for(const [text,value] of [['Cancel',false],[confirmLabel,true]]){const button=document.createElement('button');button.textContent=text;button.setAttribute('data-focus','confirm-'+value);button.onclick=()=>close(value);actions.append(button);}
   dialog.append(actions);root.append(dialog);actions.firstElementChild.focus();
  });
 }};
}


