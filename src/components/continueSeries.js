import {library} from '../storage/library.js';
import {progressStore} from '../storage/progress.js';
import {findNextEpisode} from './nextEpisode.js';
import {playbackState} from './progressState.js';
import {activeProfile} from '../storage/profiles.js';
export const finishedProgress=value=>playbackState(value,'tv').watched;
export const finishedMovieProgress=value=>playbackState(value,'movie').watched;
export async function advanceContinueWatching(item,season,episode,prepare,{history=library,progress=progressStore}={}){
 const profile=activeProfile().id;
 if(item.type!=='tv'||!finishedProgress(progress.latest('Direct',item,season,episode)))return false;
 const next=await prepare();
 // Do not overwrite a later episode, a restart, or a removal while metadata was loading.
 if(history===library&&activeProfile().id!==profile||!next||!finishedProgress(progress.latest('Direct',item,season,episode)))return false;
 return history.advance(item,season,episode,next);
}
export async function reconcileContinueWatching(service){
 const profile=activeProfile().id;
 let removed=false;for(const item of library.recent())if(item.type==='movie'&&finishedMovieProgress(progressStore.latest('Direct',item)))removed=library.removeRecent('movie',item.id)||removed;
 const results=await Promise.allSettled(library.recent().filter(item=>item.type==='tv'&&finishedProgress(progressStore.latest('Direct',item,item.season,item.episode))).map(async item=>{
  const full=await service.details('tv',item.id);
  if(activeProfile().id!==profile)return false;
  return advanceContinueWatching(item,item.season,item.episode,()=>findNextEpisode(service,full,item.season,item.episode));
 }));return removed||results.some(result=>result.status==='fulfilled'&&result.value);
}
