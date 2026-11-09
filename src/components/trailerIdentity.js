// YouTube requires an app-identifying Referer for local WebViews.
// Scope it to embed document requests; do not change other app traffic.
export async function trailerIdentity(){
 if(globalThis.location?.protocol!=='file:')return ()=>{};
 const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),4000);
 let socket;const pending=new Map();let id=0;
 const close=()=>{clearTimeout(timeout);abort.abort();socket?.close();for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Trailer identity closed'));}pending.clear();};
 try{
  const response=await fetch('http://127.0.0.1:9998/json/list',{signal:abort.signal});
  const targets=await response.json(),target=targets.find(t=>{try{const u=new URL(t.url);return u.protocol==='file:'&&u.pathname.includes('/com.mjentertainment.mjplay/');}catch{return false;}});
  if(!target?.webSocketDebuggerUrl)throw Error('TV inspector unavailable');
  const url=new URL(target.webSocketDebuggerUrl);url.hostname='127.0.0.1';url.port='9998';socket=new WebSocket(url.href);
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error('Trailer identity timed out'));},4000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params}));});
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error('Trailer identity unavailable')):p.resolve(m.result);}}else if(m.method==='Fetch.requestPaused'){
   const request=m.params.request,headers=Object.entries(request.headers||{}).filter(([name])=>name.toLowerCase()!=='referer').map(([name,value])=>({name,value:String(value)}));
   headers.push({name:'Referer',value:'https://com.mjentertainment.mjplay/'});
   call('Fetch.continueRequest',{requestId:m.params.requestId,headers}).catch(()=>{});
  }};
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=()=>reject(Error('TV inspector unavailable'));abort.signal.addEventListener('abort',()=>reject(Error('Trailer identity timed out')),{once:true});});
  await call('Fetch.enable',{patterns:[{urlPattern:'https://www.youtube.com/embed/*',resourceType:'Document',requestStage:'Request'}]});clearTimeout(timeout);
  return ()=>{if(socket.readyState===1)call('Fetch.disable').finally(close).catch(()=>{});else close();};
 }catch(error){close();throw error;}
}
