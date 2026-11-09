const KEY='mjplay.playback-diagnostics.v1';
export function createDiagnosticLog(storage){
 let rows=[];try{const saved=JSON.parse(storage?.getItem(KEY)||'[]');if(Array.isArray(saved))rows=saved.slice(-200);}catch{}
 return {record(event,details={}){const row={time:new Date().toISOString(),event,...details};rows.push(row);rows=rows.slice(-200);try{storage?.setItem(KEY,JSON.stringify(rows));}catch{}console.info('MJ Play diagnostic',row);},read(){return rows.slice();}};
}
export function watchPlayback(frame,origin,context,win=window,doc=document){
 let storage;try{storage=win.localStorage;}catch{}
 const log=createDiagnosticLog(storage),listeners=[];
 const record=(event,details={})=>log.record(event,{...context,...details});
 const listen=(target,type,handler)=>{target.addEventListener(type,handler);listeners.push(()=>target.removeEventListener(type,handler));};
 record('iframe-created',{origin});
 listen(frame,'load',()=>record('iframe-load'));
 listen(frame,'error',()=>record('iframe-error'));
 listen(win,'message',event=>{
  if(event.source!==frame.contentWindow||event.origin!==origin)return;
  let data=event.data;if(typeof data==='string'){if(data.length>8192)return;try{data=JSON.parse(data);}catch{return;}}
  // Store only known status values, never arbitrary provider payloads or URLs.
  if(data?.type!=='PLAYER_EVENT')return;
  const status=data.data?.player_status;if(!['playing','paused','seeked','completed','error','ready','waiting'].includes(status))return;
  if(status===lastStatus)return;lastStatus=status;record('provider-status',{status});
 });
 let lastStatus;
 listen(doc,'visibilitychange',()=>record('visibility',{hidden:doc.hidden}));
 listen(win,'blur',()=>record('window-blur'));
 listen(win,'focus',()=>record('window-focus'));
 listen(win,'pagehide',event=>record('pagehide',{persisted:event.persisted}));
 listen(win,'error',()=>record('parent-error'));
 listen(win,'unhandledrejection',()=>record('parent-unhandled-rejection'));
 return ()=>{record('iframe-destroyed');listeners.forEach(remove=>remove());};
}

export function playbackHealth(storage){let rows=[];try{rows=JSON.parse(storage?.getItem(KEY)||'[]');}catch{}if(!Array.isArray(rows))rows=[];const attempts=rows.filter(x=>x.event==='iframe-created').length,errors=rows.filter(x=>x.event==='iframe-error'||x.event==='provider-status'&&x.status==='error').length,playing=rows.filter(x=>x.event==='provider-status'&&x.status==='playing').length;return {attempts,errors,playing};}
