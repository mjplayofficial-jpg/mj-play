import {appNow} from '../services/appClock.js';
import {protectedStorage} from './protectedStorage.js';
const KEYS={favorites:'mjplay.favorites.v1',recent:'mjplay.recent.v1'};
function metadata(item){
 const id=Number(item?.tmdbId??item?.id);
 if(!['movie','tv'].includes(item?.type)||!Number.isSafeInteger(id)||id<=0)return null;
 const text=value=>typeof value==='string'?value.slice(0,500):'';
 const art=value=>typeof value==='string'&&/^\/[\w./-]+$/.test(value)?value:null;
 return {id,tmdbId:id,type:item.type,title:text(item.title)||'Untitled',year:text(item.year),poster:art(item.poster),backdrop:art(item.backdrop),imdbId:/^tt\d+$/.test(item.imdbId)?item.imdbId:null};
}
export class Library {
 constructor(storage){this.storage=storage;}
 read(kind){try{const rows=JSON.parse(this.storage?.getItem(KEYS[kind])||'[]');if(!Array.isArray(rows))return [];
  const seen=new Set();return rows.flatMap(row=>{const item=metadata(row);if(!item)return [];const key=item.type+'/'+item.id;if(seen.has(key))return [];seen.add(key);
   if(kind==='recent'){if(!Number.isFinite(row.openedAt)||row.openedAt<=0)return [];if(item.type==='tv'&&(!Number.isSafeInteger(row.season)||row.season<1||!Number.isSafeInteger(row.episode)||row.episode<1))return [];Object.assign(item,{openedAt:row.openedAt,season:row.season,episode:row.episode,upNext:row.upNext===true});}
   return [item];}).slice(0,kind==='recent'?40:200);
 }catch{return [];}}
 write(kind,rows){try{if(!this.storage)return false;this.storage.setItem(KEYS[kind],JSON.stringify(rows));return true;}catch{return false;}}
 favorites(){return this.read('favorites');}
 recent(){return this.read('recent');}
 has(type,id){return this.favorites().some(x=>x.type===type&&x.id===Number(id));}
 last(type,id){return this.recent().find(x=>x.type===type&&x.id===Number(id));}
 toggle(item){const value=metadata(item);if(!value)return false;const rows=this.favorites(),found=rows.some(x=>x.type===value.type&&x.id===value.id);return this.write('favorites',found?rows.filter(x=>x.type!==value.type||x.id!==value.id):[value,...rows].slice(0,200));}
 record(item,season,episode){const value=metadata(item);if(!value)return false;if(value.type==='tv'&&(!Number.isSafeInteger(season)||season<1||!Number.isSafeInteger(episode)||episode<1))return false;
  return this.write('recent',[{...value,season:value.type==='tv'?season:undefined,episode:value.type==='tv'?episode:undefined,openedAt:appNow()},...this.recent().filter(x=>x.type!==value.type||x.id!==value.id)].slice(0,40));}
 removeRecent(type,id){return this.write('recent',this.recent().filter(x=>x.type!==type||x.id!==Number(id)));}
 advance(item,season,episode,next){
  if(item.type!=='tv'||!Number.isSafeInteger(next?.season)||next.season<1||!Number.isSafeInteger(next?.episode)||next.episode<1)return false;
  const rows=this.recent(),current=rows.find(x=>x.type==='tv'&&x.id===Number(item.tmdbId??item.id));
  if(!current||current.season!==season||current.episode!==episode)return false;
  return this.write('recent',rows.map(x=>x===current?{...x,season:next.season,episode:next.episode,upNext:true}:x));
 }
}
function localStorageOrNull(){try{return globalThis.localStorage||null;}catch{return null;}}
export const library=new Library(protectedStorage);
