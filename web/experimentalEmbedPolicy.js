import {experimentalEmbedEnabled} from './experimentalEmbedConfig.js';
const key='mj.web.experimental.transport';
export function experimentalTransport(storage=globalThis.localStorage,enabled=experimentalEmbedEnabled){if(!enabled)return 'direct';try{return storage.getItem(key)==='direct'?'direct':'cinesrc';}catch{return 'cinesrc';}}
export function setExperimentalTransport(value,storage=globalThis.localStorage,enabled=experimentalEmbedEnabled){if(!enabled||!['direct','cinesrc'].includes(value))return false;try{storage.setItem(key,value);return true;}catch{return false;}}
export function embedIdentity(item,season,episode){const id=Number(item?.tmdbId??item?.id);if(!Number.isSafeInteger(id)||id<1||!['movie','tv'].includes(item?.type))throw Error('This title has no valid TMDB identity.');if(item.type==='tv'&&(!Number.isSafeInteger(season)||season<1||!Number.isSafeInteger(episode)||episode<1))throw Error('Choose a valid episode.');return {id,type:item.type,season:item.type==='tv'?season:null,episode:item.type==='tv'?episode:null};}
export function matchesEmbedMessage(event,frameWindow,identity){if(event.source!==frameWindow||event.origin!=='https://cinesrc.st'||!event.data||typeof event.data!=='object')return false;const d=event.data;if(typeof d.type!=='string'||!d.type.startsWith('cinesrc:'))return false;if(d.tmdbId!=null&&String(d.tmdbId)!==String(identity.id))return false;if(d.mediaType!=null&&d.mediaType!==identity.type)return false;if(identity.type==='tv'&&((d.season!=null&&Number(d.season)!==identity.season)||(d.episode!=null&&Number(d.episode)!==identity.episode)))return false;return true;}
export function normalizeEmbedMessage(data){const d={...data};if(d.type==='cinesrc:response'){const key={getCurrentTime:'currentTime',getDuration:'duration',getPaused:'paused',getMuted:'muted'}[d.command];if(key&&(['paused','muted'].includes(key)?typeof d.result==='boolean':Number.isFinite(d.result)))d[key]=d.result;}if(d.type==='cinesrc:play'){d.type='vidrift:unpaused';d.paused=false;}else if(d.type==='cinesrc:pause'){d.type='vidrift:paused';d.paused=true;}else if(d.type==='cinesrc:ended')d.type='vidrift:ended';else d.type='vidrift:progress';return d;}
export function validEmbedProgress(state){return Number.isFinite(state.currentTime)&&Number.isFinite(state.duration)&&state.currentTime>=0&&state.duration>0&&state.duration<=604800&&state.currentTime<=state.duration+.5;}
// Apply only after origin/window/identity validation. No second progress tick required.
export function embedPlaybackStarted(event,state){return event.type==='vidrift:unpaused'||(['vidrift:state','vidrift:progress'].includes(event.type)&&state.paused===false&&validEmbedProgress(state));}
export function embedUrl(identity){const url=new URL('https://cinesrc.st/embed/'+identity.type+'/'+identity.id);if(identity.type==='tv'){url.searchParams.set('s',identity.season);url.searchParams.set('e',identity.episode);}url.searchParams.set('controls','false');url.searchParams.set('autoplay','true');url.searchParams.set('muted','true');url.searchParams.set('autonext','false');url.searchParams.set('continueprompt','false');return url.href;}
export function experimentalPlaybackPreferences(){if(!experimentalEmbedEnabled)return '';return '<label class="web-default-quality">Experimental web playback<select data-experimental-transport aria-label="Experimental web playback"><option value="direct"'+(experimentalTransport()==='direct'?' selected':'')+'>MJ direct player</option><option value="cinesrc"'+(experimentalTransport()==='cinesrc'?' selected':'')+'>CineSrc with MJ controls · Experimental</option></select></label><p>Applies to your next movie or episode. Provider availability and advertisements may vary.</p>';}

export function activationFailure(data){
 if(data?.reason!=='click-required')return null;
 const command=String(data.command||'').replace(/^vidrift:/,'');
 if(command==='play')return 'play';
 if(command==='set'&&['muted','volume'].includes(data.field))return 'sound';
 return 'other';
}

export function embedNearEnd(value){return validEmbedProgress(value)&&value.duration>30&&value.duration-value.currentTime<=15;}
