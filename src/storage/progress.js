import {appNow} from '../services/appClock.js';
import {protectedStorage} from './protectedStorage.js';
const key='mjplay.progress.v1';
function identity(provider,item,season,episode){return `${provider}/${item.type}/${item.tmdbId??item.id}${item.type==='tv'?`/${season}/${episode}`:''}`;}
export class ProgressStore{
 constructor(storage){this.storage=storage;}
 rows(){try{const rows=JSON.parse(this.storage?.getItem(key)||'[]');return Array.isArray(rows)?rows.filter(row=>typeof row.key==='string'&&row.key.length<200&&Number.isFinite(row.position)&&Number.isFinite(row.duration)&&row.position>=0&&row.duration>0&&row.duration<=604800&&row.position<=row.duration&&Number.isFinite(row.updatedAt)).slice(0,200):[];}catch{return [];}}
 get(provider,item,season,episode){return this.rows().find(row=>row.key===identity(provider,item,season,episode));}
 latest(provider,item,season,episode){
  if(/demo/i.test(provider))return this.get(provider,item,season,episode);
  const suffix=identity('',item,season,episode);
  const rows=this.rows().filter(row=>row.key.endsWith(suffix)&&!/demo/i.test(row.key.split('/')[0])).sort((a,b)=>b.updatedAt-a.updatedAt);
  const newest=rows[0];
  // Recover legacy startup records without reviving completed or intentionally restarted titles.
  if(newest&&!newest.completed&&!newest.restarted&&newest.position<10)return rows.find(row=>row.completed||(row.position>=10&&row.duration-row.position>15))||newest;
  return newest;
 }
 save(provider,item,season,episode,value){
  if(!['movie','tv'].includes(item.type)||!Number.isSafeInteger(Number(item.tmdbId??item.id))||Number(item.tmdbId??item.id)<=0)return false;
  if(item.type==='tv'&&(!Number.isSafeInteger(season)||season<1||!Number.isSafeInteger(episode)||episode<1))return false;
  if(!Number.isFinite(value.position)||!Number.isFinite(value.duration)||value.position<0||value.duration<=0||value.duration>604800||value.position>value.duration)return false;
  const id=identity(provider,item,season,episode);
  const prior=this.get(provider,item,season,episode);if(value.position<10&&!value.restarted&&!value.completed&&prior?.position>=10&&!prior.completed)return true;
  try{if(!this.storage)return false;this.storage.setItem(key,JSON.stringify([{key:id,position:value.position,duration:value.duration,completed:value.completed===true,restarted:value.restarted===true||(value.position<10&&this.get(provider,item,season,episode)?.restarted===true),updatedAt:appNow()},...this.rows().filter(row=>row.key!==id)].slice(0,200)));return true;}catch{return false;}
 }
 clearItem(type,id){try{this.storage?.setItem(key,JSON.stringify(this.rows().filter(row=>!row.key.includes(`/${type}/${Number(id)}/`)&&!row.key.endsWith(`/${type}/${Number(id)}`))));}catch{}}
}
let storage;try{storage=globalThis.localStorage;}catch{}
export const progressStore=new ProgressStore(protectedStorage);
