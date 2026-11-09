import {playbackState} from './progressState.js';
export function readProgressEvent(event,frame,origin,item,season,episode){
 if(event.source!==frame.contentWindow||event.origin!==origin)return null;
 let payload=event.data;
 if(typeof payload==='string'){if(payload.length>8192)return null;try{payload=JSON.parse(payload);}catch{return null;}}
 if(payload?.type!=='PLAYER_EVENT')return null;
 const data=payload.data,info=data?.player_info;
 if(!info||info.mediaType!==item.type)return null;
 const imdb=info.imdb,tmdb=info.tmdb;
 if(!imdb&&!tmdb)return null;
 if(imdb&&imdb!==item.imdbId)return null;
 if(tmdb&&String(tmdb)!==String(item.tmdbId??item.id))return null;
 if(item.type==='tv'&&(Number(info.season)!==season||Number(info.episode)!==episode))return null;
 if(!['playing','paused','seeked','completed'].includes(data.player_status))return null;
 const position=data.player_progress,duration=data.player_duration;
 if(!Number.isFinite(position)||!Number.isFinite(duration)||position<0||duration<=0||duration>604800||position>duration+5)return null;
 return {position:Math.min(position,duration),duration,completed:data.player_status==='completed'};
}
export function resumable(progress){return playbackState(progress).resumable;}
// Automatic transitions must still match the same provider frame, origin and series.
export function readEpisodeProgressEvent(event,frame,origin,item,season,episode,autoNext=false){
 if(!autoNext||item.type!=='tv'){const value=readProgressEvent(event,frame,origin,item,season,episode);return value?{value,season,episode}:null;}
 if(event.source!==frame.contentWindow||event.origin!==origin)return null;
 let payload=event.data;if(typeof payload==='string'){if(payload.length>8192)return null;try{payload=JSON.parse(payload);}catch{return null;}}
 const info=payload?.data?.player_info;
 const nextSeason=Number(info?.season),nextEpisode=Number(info?.episode);
 if(!Number.isSafeInteger(nextSeason)||nextSeason<1||!Number.isSafeInteger(nextEpisode)||nextEpisode<1)return null;
 const value=readProgressEvent({...event,source:event.source,origin:event.origin,data:payload},frame,origin,item,nextSeason,nextEpisode);
 return value?{value,season:nextSeason,episode:nextEpisode}:null;
}
export function timeLabel(seconds){const total=Math.floor(seconds),hours=Math.floor(total/3600),minutes=Math.floor(total/60)%60;return hours?`${hours}:${String(minutes).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`:`${minutes}:${String(total%60).padStart(2,'0')}`;}
