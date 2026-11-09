import {tmdb} from '../services/tmdb.js';
import {row,artwork} from './ui.js';
import {mountMovieCollection} from './MovieCollection.js';

export function mountRecentEpisodes(root,service=tmdb){
 let disposed=false;
 for(const label of [...root.querySelectorAll('[data-recent-episode]')].slice(0,12)){
  const [id,season,episode]=label.dataset.recentEpisode.split('/').map(Number);
  service.seasonDetails(id,season).then(result=>{
   if(disposed||!root.contains(label))return;
   const item=result.episodes?.find(value=>value.episode_number===episode);
   const image=root.querySelector?.(`[data-recent-art="${id}/${season}/${episode}"]`);if(image&&item?.still_path)image.src=artwork(item.still_path,'w500');
   if(item?.name)label.textContent=`S${season} E${episode} · ${item.name}`;
  }).catch(()=>{});
 }
 return ()=>{disposed=true;};
}

export function mountRelatedTitles(root,type,id,service=tmdb,state={}){
 const stopCollection=mountMovieCollection(root,type,id,service);
 const section=root.querySelector('#related-titles');if(!section)return ()=>{};
 let disposed=false,busy=false;
 const paint=items=>{section.innerHTML=items.length?row('More Like This',items).replace(/^<section[^>]*>/,'').replace(/<\/section>$/,''):'<h2>More Like This</h2><p class="genre-message subtle">No related titles available yet.</p>';};
 const load=async()=>{
  if(disposed||busy)return;busy=true;
  try{
   const items=await service.recommendations(type,id);if(disposed)return;
   state.relatedTitles=items;paint(items);
  }catch{
   if(!disposed){section.innerHTML='<h2>More Like This</h2><p class="genre-message subtle">Related titles could not load.</p><button class="genre-retry" data-focus="related-retry" id="related-retry">Try Again</button>';section.querySelector('#related-retry').onclick=load;}
  }finally{busy=false;}
 };
 if(Array.isArray(state.relatedTitles))paint(state.relatedTitles);else load();return ()=>{disposed=true;stopCollection();};
}
