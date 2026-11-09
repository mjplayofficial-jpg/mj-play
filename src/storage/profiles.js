import {protectedStorage as storage} from './protectedStorage.js';
import {profileState,profileKeys} from './profileState.js';
const key='mjplay.profiles.v1';
export function profiles(){try{const rows=JSON.parse(storage.getItem(key)||'[]');if(Array.isArray(rows)&&rows.some(p=>p.id==='me'))return rows.filter(p=>['me','wife','guest'].includes(p.id)).map(p=>({id:p.id,name:String(p.name||p.id).slice(0,30)}));}catch{}return [{id:'me',name:'Husbae'},{id:'wife',name:'Wifey'},{id:'guest',name:'Leech'}];}
export function initializeProfiles(){
 profileState.enabled=false;
 if(!storage.getItem(key)){
  for(const name of profileKeys){const value=storage.getItem(name);if(value!==null)storage.setItem('mjplay.profile.me/'+name,value);}
  for(const [name,value] of storage.entries())if(name.startsWith('mjplay.subtitle.offset.v2/'))storage.setItem('mjplay.profile.me/'+name,value);
  storage.setItem(key,JSON.stringify(profiles()));
 }
 const renamed=profiles().map(p=>({...p,name:p.id==='me'&&p.name==='Me'?'Husbae':p.id==='wife'&&p.name==='My wife'?'Wifey':p.id==='guest'&&p.name==='Guest'?'Leech':p.name}));
 storage.setItem(key,JSON.stringify(renamed));
 profileState.enabled=true;profileState.id='me';
}
export function selectProfile(id){if(!profiles().some(p=>p.id===id))throw Error('Unknown profile');if(profileState.id==='guest'||id==='guest')storage.clearGuest();profileState.id=id;}
export function renameProfile(id,name){name=String(name).trim().slice(0,30);if(!name||id==='guest')throw Error('Choose a profile name');storage.setItem(key,JSON.stringify(profiles().map(p=>p.id===id?{...p,name}:p)));}
export const activeProfile=()=>profiles().find(p=>p.id===profileState.id)||profiles()[0];
