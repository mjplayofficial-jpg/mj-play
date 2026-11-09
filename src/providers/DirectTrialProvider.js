import {qualitySource} from '../components/videoQuality.js';
import {PlaybackProvider} from './PlaybackProvider.js';
export function directTrialKey(type,values){
 const id=values.imdbId||values.tmdbId||values.id;
 if(!/^tt\d+$/.test(String(id))&&!/^[1-9]\d*$/.test(String(id)))throw Error('Invalid title identifier');
 if(type==='movie')return `movie:${id}`;
 if(type!=='tv'||![values.season,values.episode].every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid episode');
 return `tv:${id}:${values.season}:${values.episode}`;
}
export class DirectTrialProvider extends PlaybackProvider{
 constructor({name='Direct · Experimental',sourceProvider='primary'}={}){super({name,supportsMovies:true,supportsTv:true,supportsProgress:true,playerType:'video'});this.sourceProvider=sourceProvider;}
 async getMovieUrl(values){return this.source('movie',values);}
 async getEpisodeUrl(values){return this.source('tv',values);}
 source(type,values){
  const entry=globalThis.__mjDirectTrialSources?.[directTrialKey(type,values)];
  if(!entry||(entry.sourceProvider||'primary')!==this.sourceProvider||!Number.isFinite(entry.expiresAt)||entry.expiresAt<=Date.now())throw Error('No captured stream for this title. Play it on VidSrc first, then capture its stream for this experimental server.');
  const url=new URL(qualitySource(entry));
  if(url.protocol!=='https:'||url.username||url.password)throw Error('Invalid direct stream');
  return {kind:'video',url:url.href,label:this.capabilities.name};
 }
}
