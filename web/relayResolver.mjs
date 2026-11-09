import {webcrypto} from 'node:crypto';
import {mediaTarget,verifiedMediaSource} from './localRelay.mjs';
const origin='https://vidrock.to';
export function titlePath(type,id,season,episode){
 if(!['movie','tv'].includes(type)||!/^\d{1,10}$/.test(String(id))||Number(id)<1)throw Error('Invalid title');
 if(type==='tv'&&![season,episode].every(n=>Number.isSafeInteger(n)&&n>0&&n<10000))throw Error('Invalid episode');
 return type+'/'+id+(type==='tv'?'/'+season+'/'+episode:'');
}
export function createRelayResolver(request=fetch){
 let decoder,until=0,pending;
 async function read(url,referer,max){
  const r=await request(url,{headers:{Referer:referer,Origin:origin,Accept:'*/*'},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('Source unavailable');let body='',size=0;
  for await(const bytes of r.body){size+=bytes.length;if(size>max)throw Error('Source response too large');body+=Buffer.from(bytes).toString('utf8');}return body;
 }
 async function getDecoder(){
  if(decoder&&until>Date.now())return decoder;
  if(pending)return pending;
  pending=(async()=>{
   const html=await read(origin+'/',origin+'/',1048576);
   const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>new URL(m[1],origin)).filter(u=>u.origin===origin&&/^\/assets\/index-[\w-]+\.js$/.test(u.pathname));
   if(!scripts.length)throw Error('Source format changed');
   const js=await read(scripts[0].href,origin+'/',5242880),hex=js.match(/TQ=["']([a-f0-9]{32,64})["']/)?.[1];
   if(!hex||![32,48,64].includes(hex.length))throw Error('Source format changed');
   decoder=await webcrypto.subtle.importKey('raw',Buffer.from(hex,'hex'),'AES-GCM',false,['decrypt']);until=Date.now()+300000;return decoder;
  })();try{return await pending;}finally{pending=null;}
 }
 return async function resolve(type,id,season,episode){
  const path=titlePath(type,id,season,episode),key=await getDecoder();
  const data=JSON.parse(await read(origin+'/api/'+path,origin+'/'+path,1048576));
  for(const [name,entry]of Object.entries(data)){
   if(name!=='Orion'||!entry||typeof entry.url!=='string'||entry.url.length>16384)continue;
   try{const bytes=Buffer.from(entry.url,'base64url');if(bytes.length<29)continue;
    const plain=await webcrypto.subtle.decrypt({name:'AES-GCM',iv:bytes.subarray(0,12)},key,bytes.subarray(12));
    const url=new TextDecoder().decode(plain);if(mediaTarget(url)&&new URL(url).pathname.endsWith('.m3u8'))return verifiedMediaSource(url);
   }catch{}
  }
  throw Error('Compatible source unavailable');
 };
}
