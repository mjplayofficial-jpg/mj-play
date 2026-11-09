import { DemoProvider } from '../providers/DemoProvider.js';
import {DirectTrialProvider} from '../providers/DirectTrialProvider.js';
import { EmbedProvider } from '../providers/EmbedProvider.js';
import {providerOptions} from './testProviders.js';
// Only documented, authorized templates belong here. No executable configuration.
export const playbackConfig = {provider:'primary',providers:{embed:{name:'Configured player',movieTemplate:'',episodeTemplate:''},primary:{name:'VidSrc',playerType:'iframe',useSandbox:false,progressEvents:true,autoNext:true,autoplay:'1',movieTemplate:'https://vidsrc.sh/embed/movie/{imdbId}',episodeTemplate:'https://vidsrc.sh/embed/tv/{imdbId}/{season}/{episode}'}}};
export function createPlaybackProvider(config=playbackConfig){
  if(config.provider==='vsembed')return new DirectTrialProvider({name:'VSEmbed',sourceProvider:'vsembed-embed'});
  if(config.provider==='vsembed-embed')return new EmbedProvider({name:'VSEmbed',useSandbox:false,progressEvents:true,autoNext:false,autoplay:'1',movieTemplate:'https://vsembed.ru/embed/movie/{imdbId}',episodeTemplate:'https://vsembed.ru/embed/tv/{imdbId}/{season}/{episode}'});
  if(config.provider==='direct-trial')return new DirectTrialProvider();
  if(config.provider==='demo')return new DemoProvider();
  if(config.provider==='primary')return new EmbedProvider(config.providers?.primary||{});
  if(config.provider==='embed'){const embed=config.providers?.embed||{};return embed.movieTemplate||embed.episodeTemplate?new EmbedProvider(embed):new DemoProvider();}
  throw new Error('Unknown playback provider');
}
const selectionKey='mjplay.provider.v1';
export function selectedPlaybackProvider(){try{const value=globalThis.localStorage?.getItem(selectionKey);return providerOptions.some(([id])=>id===value)?value:value?'direct-trial':playbackConfig.provider;}catch{return playbackConfig.provider;}}
export let playbackProvider = createPlaybackProvider({...playbackConfig,provider:selectedPlaybackProvider()});
export function selectPlaybackProvider(value){if(!providerOptions.some(([id])=>id===value))throw new Error('Unknown playback provider');const provider=createPlaybackProvider({...playbackConfig,provider:value});
 try{globalThis.localStorage?.setItem(selectionKey,value);}catch{throw new Error('Could not save provider selection');}
 playbackProvider=provider;
}
export function initializeDirectDefault(){
 try{if(globalThis.localStorage?.getItem('mjplay.direct-default.v1')!=='1'){selectPlaybackProvider('direct-trial');globalThis.localStorage?.setItem('mjplay.direct-default.v1','1');}}catch{}
}





export const isDirectPlaybackProvider=(id=selectedPlaybackProvider())=>['direct-trial','vsembed'].includes(id);
export const directEmbedProvider=(id=selectedPlaybackProvider())=>id==='vsembed'?'vsembed-embed':'primary';
