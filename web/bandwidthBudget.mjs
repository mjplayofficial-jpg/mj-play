import {existsSync,readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
export function createBandwidthBudget({file,admission=7_000_000_000_000,limit=8_000_000_000_000,now=Date.now}={}){
 if(!file)throw Error('Persistent bandwidth file required');
 if(!Number.isSafeInteger(admission)||!Number.isSafeInteger(limit)||admission<=0||limit<admission)throw Error('Invalid bandwidth limits');
 let state={version:1,months:{},days:{}},failure=null;
 try{if(existsSync(file)){state=JSON.parse(readFileSync(file,'utf8'));if(state.version!==1||!state.months||Object.entries(state.months).some(([k,v])=>!/^\d{4}-\d{2}$/.test(k)||!Number.isSafeInteger(v)||v<0))throw Error('Invalid bandwidth ledger');}}catch{failure='Bandwidth ledger unavailable';}
 state.days??={};
 const month=()=>new Date(now()).toISOString().slice(0,7);
 const status=()=>{const bytes=state.months[month()]||0;const date=new Date(now()),elapsed=Math.max(1,(date.getTime()-Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1))/86400000),days=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();return {month:month(),bytes,todayBytes:state.days[date.toISOString().slice(0,10)]||0,projectedMonthBytes:Math.ceil(bytes/elapsed*days),admissionBytes:admission,cutoffBytes:limit,remainingBytes:Math.max(0,limit-bytes),warning:bytes>=admission*.8,admissionStopped:!!failure||bytes>=admission,cutoff:!!failure||bytes>=limit,healthy:!failure};};
 function charge(bytes){if(failure)return false;if(!Number.isSafeInteger(bytes)||bytes<0)throw Error('Invalid byte count');const key=month();state.months[key]=(state.months[key]||0)+bytes;const day=new Date(now()).toISOString().slice(0,10);state.days[day]=(state.days[day]||0)+bytes;
 try{mkdirSync(dirname(file),{recursive:true,mode:0o700});writeFileSync(file+'.pending',JSON.stringify(state),{mode:0o600,flush:true});renameSync(file+'.pending',file);return true;}catch{failure='Bandwidth ledger unavailable';return false;}}
 function meter(req,res){const write=res.write.bind(res),end=res.end.bind(res);const size=(chunk,encoding)=>chunk==null?0:typeof chunk==='string'?Buffer.byteLength(chunk,typeof encoding==='string'?encoding:undefined):chunk.byteLength;
 const account=(chunk,encoding)=>{if(req.method==='HEAD')return true;const ok=charge(size(chunk,encoding));return ok||!req.mjMeteredMedia;};
 res.write=function(chunk,encoding,callback){if(!account(chunk,encoding)){res.destroy(Error('Bandwidth accounting unavailable'));return false;}return write(chunk,encoding,callback);};
 res.end=function(chunk,encoding,callback){if(!account(chunk,encoding)){res.destroy(Error('Bandwidth accounting unavailable'));return res;}return end(chunk,encoding,callback);};
 }
 function allow(req,res){const path=new URL(req.url,'http://localhost').pathname;if(req.method==='OPTIONS'||req.method==='HEAD')return true;
 const media=/^\/api\/(live\/|tv-live\/|relay\/|playback\/)/.test(path)&&!path.endsWith('/session');if(!media)return true;req.mjMeteredMedia=true;
 const continuation=path.includes('/media/')||/^\/api\/relay\/[a-f0-9]{48}$/.test(path);const s=status();if(s.cutoff||s.admissionStopped&&!continuation){res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store','Retry-After':'3600','Access-Control-Allow-Origin':'*'}).end(JSON.stringify({error:'Playback is temporarily limited by the server bandwidth budget.',code:'BANDWIDTH_BUDGET'}));return false;}return true;
 }
 return {status,charge,meter,allow};
}
