import {EmbedProvider} from './EmbedProvider.js';

const origin='https://vidlink.pro';
export class VidLinkProvider extends EmbedProvider {
 constructor(){super({name:'VidLink',progressEvents:true,useSandbox:false,movieTemplate:origin+'/movie/{tmdbId}',episodeTemplate:origin+'/tv/{tmdbId}/{season}/{episode}'});}
 source(url){const target=new URL(url);target.searchParams.set('autoplay','true');target.searchParams.set('nextbutton','false');return super.source(target.href);}
 readProgress(event,frame,item,season,episode){
  if(event.origin!==origin||event.source!==frame.contentWindow)return null;
  let payload=event.data;
  if(typeof payload==='string'){if(payload.length>8192)return null;try{payload=JSON.parse(payload);}catch{return null;}}
  const data=payload?.data;
  if(payload?.type!=='PLAYER_EVENT'||!data||data.mediaType!==item.type)return null;
  // The published event schema spells the identifier "mtmdbId".
  if(String(data.mtmdbId)!==String(item.tmdbId??item.id))return null;
  if(item.type==='tv'&&(Number(data.season)!==season||Number(data.episode)!==episode))return null;
  if(!['play','pause','seeked','ended','timeupdate'].includes(data.event))return null;
  const position=data.currentTime,duration=data.duration;
  if(!Number.isFinite(position)||!Number.isFinite(duration)||position<0||duration<=0||duration>604800||position>duration+5)return null;
  return {value:{position:Math.min(position,duration),duration,completed:data.event==='ended'},season,episode};
 }
}
