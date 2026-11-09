import {library} from '../storage/library.js';
import {progressStore} from '../storage/progress.js';
import {protectedStorage as storage} from '../storage/protectedStorage.js';
import {activeProfile} from '../storage/profiles.js';
import {playbackState} from './progressState.js';
export function showUndo(root,message,undo){root.querySelector('.undo-toast')?.remove();const profile=activeProfile().id,doc=root.ownerDocument,notice=doc.createElement('div');notice.className='undo-toast';notice.setAttribute('role','status');const text=doc.createElement('span');text.textContent=message;const button=doc.createElement('button');button.textContent='Undo · Red key';button.dataset.focus='library-undo';const close=()=>{notice.remove();doc.removeEventListener('keydown',keys,true);};button.onclick=()=>{if(activeProfile().id===profile)undo();close();};const keys=e=>{if((e.keyCode===403||e.key==='ColorF0Red')&&notice.isConnected){e.preventDefault();e.stopImmediatePropagation();button.onclick();}};notice.append(text,button);root.append(notice);doc.addEventListener('keydown',keys,true);setTimeout(close,12000);}
export function mountWatchedAction(root,type,id,service){const button=root.querySelector('[data-mark-watched]');if(type!=='movie'||!button)return ()=>{};let disposed=false,item;
 const paint=()=>{if(!item||disposed)return;button.textContent=playbackState(progressStore.latest('Direct',item),'movie').watched?'Mark unwatched':'Mark watched';};
 service.details(type,id).then(value=>{item=value;paint();}).catch(()=>{});
 button.onclick=()=>{if(!item)return;const beforeRecent=storage.getItem('mjplay.recent.v1')||'[]',beforeProgress=storage.getItem('mjplay.progress.v1')||'[]',value=progressStore.latest('Direct',item),watched=playbackState(value,'movie').watched;
  progressStore.clearItem(type,id);if(watched){progressStore.save('User',item,undefined,undefined,{position:0,duration:value?.duration||item.runtime*60||1,completed:false,restarted:true});library.record(item);}else{progressStore.save('User',item,undefined,undefined,{position:value?.position||0,duration:value?.duration||item.runtime*60||1,completed:true});library.removeRecent(type,id);}paint();showUndo(root,watched?'Marked unwatched':'Marked watched',()=>{storage.setItem('mjplay.recent.v1',beforeRecent);storage.setItem('mjplay.progress.v1',beforeProgress);paint();});
 };
 return ()=>{disposed=true;button.onclick=null;};
}
