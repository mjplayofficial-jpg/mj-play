import {randomBytes} from 'node:crypto';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export const fallbackLiveHosts=['edge.wedd48c.top','edge.cowedd4855ws.sbs'];
export function parseLiveHosts(value){
 if(typeof value!=='string'||value.length>4096)throw Error('Invalid live_source_config');
 const data=JSON.parse(value),hosts=data?.allowed_hosts;
 if(!Array.isArray(hosts)||!hosts.length||hosts.length>16||hosts.some(h=>typeof h!=='string'||!/^edge\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:sbs|top)$/.test(h)))throw Error('Invalid approved live host');
 return [...new Set(hosts)];
}

// Read-only client fetch protocol used by Firebase's JS SDK. No admin key or
// viewer data is sent. One installation represents this backend process.
export function createLiveSourceConfig({fetcher=fetch,now=Date.now,cacheFile=process.env.MJ_LIVE_CONFIG_CACHE||new URL('../.cache/live-source-config.json',import.meta.url),configFile=new URL('./firebaseConfig.json',import.meta.url)}={}){
 cacheFile=cacheFile instanceof URL?fileURLToPath(cacheFile):cacheFile;
 let hosts=[...fallbackLiveHosts],next=0,flight,installation,options,loaded=false;
 async function json(url,body,extra={}){
  const response=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json',...extra},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('Firebase config HTTP '+response.status);
  let length=0;const chunks=[];for await(const chunk of response.body){length+=chunk.length;if(length>65536)throw Error('Firebase config too large');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString());
 }
 async function refresh(){
  if(!loaded){loaded=true;try{hosts=parseLiveHosts(await readFile(cacheFile,'utf8'));}catch{}}
  try{
   options??=JSON.parse(await readFile(configFile,'utf8'));
   const {projectId,appId,apiKey}=options;
   const base='https://firebaseinstallations.googleapis.com/v1/projects/'+projectId+'/installations';
   if(!installation){const bytes=randomBytes(17);bytes[0]=0x70|(bytes[0]&15);installation=await json(base,{fid:bytes.toString('base64url').slice(0,22),authVersion:'FIS_v2',appId,sdkVersion:'w:0.6.18'},{'x-goog-api-key':apiKey});installation.expires=now()+Number.parseInt(installation.authToken.expiresIn,10)*1000-60000;}
   if(installation.expires<=now()){
    const token=await json(base+'/'+installation.fid+'/authTokens:generate',{installation:{appId,sdkVersion:'w:0.6.18'}},{'x-goog-api-key':apiKey,Authorization:'FIS_v2 '+installation.refreshToken});
    installation.authToken=token;installation.expires=now()+Number.parseInt(token.expiresIn,10)*1000-60000;
   }
   const result=await json('https://firebaseremoteconfig.googleapis.com/v1/projects/'+projectId+'/namespaces/firebase:fetch?key='+apiKey,{sdk_version:'12.4.0',app_id:appId,app_instance_id:installation.fid,app_instance_id_token:installation.authToken.token,language_code:'en'});
   const approved=parseLiveHosts(result.entries?.live_source_config);
   const changed=JSON.stringify(hosts)!==JSON.stringify(approved);hosts=approved;
   try{await mkdir(dirname(cacheFile),{recursive:true});await writeFile(cacheFile+'.pending',JSON.stringify({allowed_hosts:hosts}));await rename(cacheFile+'.pending',cacheFile);}catch{}
   if(changed)console.info('Live source configuration updated from Firebase');
  }catch(error){console.warn('Live source config: retaining approved fallback ('+error.message+')');}
  return [...hosts];
 }
 return {async getHosts(){if(flight)return flight;if(now()<next)return [...hosts];next=now()+60000;flight=refresh();try{return await flight;}finally{flight=null;}},snapshot(){return [...hosts];}};
}
export const liveSourceConfig=createLiveSourceConfig();
