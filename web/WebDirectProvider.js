import {PlaybackProvider} from '../providers/PlaybackProvider.js';
import {directTrialKey} from '../providers/DirectTrialProvider.js';
import {qualitySource} from '../components/videoQuality.js';
import {playbackAllowed,trackUsage} from '../firebaseClient.js';
export class WebDirectProvider extends PlaybackProvider{
 constructor(){super({name:'MJ Player',supportsMovies:true,supportsTv:true,supportsProgress:true,playerType:'video'});}
 getMovieUrl(values){return this.source('movie',values);}
 getEpisodeUrl(values){return this.source('tv',values);}
 async source(type,values){
  if(!playbackAllowed('vod'))throw Error('Playback is temporarily paused for maintenance. Please try again later.');
  trackUsage('playback_requested',{content_type:type});
  const id=values.tmdbId||values.id;
  if(!/^\d+$/.test(String(id))||type==='tv'&&![values.season,values.episode].every(v=>Number.isSafeInteger(v)&&v>0))throw Error('Invalid title');
  const path=type+'/'+id+(type==='tv'?'/'+values.season+'/'+values.episode:'');
  const response=await fetch('/api/playback/'+path,{signal:AbortSignal.timeout(45000)});
  if(!response.ok){trackUsage('playback_failed',{content_type:type,error_code:response.status});throw Error('No browser-compatible stream is available for this episode or movie right now. Retry or try another server.');}
  const source=await response.json();
  if(source.url?.startsWith('/api/relay/')){source.url=new URL(source.url,location.origin).href;source.masterUrl=source.url;}
  if(source.browserToken){const host=new URL(source.url);const r=await fetch(host.origin+'/generate.php',{credentials:'omit',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Stream handshake unavailable');let token=await r.text();try{const j=JSON.parse(token);token=typeof j==='string'?j:j.token||j.data||j.string||j.result||'';}catch{}token=token.trim();if(!token||token.length>8192)throw Error('Stream handshake unavailable');source.url=source.url.includes('__TOKEN__')?source.url.replaceAll('__TOKEN__',token):source.url+(source.url.includes('?')?'&':'?')+'token='+encodeURIComponent(token);source.masterUrl=source.url;}
  if(source.browserToken){const token=new URL(source.url).searchParams.get('token');source.candidates=(source.candidates||[]).map(raw=>{if(new URL(raw).origin!==new URL(source.url).origin)return null;return raw.includes('__TOKEN__')?raw.replaceAll('__TOKEN__',token):raw+(raw.includes('?')?'&':'?')+'token='+encodeURIComponent(token);}).filter(Boolean);}
  const entry={...source,sourceProvider:'web-direct',expiresAt:Date.now()+600000};
  globalThis.__mjDirectTrialSources??={};globalThis.__mjDirectTrialSources[directTrialKey(type,values)]=entry;
  return {kind:'video',url:qualitySource(entry),streamType:source.streamType,candidates:source.candidates,label:'MJ Player',subtitles:source.subtitles||[],refresh:()=>this.source(type,values)};
 }
}
