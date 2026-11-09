import {validCommand,minimalState} from './protocol.js';
export class TVCompanionClient {
 constructor({url,storage=globalThis.localStorage,Socket=globalThis.WebSocket,actions,getState,onChange=()=>{},localDevelopment=false}){
  const endpoint=new URL(url);
  const local=/^(127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(endpoint.hostname);
  if(endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname!=='/companion'||!(endpoint.protocol==='wss:'||(localDevelopment&&local&&endpoint.protocol==='ws:')))throw Error('Invalid companion endpoint');
  Object.assign(this,{url,storage,Socket,actions,getState,onChange});this.status='Disconnected';this.devices=[];this.code=null;this.pending=null;this.seen=new Set();this.identity=null;this.attempt=0;this.stopped=false;
  try{this.identity=JSON.parse(storage.getItem('mjplay.companion.identity.v1')||'null');this.devices=JSON.parse(storage.getItem('mjplay.companion.devices.v1')||'[]');if(!Array.isArray(this.devices))this.devices=[];}catch{}
 }
 changed(){this.onChange(this);}
 start(){this.stopped=false;this.connect();}
 send(value){if(this.socket?.readyState!==1)return false;this.socket.send(JSON.stringify({version:1,...value}));return true;}
 connect(){
  if(this.stopped)return;clearTimeout(this.retry);this.status=this.attempt?'Reconnecting':'Connecting';this.changed();
  this.lastMessage=Date.now();const socket=this.socket=new this.Socket(this.url);let authenticated=false;
  socket.onopen=()=>{if(socket!==this.socket)return;this.lastMessage=Date.now();this.send(this.identity?{type:'authTv',...this.identity}:{type:'registerTv'});};
  socket.onmessage=event=>{
   if(socket!==this.socket||typeof event.data!=='string'||event.data.length>8192)return;
   let m;try{m=JSON.parse(event.data);}catch{return;}if(m.version!==1)return;this.lastMessage=Date.now();
   if(m.type==='tvAuthenticated'){
    if(m.credential){this.identity={tvId:m.tvId,credential:m.credential};try{this.storage.setItem('mjplay.companion.identity.v1',JSON.stringify(this.identity));}catch{this.status='Credential storage failed';this.stopped=true;socket.close();return;}}
    authenticated=true;this.attempt=0;this.status='Connected';this.setDevices(m.devices);this.publish();
   }else if(m.type==='devices'){this.setDevices(m.devices);
   }else if(m.type==='pairCode'){this.code={code:m.code,expires:m.expires};this.pending=null;
   }else if(m.type==='pairRequest'){this.pending={pendingId:m.pendingId,name:m.name,expires:m.expires};
   }else if(m.type==='pairFailed'){this.code=null;this.pending=null;this.error=m.error;
   }else if(m.type==='error'){this.error=m.error;if(m.error==='AUTH_FAILED'){this.stopped=true;this.status='Authentication failed';socket.close();}
   }else if(m.type==='command'){
    if(!authenticated||!validCommand(m)||this.seen.has(m.requestId)){this.send({type:'result',requestId:m.requestId,ok:false});return;}
    this.seen.add(m.requestId);if(this.seen.size>500)this.seen.delete(this.seen.values().next().value);
    Promise.resolve().then(()=>this.actions(m)).then(()=>this.send({type:'result',requestId:m.requestId,ok:true}),()=>this.send({type:'result',requestId:m.requestId,ok:false})).finally(()=>this.publish());
   }
   this.changed();
  };
  socket.onerror=()=>{};
  socket.onclose=()=>{if(socket!==this.socket)return;clearInterval(this.health);this.code=null;this.pending=null;this.status='Disconnected';this.changed();if(!this.stopped){this.attempt++;this.retry=setTimeout(()=>this.connect(),Math.min(15000,1000*2**Math.min(this.attempt-1,4))+Math.random()*500);}};
  clearInterval(this.health);this.health=setInterval(()=>{if(Date.now()-this.lastMessage>45000){socket.close();return;}this.send({type:'heartbeat'});},15000);
 }
 setDevices(value){if(!Array.isArray(value))return;this.devices=value.slice(0,5).filter(d=>typeof d.deviceId==='string'&&typeof d.name==='string').map(d=>({deviceId:d.deviceId,name:d.name.slice(0,40),connected:d.connected===true}));try{this.storage.setItem('mjplay.companion.devices.v1',JSON.stringify(this.devices));}catch{}
 }
 publish(){if(this.status==='Connected')this.send({type:'state',state:minimalState({...this.getState(),connected:true,pairedDeviceCount:this.devices.length})});}
 pair(){this.error=null;if(!this.send({type:'pairStart'}))throw Error('Relay disconnected');}
 decide(allow){if(!this.pending||this.pending.expires<=Date.now())return;this.send({type:'pairDecision',pendingId:this.pending.pendingId,allow});this.pending=null;this.code=null;this.changed();}
 cancel(){this.send({type:'pairCancel'});this.code=null;this.pending=null;this.changed();}
 revoke(deviceId){this.send({type:'revoke',deviceId});}
 stop(){this.stopped=true;clearTimeout(this.retry);clearInterval(this.health);this.socket?.close();}
}
