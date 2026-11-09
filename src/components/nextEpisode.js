import {progressStore} from '../storage/progress.js';
export async function findNextEpisode(service,item,season,episode){
 const today=new Date().toISOString().slice(0,10),id=item.tmdbId??item.id;
 const seasons=[Number(season),...(item.seasons||[]).map(s=>s.season_number).filter(s=>s>Number(season)).sort((a,b)=>a-b)];
 for(const s of seasons){const data=await service.seasonDetails(id,s);for(const ep of (data.episodes||[]).filter(e=>e.episode_number>(s===Number(season)?Number(episode):0)).sort((a,b)=>a.episode_number-b.episode_number)){
 if(ep.air_date&&ep.air_date>today)continue;const saved=progressStore.latest('Direct',item,s,ep.episode_number);if(saved&&(saved.completed||saved.duration-saved.position<=15))continue;return {season:s,episode:ep.episode_number};}}
 return null;
}
