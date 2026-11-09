import {PlaybackProvider} from './PlaybackProvider.js';
import {buildEmbedUrl} from './EmbedProvider.js';
const origin='https://vidfast.vc';
const events=new Set(['play','pause','seeked','ended','timeupdate','playerstatus']);
// Public contract: https://vidfast.vc/#docs (Endpoints, Events, PostMessage).
export class VidFastProvider extends PlaybackProvider{
 constructor(){super({name:'VidFast',playerType:'iframe',supportsMovies:true,supportsTv:true,supportsImdb:true,supportsTmdb:true,supportsIframe:true,supportsPlayPause:true,supportsSeek:true,supportsProgress:true,supportsRemoteControls:true});}
 async getMovieUrl(values){return this.source('movie',values);}
 async getEpisodeUrl(values){return this.source('tv',values);}
 source(type,values){
  const field=/^tt\d+$/.test(values.imdbId||'')?'imdbId':'tmdbId';
  const template=`${origin}/${type}/{${field}}${type==='tv'?'/{season}/{episode}':''}`;
  const url=new URL(buildEmbedUrl(template,values));url.searchParams.set('autoPlay','true');
  if(values.startAt!==undefined){if(!Number.isFinite(values.startAt)||values.startAt<0||values.startAt>604800)throw new Error('Invalid resume time');url.searchParams.set('startAt',String(Math.floor(values.startAt)));}
  if(type==='tv'){url.searchParams.set('autoNext','false');url.searchParams.set('nextButton','false');}
  // Physical TV returned "please disable sandbox" with the restricted sandbox.
  // Omit it for this provider only; command/event origin checks remain enforced.
  return {kind:'iframe',playerType:'iframe',url:url.href,label:'VidFast',useSandbox:false,sandbox:null,autoNext:false,content:{type,tmdbId:values.tmdbId??values.id,season:values.season,episode:values.episode}};
 }
 createControls({media,source,win=window}){
  const listeners=new Set();let disposed=false,state={currentTime:null,duration:null,playing:null};
  const send=(command,extra={})=>{if(disposed)return false;media.contentWindow?.postMessage({command,...extra},origin);return true;};
  const receive=event=>{
   if(disposed||event.origin!==origin||event.source!==media.contentWindow)return;
   const payload=event.data;if(payload?.type!=='PLAYER_EVENT')return;
   const data=payload.data,content=source.content;
   if(!data||!events.has(data.event)||data.mediaType!==content.type||String(data.tmdbId)!==String(content.tmdbId))return;
   if(content.type==='tv'&&(Number(data.season)!==content.season||Number(data.episode)!==content.episode))return;
   if(!Number.isFinite(data.currentTime)||!Number.isFinite(data.duration)||data.duration<=0||data.duration>604800||data.currentTime<0||data.currentTime>data.duration+5)return;
   if(data.playing!==undefined&&typeof data.playing!=='boolean')return;
   const playing=data.event==='play'?true:['pause','ended'].includes(data.event)?false:typeof data.playing==='boolean'?data.playing:state.playing;
   state={currentTime:Math.min(data.currentTime,data.duration),duration:data.duration,playing};
   for(const listener of listeners)listener({...state,event:data.event,completed:data.event==='ended'});
  };
  win.addEventListener('message',receive);
  const controls={
   play:()=>send('play'),pause:()=>send('pause'),requestStatus:()=>send('getStatus'),
   getCurrentTime:()=>state.currentTime,getDuration:()=>state.duration,isPlaying:()=>state.playing,
   seekTo(seconds){if(!Number.isFinite(seconds))return false;if(state.currentTime===null||state.duration===null){send('getStatus');return false;}return send('seek',{time:Math.min(Math.floor(state.duration),Math.max(0,Math.floor(seconds)))});},
   seekBy(seconds){if(!Number.isFinite(seconds))return false;if(state.currentTime===null){send('getStatus');return false;}return controls.seekTo(state.currentTime+seconds);},
   subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
   dispose(){disposed=true;listeners.clear();win.removeEventListener('message',receive);}
  };
  return controls;
 }
}
