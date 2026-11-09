import {escapeHtml as esc} from '../components/ui.js';
export function createCompanionUI(root,focus,client){
 let previous,modal=null;
 function close(){modal?.remove();modal=null;client.cancel();focus.restore(previous);}
 function render(){
  const status=root.querySelector('#companion-status');if(status)status.textContent=client.status;
  const devices=root.querySelector('#companion-devices');if(devices){const content=client.devices.length?client.devices.map(d=>`<div data-focus-row><span>${esc(d.name)} · ${d.connected?'Connected':'Disconnected'}</span> <button data-focus="revoke-${esc(d.deviceId)}" data-companion-revoke="${esc(d.deviceId)}">Revoke</button></div>`).join(''):'<p class="subtle">No paired phones</p>';if(devices.dataset.content!==content){const active=devices.contains(document.activeElement)?document.activeElement.dataset.focus:null;devices.innerHTML=content;devices.dataset.content=content;if(active)focus.restore(client.devices.some(d=>'revoke-'+d.deviceId===active)?active:'pair-phone');}}
  if(client.pending&&!modal){previous=document.activeElement?.dataset.focus;open();}
  if(!modal)return;
  const pending=client.pending,code=client.code;
  const mode=pending?'approval':code?'code':'waiting';
  if(modal.dataset.mode!==mode){modal.dataset.mode=mode;modal.innerHTML=`<section class="companion-dialog"><p class="eyebrow">MJ PLAY COMPANION</p><h1>${pending?'Phone wants to connect':'Pair your phone'}</h1>${pending?`<p>${esc(pending.name)}</p><div data-focus-row><button data-focus="companion-deny" data-companion-decision="deny">DENY</button><button data-focus="companion-allow" data-companion-decision="allow">ALLOW</button></div>`:`<p id="companion-code" class="companion-code">${code?esc(code.code):'Connecting…'}</p><p id="companion-expiry"></p><p class="subtle">Enter this code in MJ Play Companion on your phone.</p><button data-focus="companion-close" data-companion-close>Close</button>`}</section>`;focus.restore(pending?'companion-deny':'companion-close');}
  const expiry=modal.querySelector('#companion-expiry');if(expiry)expiry.textContent=code?`Expires in ${Math.max(0,Math.ceil((code.expires-Date.now())/1000))} seconds`:client.error|| (client.status==='Connected'?'Requesting a code…':'Relay disconnected. Close and try again.');
 }
 function open(){if(modal)return;modal=document.createElement('div');modal.className='companion-overlay';modal.setAttribute('data-modal','');root.append(modal);render();}
 const timer=setInterval(()=>{if(client.code?.expires<=Date.now()||client.pending?.expires<=Date.now())client.cancel();render();},1000);
 return {render,isOpen:()=>!!modal,back(){if(!modal)return false;close();return true;},pair(){previous=document.activeElement?.dataset.focus;client.pair();open();},decision(allow){client.decide(allow);modal?.remove();modal=null;focus.restore(previous);},close,dispose(){clearInterval(timer);modal?.remove();}};
}
