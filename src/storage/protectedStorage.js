import {resolveProfileKey} from './profileState.js';
const keys=new Set(['mjplay.video.quality.v1','mjplay.recent.v1','mjplay.favorites.v1','mjplay.progress.v1','mjplay.opensubtitles.key.v1','mj-subtitle-language','mj-subtitle-size','mj-autoplay-next','mj-live-favourites','mjplay.profiles.v1','mjplay.cloud.auth.v1','mjplay.cloud.last.v1','mjplay.search.history.v1']);
const protectedKey=key=>keys.has(key)||key.startsWith('mjplay.profile.')||key.startsWith('mjplay.subtitle.offset.v2/');
const caches=['mjplay.subtitles.cache.v1','mjplay.subtitles.cache.v2','mjplay.cloud-guides.v1','mjplay.playback-diagnostics.v1'];
// History has priority over replaceable subtitle/guide caches when storage is full.
export function createProtectedStorage(storage,persist=()=>false,resolve=key=>key){
 const memory=new Map(),target=()=>typeof storage==='function'?storage():storage;
 return {
  getItem(key){key=resolve(key);if(memory.has(key))return memory.get(key);if(key.startsWith('mjplay.profile.guest/'))return null;try{const value=target()?.getItem(key);if(value!==null&&value!==undefined)return value;}catch{}return null;},
  setItem(key,value){key=resolve(key);value=String(value);if(key.startsWith('mjplay.profile.guest/')){memory.set(key,value);return;}let saved=false;try{target()?.setItem(key,value);saved=!!target();}catch{if(protectedKey(key)){for(const cache of caches)try{target().removeItem(cache);}catch{}try{target().setItem(key,value);saved=true;}catch{}}}
   if(protectedKey(key)){memory.set(key,value);const backed=persist(key,value);if(!saved&&!backed)throw Error('History storage unavailable');return;}if(!saved)throw Error('Storage unavailable');
  },
  hydrate(entries){for(const [key,value] of entries){if(!protectedKey(key)||key.startsWith('mjplay.profile.guest/')||typeof value!=='string')continue;let current;try{current=target()?.getItem(key);}catch{}if(current===null||current===undefined){memory.set(key,value);try{target()?.setItem(key,value);}catch{}}}},
  clearGuest(){for(const key of memory.keys())if(key.startsWith('mjplay.profile.guest/'))memory.delete(key);},
  entries(){const all=new Map();try{for(let i=0;i<target().length;i++){const key=target().key(i);if(protectedKey(key))all.set(key,target().getItem(key));}}catch{}for(const [key,value] of memory)all.set(key,value);return [...all].filter(([key])=>!key.startsWith('mjplay.profile.guest/'));},
  snapshot(){for(const [key,value] of this.entries())persist(key,value);}
 };
}
let db;
const persist=(key,value)=>{if(!db)return false;try{const tx=db.transaction('values','readwrite');tx.objectStore('values').put(value,key);return true;}catch{return false;}};
export const protectedStorage=createProtectedStorage(()=>globalThis.localStorage,persist,resolveProfileKey);
export async function initializeProtectedStorage(){
 if(!globalThis.indexedDB)return;
 try{await new Promise((resolve,reject)=>{const request=indexedDB.open('mjplay-library-backup',1),timer=setTimeout(()=>reject(Error('Backup timeout')),2000);request.onupgradeneeded=()=>request.result.createObjectStore('values');request.onerror=()=>{clearTimeout(timer);reject(request.error);};request.onsuccess=()=>{clearTimeout(timer);db=request.result;resolve();};});
  const entries=await new Promise((resolve,reject)=>{const rows=[],tx=db.transaction('values','readonly'),request=tx.objectStore('values').openCursor();request.onsuccess=()=>{const cursor=request.result;if(cursor){rows.push([cursor.key,cursor.value]);cursor.continue();}};tx.oncomplete=()=>resolve(rows);tx.onerror=()=>reject(tx.error);});
  protectedStorage.hydrate(entries);protectedStorage.snapshot();
 }catch{/* Keep playback available if the TV's backup database is unavailable. */}
}
