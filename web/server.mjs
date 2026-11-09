import {createBandwidthBudget} from './bandwidthBudget.mjs';
import {createTVLiveAccess} from './tvLiveAccess.mjs';
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {publicMediaSource} from './mediaSources.mjs';
import {resolveWebMovie} from './sourceResolver.mjs';
import {createLocalRelay} from './localRelay.mjs';
import {createRelayResolver} from './relayResolver.mjs';
import {createSubtitleService} from './subtitleService.mjs';
import {createLiveRelay} from './liveRelay.mjs';
import {createSportsCatalogue} from './sportsCatalogue.mjs';
import {previewAccess} from './previewAccess.mjs';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const publicRoot=path.resolve(process.env.MJ_WEB_STAGING==='1'?'web/staging-public':'web/public'),config={window:{}};
try{vm.runInNewContext(await readFile('src/config/config.local.js','utf8'),config,{timeout:1000});}catch{}
const credentials=config.window.MJ_CONFIG||{},token=process.env.TMDB_READ_TOKEN||credentials.tmdbReadToken,key=process.env.TMDB_API_KEY||credentials.tmdbApiKey;
const cache=new Map(),visitors=new Map();
const relay=createLocalRelay();
const liveRelays=new Map();
const liveService=channel=>{let service=liveRelays.get(channel);if(!service){if(liveRelays.size>=12)liveRelays.delete(liveRelays.keys().next().value);service=createLiveRelay(channel);liveRelays.set(channel,service);}return service;};
const tvLiveAccess=createTVLiveAccess({secret:process.env.MJ_PREVIEW_PASSWORD,origin:process.env.RENDER_EXTERNAL_URL||process.env.MJ_PUBLIC_ORIGIN||'http://127.0.0.1:8083',service:liveService});
const resolveRelay=createRelayResolver();
let subtitleConfig={};try{subtitleConfig=JSON.parse(await readFile('web/subtitles.local.json','utf8'));}catch{}
const subtitles=createSubtitleService({key:process.env.MJ_SUBTITLE_KEY||subtitleConfig.key,token:process.env.MJ_SUBTITLE_TOKEN});
const subtitleVisitors=new Map();
const sportsContext={window:{}};try{vm.runInNewContext(await readFile('src/config/sportsCipher.local.js','utf8'),sportsContext,{timeout:1000});}catch{}
const sportsCatalogue=createSportsCatalogue({key:process.env.MJ_SPORTS_CIPHER_KEY||sportsContext.window.MJ_SPORTS_CIPHER_KEY});
const allowed=/^(?:trending\/(?:movie|tv)\/week|(?:movie|tv)\/(?:popular|top_rated|now_playing|on_the_air)|search\/(?:multi|movie|tv|person|keyword|company)|discover\/(?:movie|tv)|person\/\d+(?:\/(?:combined_credits|movie_credits|tv_credits))?|collection\/\d+)$/;
const validPath=p=>allowed.test(p)||/^(movie|tv)\/\d+(?:\/(credits|external_ids|videos|recommendations|similar|season\/\d+(?:\/episode\/\d+)?))?$/.test(p);
const types={'.ico':'image/x-icon','.webmanifest':'application/manifest+json; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp'};
const bandwidth=process.env.MJ_BANDWIDTH_FILE?createBandwidthBudget({file:process.env.MJ_BANDWIDTH_FILE,admission:Number(process.env.MJ_BANDWIDTH_ADMISSION_BYTES)||7e12,limit:Number(process.env.MJ_BANDWIDTH_CUTOFF_BYTES)||8e12}):null;
export const server=http.createServer(async(req,res)=>{
 if(bandwidth){if(!bandwidth.allow(req,res))return;bandwidth.meter(req,res);}
 if(req.url==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain','Cache-Control':'no-store'}).end('ok');return;}
 if(new URL(req.url,'http://localhost').pathname.startsWith('/api/tv-live/')){return tvLiveAccess.serve(req,res);}
 if(new URL(req.url,'http://localhost').pathname==='/download/time.json'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}).end(JSON.stringify({now:Date.now()}));return;}
 if(!previewAccess(req,res))return;
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 const json=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(value));};
 try{
 if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'Method not allowed'});
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/tv-live-session'){try{return json(200,tvLiveAccess.issue());}catch{return json(503,{error:'TV access unavailable'});}}
 if(url.pathname==='/api/admin/bandwidth'){if(!req.mjPreviewAuthorized)return json(403,{error:'Forbidden'});return json(200,bandwidth?.status()||{enabled:false});}
 if(url.pathname==='/api/config')return json(200,{catalogue:!!(token||key)});
 if(url.pathname==='/api/sports'){try{return json(200,await sportsCatalogue(url.searchParams.get('category')||'Match'));}catch{return json(502,{error:'Sports could not load. Please retry.'});}}
 if(url.pathname.startsWith('/api/live/')){const live=url.pathname.match(/^\/api\/live\/([1-9]\d{0,5})(\/media\/[a-f0-9]{48})?$/);if(!live)return json(404,{error:'Unknown live request'});const channel=Number(live[1]);let service=liveRelays.get(channel);if(!service){if(liveRelays.size>=12)liveRelays.delete(liveRelays.keys().next().value);service=createLiveRelay(channel);liveRelays.set(channel,service);}return service.serve(req,res,live[2]||'');}
 if(url.pathname.startsWith('/api/subtitles/')){
 const match=url.pathname.match(/^\/api\/subtitles\/(movie|tv)\/(\d{1,10})(?:\/(\d+)\/(\d+))?$/);
 if(!match||match[1]==='movie'&&match[3])return json(400,{error:'Invalid subtitle title.'});
 const ip=req.socket.remoteAddress,now=Date.now();let bucket=subtitleVisitors.get(ip);if(!bucket||bucket.until<now){if(subtitleVisitors.size>1000)subtitleVisitors.clear();subtitleVisitors.set(ip,bucket={count:0,until:now+60000});}if(++bucket.count>10)return json(429,{error:'Please wait before requesting more subtitles.'});
 try{return json(200,await subtitles(match[1],match[2],Number(match[3]),Number(match[4]),{duration:Number(url.searchParams.get('duration')),alternate:url.searchParams.get('alternate')==='1'}));}catch(e){return json(502,{error:e.name==='AbortError'?'Subtitle request timed out.':String(e.message).slice(0,180)});}
 }
 if(url.pathname.startsWith('/api/relay/')){if(process.env.MJ_RELAY_TRIAL!=='1')return json(404,{error:'Not found'});return await relay.serve(req,res,url.pathname.slice('/api/relay/'.length));}
 if(url.pathname.startsWith('/api/playback/')){
 const match=url.pathname.match(/^\/api\/playback\/(movie|tv)\/(\d+)(?:\/(\d+)\/(\d+))?$/);
 if(!match||match[1]==='tv'&&(!match[3]||!match[4])||match[1]==='movie'&&match[3])return json(404,{error:'Unknown title'});
 if(process.env.MJ_RELAY_TRIAL==='1'){try{const source=await resolveRelay(match[1],match[2],Number(match[3]),Number(match[4]));return json(200,{url:await relay.prepare(source),streamType:'hls',adaptive:true,subtitles:[]});}catch{return json(502,{error:'Direct source temporarily unavailable. Retry or choose another server.'});}}
 let sources={};try{sources=JSON.parse(await readFile('web/media.local.json','utf8'));}catch{}
 const key=match[1]+':'+match[2]+(match[1]==='tv'?':'+match[3]+':'+match[4]:'');
 const source=publicMediaSource(sources[key]);if(source)return json(200,source);
 if(match[1]==='movie'&&(token||credentials.tmdbApiKey)){
 const metadataUrl=new URL('https://api.themoviedb.org/3/movie/'+match[2]);if(!token)metadataUrl.searchParams.set('api_key',credentials.tmdbApiKey);
 const metadata=await fetch(metadataUrl,{headers:token?{Authorization:'Bearer '+token}:{},signal:AbortSignal.timeout(10000)});if(!metadata.ok)return json(404,{error:'Title unavailable'});
 const item=await metadata.json();try{return json(200,await resolveWebMovie(item.imdb_id));}catch{return json(502,{error:'Direct source temporarily unavailable'});}
 }
 return json(404,{error:'Direct stream not connected'});
 }
 if(url.pathname.startsWith('/api/catalogue/')){
 const ip=req.socket.remoteAddress,now=Date.now();let bucket=visitors.get(ip);if(!bucket||bucket.until<now){if(visitors.size>10000)visitors.clear();visitors.set(ip,bucket={count:0,until:now+60000});}if(++bucket.count>180)return json(429,{error:'Please try again shortly'});
 const route=url.pathname.slice('/api/catalogue/'.length);if(!validPath(route))return json(404,{error:'Unknown catalogue request'});if(!token&&!key)return json(503,{error:'Catalogue not configured'});
 const upstream=new URL('https://api.themoviedb.org/3/'+route);for(const [k,v]of url.searchParams){if(k==='api_key'||k==='access_token')continue;if(v.length>300)return json(400,{error:'Invalid query'});upstream.searchParams.set(k,v);}if(key&&!token)upstream.searchParams.set('api_key',key);
 const cacheKey=upstream.pathname+url.search;const cached=cache.get(cacheKey);if(cached?.until>now)return json(200,cached.data);
 const r=await fetch(upstream,{headers:token?{Authorization:'Bearer '+token}:{},signal:AbortSignal.timeout(12000)});if(!r.ok)return json(r.status===404?404:502,{error:'Catalogue temporarily unavailable'});const data=await r.json();if(cache.size>=500)cache.delete(cache.keys().next().value);cache.set(cacheKey,{data,until:now+300000});return json(200,data);
 }
 let name=decodeURIComponent(url.pathname);if(name==='/' )name='/index.html';if(name==='/download'||name==='/download/')name='/download/index.html';if(name.includes('\0')||name.split('/').some(p=>p.startsWith('.'))||name.endsWith('.map')||name.endsWith('.local.js'))return json(404,{error:'Not found'});
 const file=path.resolve(publicRoot,'.'+name);if(!file.startsWith(publicRoot+path.sep))return json(404,{error:'Not found'});
 if(name.endsWith('.apk')){
 const info=await stat(file);res.writeHead(200,{'Content-Type':'application/vnd.android.package-archive','Content-Length':info.size,'Content-Disposition':'attachment; filename="'+path.basename(name)+'"','Cache-Control':'public, max-age=86400'});
 if(req.method==='HEAD')res.end();else try{await pipeline(createReadStream(file),res);}catch{res.destroy();}return;
 }
 const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:body);
 }catch{return json(502,{error:'Request unavailable'});}
});
server.listen(Number(process.env.PORT)||8081,process.env.HOST||'127.0.0.1',()=>console.log('MJ Play web: http://localhost:'+(Number(process.env.PORT)||8081)));
