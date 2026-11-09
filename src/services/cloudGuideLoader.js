import {appNow} from './appClock.js';
const storageKey='mjplay.cloud-guides.v1';
export function createGuideLoader({sources,parsePayload,parseXml,cloudUrl='',fetcher=globalThis.fetch,storage=globalThis.localStorage,now=()=>appNow()}){
 const cache=new Map(),pending=new Map();
 const fresh=p=>Array.isArray(p)&&p.some(p=>p.end>now());
 const read=()=>{try{const saved=JSON.parse(storage?.getItem(storageKey)||'[]');return Array.isArray(saved)?saved.slice(0,32):[];}catch{return [];}};
 const persisted=(number,source)=>{try{const value=read().find(p=>p.channel===number&&p.sourceId===source.id);return value?parsePayload(value,number):null;}catch{return null;}};
 const remember=payload=>{try{storage?.setItem(storageKey,JSON.stringify([payload,...read().filter(p=>p.channel!==payload.channel)].slice(0,32)));}catch{}};
 const request=async(url,source,number,cloud=false)=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),cloud?3500:7000);try{const response=await fetcher(url,{signal:controller.signal});if(!response.ok)throw Error('Schedule unavailable');const text=await response.text();if(text.length>1000000)throw Error('Schedule too large');let payload,programmes;if(cloud||source.format==='json'){payload=JSON.parse(text);if(payload.sourceId!==source.id)throw Error('Schedule source mismatch');programmes=parsePayload(payload,number);}else programmes=parseXml(text,source.id);if(!fresh(programmes))throw Error('Schedule expired');if(cloud)remember(payload);return programmes;}finally{clearTimeout(timer);}};
 return async(number)=>{number=Number(number);const source=sources[number];if(!source)return null;const old=cache.get(number);if(old&&now()-old.at<900000&&fresh(old.programmes))return old.programmes;if(pending.has(number))return pending.get(number);
 const work=(async()=>{let programmes,error;const cloud=/^https:\/\//.test(cloudUrl)?cloudUrl.replace(/\/$/,'')+'/guides/'+number+'.json':'';if(cloud)try{programmes=await request(cloud,source,number,true);}catch(e){error=e;}if(!programmes){const saved=old?.programmes||persisted(number,source);if(fresh(saved))programmes=saved;}if(!programmes)try{programmes=await request(source.url,source,number);}catch(e){error=e;}if(!programmes)throw error||Error('Schedule unavailable');cache.set(number,{at:now(),programmes});return programmes;})().finally(()=>pending.delete(number));pending.set(number,work);return work;
 };
}
