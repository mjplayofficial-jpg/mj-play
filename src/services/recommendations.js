import {taste} from '../storage/taste.js';
const identity=x=>x.type+'/'+(x.tmdbId??x.id);
export function recommendationSeeds(recent,favorites,progress){
 const scores=new Map();
 for(const item of favorites)scores.set(identity(item),{...item,score:3});
 for(const [index,item] of recent.entries()){
  const suffix='/'+identity(item),watched=progress.filter(p=>p.key.endsWith(suffix)||p.key.includes(suffix+'/')).some(p=>p.completed||p.position>=300);
  if(!watched)continue;const prior=scores.get(identity(item));scores.set(identity(item),{...item,score:(prior?.score||0)+6-index*.1});
 }
 return [...scores.values()].sort((a,b)=>b.score-a.score).slice(0,3);
}
export async function personalShelves(service,recent,favorites,progress){
 const known=new Set([...recent,...favorites].map(identity)),finished=[];
 for(const p of [...progress].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))){if(!p.completed&&p.position<300)continue;const match=p.key.match(/\/(movie|tv)\/(\d+)(?:\/|$)/);if(!match)continue;const key=match[1]+'/'+match[2];if(known.has(key))continue;known.add(key);finished.push({type:match[1],id:Number(match[2])});if(finished.length===3)break;}
 const details=await Promise.allSettled(finished.map(x=>service.details(x.type,x.id)));
 const ratings=taste(),liked=[];for(const key of Object.keys(ratings).filter(k=>ratings[k].value==='like').slice(0,3)){const [type,id]=key.split('/');try{liked.push(await service.details(type,id));}catch{}}
 const history=[...recent,...details.filter(x=>x.status==='fulfilled').map(x=>x.value)];
 const seeds=recommendationSeeds(history,[...liked,...favorites].filter(x=>ratings[identity(x)]?.value!=='dislike'),progress).filter(x=>ratings[identity(x)]?.value!=='dislike'),excluded=new Set([...history,...favorites].map(identity)),seen=new Set(),shelves=[];
 const results=await Promise.allSettled(seeds.map(seed=>service.recommendations(seed.type,seed.id)));
 for(let i=0;i<results.length;i++){if(results[i].status!=='fulfilled')continue;
  const items=results[i].value.filter(item=>{const key=identity(item);if(ratings[key]?.value==='dislike'||excluded.has(key)||seen.has(key))return false;seen.add(key);return true;}).slice(0,12);
  if(items.length)shelves.push({title:(history.some(x=>identity(x)===identity(seeds[i]))?'Because you watched ':'Inspired by your list · ')+seeds[i].title,items});
 }
 // One profile-specific shelf, interleaving films and series.
 const pools={movie:[],tv:[]};for(const shelf of shelves)for(const item of shelf.items)if(pools[item.type])pools[item.type].push(item);
 if(seeds.length)for(const type of ['movie','tv']){if(pools[type].length)continue;const load=type==='movie'?service.popularMovies:service.popularTv;if(!load)continue;try{for(const item of await load.call(service)){const key=identity(item);if(item.type!==type||ratings[key]?.value==='dislike'||excluded.has(key)||seen.has(key))continue;seen.add(key);pools[type].push(item);if(pools[type].length===8)break;}}catch{}}
 const mixed=[];for(let i=0;mixed.length<16&&(i<pools.movie.length||i<pools.tv.length);i++)for(const type of ['movie','tv'])if(pools[type][i]&&mixed.length<16)mixed.push(pools[type][i]);
 return mixed.length?[{title:'Picked for you',items:mixed}]:[];
}
