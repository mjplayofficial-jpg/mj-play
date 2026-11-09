import {rankActors,actorAppearance} from '../components/actorResults.js';
import { demoItems } from './demo.js';
export function normalize(item,type) {
  return {id:item.id,tmdbId:item.id,imdbId:item.external_ids?.imdb_id||item.imdb_id||null,type:type||item.media_type||'movie',title:item.title||item.name||'Untitled',year:(item.release_date||item.first_air_date||'').slice(0,4),rating:item.vote_average?item.vote_average.toFixed(1):'—',poster:item.poster_path,backdrop:item.backdrop_path,releaseDate:item.release_date||item.first_air_date||'',overview:item.overview||'No description available.',genres:(item.genres||[]).map(g=>g.name),runtime:item.runtime||item.episode_run_time?.[0],cast:(item.credits?.cast||[]).slice(0,8),collection:item.belongs_to_collection||null,seasons:item.seasons||[]};
}
export class TmdbService {
  constructor(config={}) { this.config=config;this.cache=new Map();this.pending=new Map();this.demo=!config.tmdbApiKey&&!config.tmdbReadToken; }
  async request(path,params={}) {
    const key=path+JSON.stringify(Object.entries(params).sort(([a],[b])=>a.localeCompare(b)));
    if(this.pending.has(key))return this.pending.get(key);
    const request=this.fetchRequest(path,params);this.pending.set(key,request);
    try{return await request;}finally{this.pending.delete(key);}
  }
  async fetchRequest(path,params={}) {
    const query=new URLSearchParams({...params,language:this.config.language||'en-US'});
    if(this.config.tmdbApiKey) query.set('api_key',this.config.tmdbApiKey);
    const key=path+query.toString(); const cached=this.cache.get(key);
    if(cached&&cached.expires>Date.now()){this.cache.delete(key);this.cache.set(key,cached);return cached.value;}
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
    try { const response=await fetch('https://api.themoviedb.org/3/'+path+'?'+query,{signal:controller.signal,headers:this.config.tmdbReadToken?{Authorization:'Bearer '+this.config.tmdbReadToken}:{}});if(!response.ok)throw new Error('Catalogue request failed ('+response.status+')');const value=await response.json();this.cache.delete(key);if(this.cache.size>=100)this.cache.delete(this.cache.keys().next().value);this.cache.set(key,{value,expires:Date.now()+300000});return value; } finally {clearTimeout(timeout);}
  }
  async list(kind,type='movie') {if(this.demo)return demoItems.filter(x=>x.type===type);const path=kind==='trending'?`trending/${type}/week`:`${type}/${kind}`;return (await this.request(path)).results.map(x=>normalize(x,type));}
  async discoverGenre(type,genreId,name,options={}){return (await this.genreShelf(type,genreId,name,options)).items;}
  async genreShelf(type,genreId,name,{sort='popular',page=1,extraGenres,keyword,company}={}){
    const superheroes=genreId==='superheroes';
    if(!['movie','tv'].includes(type)||!superheroes&&!/^\d+(\|\d+)*$/.test(String(genreId))||!['popular','rated','new'].includes(sort)||!Number.isInteger(page)||page<1||page>500)throw new Error('Invalid genre');
    if(this.demo)return {items:page===1?demoItems.filter(item=>item.type===type&&item.genres.some(genre=>name.toLowerCase().includes(genre.toLowerCase()))):[],hasMore:false};
    const params={with_genres:String(genreId),sort_by:sort==='rated'?'vote_average.desc':'popularity.desc',include_adult:false,page};
    if(superheroes)delete params.with_genres;
    if(extraGenres){if(!/^\d+$/.test(String(extraGenres)))throw new Error('Invalid extra genre');params.with_genres=superheroes?String(extraGenres):String(genreId)+','+extraGenres;}
    const keywords=[...(superheroes?['superhero']:[]),...(keyword?[keyword]:[])],keywordIds=[];
    for(const word of keywords){const matches=(await this.request('search/keyword',{query:word})).results||[];const match=matches.find(x=>x.name.toLowerCase()===word.toLowerCase());if(!match)return {items:[],hasMore:false};keywordIds.push(match.id);}
    if(keywordIds.length)params.with_keywords=keywordIds.length===1?keywordIds[0]:[...new Set(keywordIds)].join(',');
    if(company){const matches=(await this.request('search/company',{query:company})).results||[];const match=matches.find(x=>x.name.toLowerCase()===company.toLowerCase());if(!match)return {items:[],hasMore:false};params.with_companies=match.id;}
    if(sort==='rated')params['vote_count.gte']=100;
    if(sort==='new'){
      const today=new Date(),since=new Date(today);since.setUTCMonth(since.getUTCMonth()-6);
      const field=type==='movie'?'primary_release_date':'first_air_date';
      params[field+'.gte']=since.toISOString().slice(0,10);params[field+'.lte']=today.toISOString().slice(0,10);
      params.sort_by=field+'.desc';params['vote_count.gte']=10;
    }
    const result=await this.request(`discover/${type}`,params);
    return {items:result.results.map(item=>normalize(item,type)),hasMore:page<Math.min(result.total_pages||1,500)};
  }
  trendingMovies(){return this.list('trending','movie');} trendingTv(){return this.list('trending','tv');}
  popularMovies(){return this.list('popular','movie');} popularTv(){return this.list('popular','tv');}
  topRatedMovies(){return this.list('top_rated','movie');} topRatedTv(){return this.list('top_rated','tv');}
  nowPlayingMovies(){return this.list('now_playing','movie');}
  async details(type,id) {if(!['movie','tv'].includes(type)||!/^\d+$/.test(String(id)))throw new Error('Invalid title');if(this.demo){const item=demoItems.find(x=>x.type===type&&x.id===Number(id));if(!item)throw new Error('Title unavailable');return item;}return normalize(await this.request(`${type}/${id}`,{append_to_response:'credits,external_ids'}),type);}
  async collection(id){if(!/^\d+$/.test(String(id)))throw new Error('Invalid collection');const data=await this.request('collection/'+id);return {name:data.name,items:(data.parts||[]).filter(p=>p.id&&p.adult!==true).sort((a,b)=>(a.release_date||'9999').localeCompare(b.release_date||'9999')||a.id-b.id).map(p=>normalize(p,'movie'))};}
  movieDetails(id){return this.details('movie',id);} tvDetails(id){return this.details('tv',id);}
  async seasonDetails(id,season){if(this.demo)return {episodes:[]};return this.request(`tv/${id}/season/${season}`);}
  async multiSearch(query,page=1){if(this.demo)return page===1?demoItems.filter(x=>x.title.toLowerCase().includes(query.toLowerCase())):[];const data=await this.request('search/multi',{query,page,include_adult:false});const items=data.results.filter(x=>['movie','tv'].includes(x.media_type)).map(x=>normalize(x));Object.defineProperty(items,'hasMore',{value:page<Math.min(data.total_pages||1,500)});return items;}
  async searchActors(query){if(this.demo)return [];const data=await this.request('search/person',{query,include_adult:false});return rankActors(data.results||[],query).map(p=>({id:p.id,name:p.name,photo:p.profile_path,knownFor:(p.known_for||[]).map(x=>x.title||x.name).filter(Boolean).slice(0,2).join(' · ')}));}
  async actorCredits(id){if(!/^\d+$/.test(String(id)))throw Error('Invalid actor');const data=await this.request('person/'+id,{append_to_response:'combined_credits'}),seen=new Set();const items=(data.combined_credits?.cast||[]).filter(x=>{const key=x.media_type+'/'+x.id;if(x.adult||!['movie','tv'].includes(x.media_type)||seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>(b.popularity||0)-(a.popularity||0)).map(x=>({...normalize(x,x.media_type),popularity:x.popularity||0,creditDate:x.release_date||x.first_air_date||'',appearance:actorAppearance(x)}));return {name:data.name,photo:data.profile_path,items};}
  async titleLogo(type,id){
    if(!['movie','tv'].includes(type)||!/^\d+$/.test(String(id)))throw new Error('Invalid title');
    if(this.demo)return null;
    const language=(this.config.language||'en-US').split('-')[0];
    const data=await this.request(`${type}/${id}/images`,{include_image_language:language+',en,null'});
    const logos=(data.logos||[]).filter(image=>/^\/[\w-]+\.png$/.test(image.file_path));
    logos.sort((a,b)=>(b.iso_639_1===language)-(a.iso_639_1===language)||(b.vote_average||0)-(a.vote_average||0));
    return logos[0]?.file_path||null;
  }
  async trailer(type,id){
    if(!['movie','tv'].includes(type)||!/^\d+$/.test(String(id)))throw new Error('Invalid title');
    if(this.demo)return null;
    const data=await this.request(`${type}/${id}/videos`);
    const videos=(data.results||[]).filter(video=>video.site==='YouTube'&&video.type==='Trailer'&&/^[-\w]{11}$/.test(video.key));
    videos.sort((a,b)=>Number(b.official)-Number(a.official)||String(b.published_at||'').localeCompare(String(a.published_at||'')));
    return videos[0]||null;
  }
  async recommendations(type,id){
    if(!['movie','tv'].includes(type)||!/^\d+$/.test(String(id)))throw new Error('Invalid title');
    if(this.demo)return demoItems.filter(item=>item.type===type&&item.id!==Number(id)).slice(0,20);
    let firstError;let results=[];
    try{results=(await this.request(`${type}/${id}/recommendations`)).results||[];}catch(error){firstError=error;}
    if(!results.length){try{results=(await this.request(`${type}/${id}/similar`)).results||[];}catch(error){throw firstError||error;}}
    const seen=new Set([Number(id)]);return results.filter(item=>!item.adult&&!seen.has(item.id)&&seen.add(item.id)).slice(0,20).map(item=>normalize(item,type));
  }
  credits(type,id){return this.request(`${type}/${id}/credits`);} externalIds(type,id){return this.request(`${type}/${id}/external_ids`);}
}
export const tmdb=new TmdbService(window.MJ_CONFIG||{});




