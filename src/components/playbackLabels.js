import {playbackProvider} from '../config/playback.js';
export function playLabel(type,provider=playbackProvider){return provider.capabilities.isDemo?'Play Demo':type==='tv'?'Play Episode':'Play';}
export function playbackNote(provider=playbackProvider){return provider.capabilities.isDemo?'Demo source: Big Buck Bunny. Catalogue titles are metadata only.':'';}
