import {PlaybackProvider} from './PlaybackProvider.js';
const allowedFields=['imdbId','tmdbId','season','episode','episode2d'];
export function buildEmbedUrl(template,values={}) {
  if(typeof template!=='string'||!template.trim())throw new Error('Playback provider not configured');
  const urlText=template.replace(/\{([^{}]+)\}/g,(_,field)=>{
    if(!allowedFields.includes(field))throw new Error('Unsupported provider field');
    const value=values[field==='episode2d'?'episode':field];
    if(field==='imdbId'){if(typeof value!=='string'||!/^tt\d+$/.test(value))throw new Error('Missing or invalid IMDb ID');}
    else if(!/^\d+$/.test(String(value))||!Number.isSafeInteger(Number(value))||Number(value)<1)throw new Error('Missing or invalid content identifier');
    return encodeURIComponent(field==='episode2d'?String(value).padStart(2,'0'):String(value));
  });
  if(/[{}]/.test(urlText))throw new Error('Malformed provider template');
  const url=new URL(urlText);
  if(url.protocol!=='https:'||url.username||url.password)throw new Error('Provider must use HTTPS without embedded credentials');
  const authority=template.match(/^https:\/\/([^/?#]+)/i)?.[1];
  if(!authority||/[{}]/.test(authority))throw new Error('Provider host must be fixed');
  if(url.hash)throw new Error('Provider template fragments are unsupported');
  return url.href;
}
export class EmbedProvider extends PlaybackProvider {
  constructor(config={}) {
    const templates=(config.movieTemplate||'')+(config.episodeTemplate||'');
    super({name:config.name||'Configured player',supportsMovies:Boolean(config.movieTemplate),supportsTv:Boolean(config.episodeTemplate),supportsImdb:templates.includes('{imdbId}'),supportsTmdb:templates.includes('{tmdbId}'),supportsIframe:true,playerType:'iframe',supportsProgress:config.progressEvents===true});
    if(config.useSandbox!==undefined&&typeof config.useSandbox!=='boolean')throw new Error('useSandbox must be boolean');
    if(config.iframeSandbox!==undefined&&config.iframeSandbox!==null&&typeof config.iframeSandbox!=='string')throw new Error('Invalid iframe sandbox configuration');
    const useSandbox=config.useSandbox??config.iframeSandbox!==null;
    this.config={...config,useSandbox,iframeSandbox:useSandbox?(config.iframeSandbox??'allow-scripts allow-same-origin allow-forms allow-presentation'):null};
  }
  async getMovieUrl(values){return this.source(this.resumeUrl(buildEmbedUrl(this.config.movieTemplate,values),values.startAt));}
  async getEpisodeUrl(values){let url=this.resumeUrl(buildEmbedUrl(this.config.episodeTemplate,values),values.startAt);const autoNext=this.config.autoNext===true;if(autoNext){const target=new URL(url);target.searchParams.set('autonext','1');url=target.href;}return {...this.source(url),autoNext};}
  resumeUrl(url,startAt){if(!this.capabilities.supportsProgress||startAt===undefined)return url;if(!Number.isFinite(startAt)||startAt<0||startAt>604800)throw new Error('Invalid resume time');const target=new URL(url);target.searchParams.set('startAt',String(Math.floor(startAt)));return target.href;}
  source(url){if(this.config.autoplay){const target=new URL(url);target.searchParams.set('autoplay',this.config.autoplay);url=target.href;}return {kind:'iframe',playerType:'iframe',url,label:this.capabilities.name,useSandbox:this.config.useSandbox,sandbox:this.config.iframeSandbox};}
}

