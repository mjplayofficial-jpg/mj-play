import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const staging=process.env.MJ_WEB_STAGING==='1';
const splitLive=staging&&process.env.MJ_SPLIT_LIVE==='1';
const catalogueOrigin=staging&&process.env.MJ_WEB_CLOUD_STAGING==='1'
 ? 'https://mjplay-catalogue.jmssika1997.workers.dev'
 : '';
const root=path.resolve(splitLive?'research/split-live/full-public':staging?'web/staging-public':'web/public');
if(![path.resolve('web','public'),path.resolve('web','staging-public'),path.resolve('research/split-live/full-public')].includes(root))throw Error('Invalid build directory');
await rm(root,{recursive:true,force:true});await mkdir(root,{recursive:true});
for(const dir of ['src','styles','assets'])await cp(dir,path.join(root,dir),{recursive:true,filter:source=>!source.endsWith('.local.js')&&!source.includes(path.join('assets','profiles'))&&!source.includes(path.join('assets','brand-kit'))});
const edit=async(file,change)=>{const p=path.join(root,file);await writeFile(p,change(await readFile(p,'utf8')));};
await cp('web/WebRouter.js',path.join(root,'src/WebRouter.js'));
await edit('src/WebRouter.js',s=>s.replace("from '../src/router.js'","from './router.js'"));
await edit('src/app.js',s=>s.replace("from './router.js'","from './WebRouter.js'"));
await writeFile(path.join(root,'index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="MJ Play"><meta name="apple-mobile-web-app-status-bar-style" content="black"><link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/app-180.png"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#080b18"><title>MJ Play — Watch & discover</title><meta property="og:title" content="MJ Play"><meta property="og:image" content="https://mjplay-private-trial.onrender.com/assets/logo/og-image.png"><link rel="icon" href="/assets/icons/favicon.ico"><link rel="stylesheet" href="styles/main.css"><link rel="stylesheet" href="styles/system.css"><link rel="stylesheet" href="styles/web.css"></head><body><div id="app"><div class="mj-brand-loading" role="status" aria-label="Loading MJ Play"><img src="assets/logo/header-official.png" alt="MJ Play"><div class="mj-brand-progress" aria-hidden="true"></div><p>Your world. Press play.</p></div></div><script type="module" src="src/bootstrap.js"></script></body></html>');
await cp('web/mobileNavigation.js',path.join(root,'src/mobileNavigation.js'));
await cp('web/firebaseClient.js',path.join(root,'src/firebaseClient.js'));
await cp('web/firebasePolicy.js',path.join(root,'src/firebasePolicy.js'));
await cp('web/firebaseConfig.json',path.join(root,'src/firebaseConfig.json'));
await cp('web/mobileDetails.js',path.join(root,'src/mobileDetails.js'));
await writeFile(path.join(root,'src/bootstrap.js'),`import {initializeProtectedStorage} from './storage/protectedStorage.js';
import {mountMobileDetails} from './mobileDetails.js';
import {mountMobileNavigation} from './mobileNavigation.js';
import {initializePublicFirebase} from './firebaseClient.js';
import firebaseConfig from './firebaseConfig.json';
mountMobileDetails();mountMobileNavigation();
void initializePublicFirebase(firebaseConfig);
const response=await fetch('${catalogueOrigin}/api/config');const config=await response.json();window.MJ_CONFIG={catalogueProxy:true,catalogueOrigin:'${catalogueOrigin}',demo:!config.catalogue,language:'en-US'};
initializeProtectedStorage().finally(()=>import('./app.js'));
`);
await writeFile(path.join(root,'src/storage/profiles.js'),`export const profiles=()=>[{id:'visitor',name:'you'}];export const activeProfile=()=>profiles()[0];export const initializeProfiles=()=>{};export const selectProfile=()=>{};export const renameProfile=()=>{};`);
await edit('src/services/tmdb.js',s=>s.replace('this.demo=!config.tmdbApiKey&&!config.tmdbReadToken','this.demo=config.catalogueProxy?config.demo:!config.tmdbApiKey&&!config.tmdbReadToken').replace("fetch('https://api.themoviedb.org/3/'+path+'?'+query", "fetch((this.config.catalogueProxy?(this.config.catalogueOrigin||'')+'/api/catalogue/':'https://api.themoviedb.org/3/')+path+'?'+query"));
await edit('src/services/sports.js',s=>s.slice(0,s.indexOf('export async function loadSports'))+`export async function loadSports(category='Match',{signal}={}){const r=await fetch('/api/sports?'+new URLSearchParams({category}),{signal});if(!r.ok)throw Error('Sports could not load. Please retry.');return r.json();}`);
await edit('src/app.js',s=>s.replace('const stopCloudBackup=startCloudBackup()','const stopCloudBackup=()=>{}').replace('companionClient.start();','/* Web has no TV relay. */').replace("router.go('/profiles',{initialFocus:'profile-me'},true)","router.go('/',{},true)"));
await edit('src/app.js',s=>s.split('\n').filter(line=>!line.startsWith('companionClient=new ')&&!line.startsWith('companionUI=createCompanionUI')&&!line.includes("()=>companionClient.stop()")&&!line.includes("event.persisted)companionClient.start()")).join('\n'));
await edit('src/app.js',s=>s.replace('<span>↑ ↓ ← → Navigate &nbsp; OK Select &nbsp; BACK Return</span>','<span>Browse. Discover. Enjoy.</span>'));
await edit('src/components/Header.js',s=>s.slice(0,s.indexOf("export function header"))+s.slice(s.indexOf('export function header')).replace(/\+'<button class="profile-switch"[\s\S]*?\+'<\/header>';/,"+'</header>';"));
// Keep the web navigation free of household controls even if header markup evolves.
await edit('src/components/Header.js',s=>s.replace(",['/settings','Settings']",''));
await edit('src/components/Header.js',s=>s.replace('<div class="brand">','<a class="brand" href="#/" data-route="/" aria-label="MJ Play home">').replace('</div><nav','</a><nav'));
await edit('src/components/Header.js',s=>s.replace(/\+\x27<\/nav><button class="profile-switch"[\s\S]*$/, "+'</nav></header>';}"));
await writeFile(path.join(root,'src/pages/ProfilesPage.js'),`export const ProfilesPage=()=>'<section><h1>MJ Play</h1><a href="/">Home</a></section>';`);
await edit('src/pages/SearchPage.js',s=>s.replace('data-focus="search-input" data-search-edit','hidden data-search-edit').replace('<input hidden data-search-editor','<input data-focus="search-input" data-search-editor').replace(/input.onblur=\(\)=>\{input.hidden=true;box.hidden=false;box.textContent=input.value.trim\(\)\|\|'Movies, shows and actors';\};/,"input.onblur=()=>{};").replace('Select the search field and press OK to use your TV keyboard.','Search movies, shows and actors.'));
await edit('src/pages/DetailsPage.js',s=>s.replaceAll('on this TV','in this browser'));
await edit('src/pages/LiveTVPage.js',s=>s.replace("state.liveCategory||'favourites'","state.liveCategory||'popular'"));
await edit('src/app.js',s=>s.replace("state.initialFocus='live-filter-favourites'","state.initialFocus='live-filter-popular'"));
await edit('src/pages/SportsPage.js',s=>s.replace('data-sports-event="${event.id}"','data-sports-event="${event.id}" data-web-starts="${event.starts}"'));
await edit('src/pages/SportsPage.js',s=>s.replace('Could not load sports. Select Refresh to try again.','Could not load sports. Please retry.').replace('Your other sections are still available.</p>','Please try again.</p><button data-sports-refresh>Retry</button>'));
await edit('src/pages/SportsPage.js',s=>s.replaceAll('This event has no TV-compatible stream available','No playable web stream is currently available for this event').replaceAll('TV-compatible','web-compatible'));
await edit('src/services/englishSubtitles.js',s=>s.replace('OpenSubtitles API key is not configured on this TV.','This stream has no included English subtitles. External subtitle lookup is not connected yet.'));
await edit('src/services/englishSubtitles.js',s=>s.slice(0,s.indexOf('export async function fetchEnglishSubtitle'))+`export async function fetchEnglishSubtitle(item,season,episode,{signal,alternate=false,duration}={}){
const path=item.type+'/'+(item.tmdbId??item.id)+(item.type==='tv'?'/'+season+'/'+episode:'');
const query=new URLSearchParams({duration:String(duration),alternate:alternate?'1':'0'});
const response=await fetch('/api/subtitles/'+path+'?'+query,{signal});const result=await response.json();if(!response.ok)throw Error(result.error||'English subtitles unavailable.');return result;
}`);
await writeFile(path.join(root,'src/pages/SettingsPage.js'),`import {providerOptions} from '../config/testProviders.js';import {selectedPlaybackProvider} from '../config/playback.js';
export function SettingsPage(){return '<section class="search-page"><p class="eyebrow">MJ PLAY</p><h1>Settings</h1><h2>Preferred player</h2><div class="actions" data-focus-row>'+providerOptions.map(([id,label])=>'<button data-focus="provider-'+id+'" data-provider="'+id+'" aria-pressed="'+(selectedPlaybackProvider()===id)+'">'+label+'</button>').join('')+'</div><p>Your favourites and viewing progress are saved in this browser. Clearing browser data removes them.</p></section>';}export const mountSettings=()=>()=>{};`);
await edit('src/pages/SettingsPage.js',s=>s.replace('<h2>Preferred player</h2>','<h2>Our player</h2><p>Try MJ Play controls with a clearly labelled sample video.</p><button data-focus="web-player-test" data-web-player-test>Test MJ Player</button><h2>Preferred player</h2>'));
await edit('src/app.js',s=>s.replace("if(el.dataset.profile){","if(el.hasAttribute('data-web-player-test')){await router.go('/player',{webPlayerTest:true,item:{id:999999991,tmdbId:999999991,type:'movie',title:'Big Buck Bunny · Player test'}});return;}if(el.dataset.profile){"));
await writeFile(path.join(root,'src/config/testProviders.js'),`export const testProviders=Object.freeze({});export const providerOptions=Object.freeze([['primary','VidSrc'],['vsembed-embed','VSEmbed'],['demo','Demo video']]);`);
await edit('src/config/testProviders.js',s=>s.replace("[['primary'","[['web-direct','MJ Player'],['primary'"));
await edit('src/components/TrailerPlayer.js',s=>s.replace("widget_referrer:'https://com.mjentertainment.mjplay'", "widget_referrer:globalThis.location.origin").replace("if(data?.event==='onError')status.textContent='This trailer cannot play inside the app. Try another title.';", "if(data?.event==='onError')status.textContent='This trailer could not play (YouTube '+String(data.info||'error')+'). Try Retry or another title.';"));
await edit('src/services/intros.js',s=>s.replace("!/^tt\\d+$/.test(item.imdbId||'')", "!(/^tt\\d+$/.test(item.imdbId||'')||Number.isSafeInteger(Number(item.tmdbId??item.id)))").replace("[item.imdbId,season,episode,Math.round(duration)]", "[item.imdbId||('tmdb-'+(item.tmdbId??item.id)),season,episode,Math.round(duration)]").replace("const sources=[['IntroDB',", "const sources=[['IntroDB',"));
await cp('web/WebDirectProvider.js',path.join(root,'src/providers/WebDirectProvider.js'));
await cp('web/webPlayerSupport.js',path.join(root,'src/components/webPlayerSupport.js'));
await cp('web/streamRecovery.js',path.join(root,'src/components/streamRecovery.js'));
await cp('web/playerShortcuts.js',path.join(root,'src/components/playerShortcuts.js'));
for(const file of ['ExperimentalEmbedPlayer.js','experimentalEmbedPolicy.js'])await cp('web/'+file,path.join(root,'src/components',file));
await writeFile(path.join(root,'src/components/experimentalEmbedConfig.js'),'export const experimentalEmbedEnabled='+String(staging&&process.env.MJ_WEB_EXPERIMENTAL_EMBEDS==='1')+';');
await edit('src/components/DirectVideoControls.js',s=>s.replace('const extras=mountPlaybackExtras(', 'const extras=video.__mjProviderControlled?{keepVisible:()=>false,dispose:()=>{}}:mountPlaybackExtras('));
// Provider exposes neither intro/recap timestamps nor a hide-intro command.
// Do not advertise a duplicate MJ prompt backed by an unreliable browser lookup.
await edit('src/components/DirectVideoControls.js',s=>s.replace('const introPrompt=mountIntroPrompt(', 'const introPrompt=video.__mjProviderControlled?{dispose(){}}:mountIntroPrompt('));
await edit('src/components/DirectVideoControls.js',s=>s.replace('Playback options</button>', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 17h16M9 4v6M15 14v6"/></svg><span>Playback settings</span></button>'));
await cp('web/WebLivePlayer.js',path.join(root,'src/components/WebLivePlayer.js'));
if(catalogueOrigin)await cp('web/stagingLiveSources.js',path.join(root,'src/components/stagingLiveSources.js'));
await cp('web/LiveWatchBrowse.js',path.join(root,'src/components/LiveWatchBrowse.js'));
await cp('web/liveBack.js',path.join(root,'src/components/liveBack.js'));
await edit('src/config/playback.js',s=>"import {WebDirectProvider} from '../providers/WebDirectProvider.js';\n"+s.replace("if(config.provider==='demo')","if(config.provider==='web-direct')return new WebDirectProvider();\n  if(config.provider==='demo')"));
await edit('src/pages/PlayerPage.js',s=>"import {attachWebSource,addWebPlayerActions} from '../components/webPlayerSupport.js';\n"+s
 .replace("const iframe=playbackProvider.capabilities.playerType==='iframe'","const iframe=!state.webPlayerTest&&playbackProvider.capabilities.playerType==='iframe'")
 .replaceAll('activeProvider=playbackProvider','activeProvider=state.webPlayerTest?createPlaybackProvider({...playbackConfig,provider:\'demo\'}):playbackProvider')
 .replaceAll('timeout=setTimeout(()=>fail(),20000)','timeout=setTimeout(()=>fail(),60000)')
 .replace("url.protocol!=='https:'||url.username||url.password", "(url.protocol!=='https:'&&!(url.origin===location.origin&&url.pathname.startsWith('/api/relay/')))||url.username||url.password")
 .replace("if(isDirectPlaybackProvider())stopProgress=mountDirectVideoControls", "if(activeProvider.capabilities.playerType==='video')stopProgress=mountDirectVideoControls")
 .replace("video.onplaying=()=>", "const removeWebActions=addWebPlayerActions(video,panel,{item,season:state.season,episode:state.episode}),oldStop=stopProgress;stopProgress=()=>{removeWebActions();oldStop();};\n    video.onplaying=()=>")
 .replace("video.onerror=()=>fail();", "video.onerror=()=>fail(video.dataset.webError?'Direct stream: '+video.dataset.webError:'The browser could not decode this stream.');")
 .replace("host.append(video);video.src=url.href;", "host.append(video);await attachWebSource(video,source);")
 .replace("media.pause();media.removeAttribute('src')", "media.__mjDispose?.();media.__mjHls?.destroy();media.pause();media.removeAttribute('src')")
 .replace("e.message?.startsWith('No captured stream')", "(e.message?.startsWith('No captured stream')||e.message?.startsWith('No browser-compatible'))")
 .replace("${media?.tagName==='IFRAME'?'<button id=\"player-try-direct\" data-focus=\"player-try-direct\">Try Direct Player</button>':''}",""));
await edit('src/config/playback.js',s=>s.replace("export function initializeDirectDefault(){","export function initializeDirectDefault(){return;"));
// Web playback always starts with MJ Player. Other providers remain recovery-only.
await edit('src/config/playback.js',s=>s.replace(/export function selectedPlaybackProvider\(\)\{[^\n]+/,"export function selectedPlaybackProvider(){return 'web-direct';}"));
await edit('src/pages/SettingsPage.js',s=>s.replace(/<h2>Preferred player<\/h2>[\s\S]*?\+'<\/div><p>/,"<h2>Playback</h2><p>MJ Player is used for movies and episodes. Fallback servers appear only if playback fails.</p><p>"));
await edit('src/pages/PlayerPage.js',s=>s
 .replace("const host=root.querySelector('#player-host')","selectPlaybackProvider('web-direct');const host=root.querySelector('#player-host')")
 .replace('const loading=()=>','let webPlaybackFailed=false;const loading=()=>')
 .replace('<button id="player-switch" data-focus="player-switch">Switch Server</button>', '${webPlaybackFailed?\'<button id="player-switch" data-focus="player-switch">Try another server</button>\':\'\'}')
 .replace("root.querySelector('#player-switch').onclick=chooseServer;","const switchButton=root.querySelector('#player-switch');if(switchButton)switchButton.onclick=chooseServer;")
 .replace("const fail=(message=","const fail=(message=")
 .replace("=>{if(disposed)return;if(media?.tagName==='VIDEO'", "=>{if(disposed)return;webPlaybackFailed=true;if(media?.tagName==='VIDEO'")
 .replace('async function start(preparedVideo){','async function start(preparedVideo){webPlaybackFailed=false;')
 .replace('function chooseServer(){','function chooseServer(){if(!webPlaybackFailed)return;'));
await writeFile(path.join(root,'src/companion/config.js'),`export const companionConfig={url:'',localDevelopment:false};`);
// Public builds contain no backup implementation or account configuration.
await writeFile(path.join(root,'src/services/privateBackup.js'),`export const startCloudBackup=()=>()=>{};`);
// WS uses its embedded player on the web; TV inspector access is not available.
if(catalogueOrigin)await edit('src/components/AlternativeLivePlayer.js',s=>s
 .replace('useSandbox:true}','useSandbox:true,sandbox:state.embedSandbox}')
 .replace('host.append(media);load();','if(state.embedSandbox)media.style.pointerEvents="auto";host.append(media);load();')
 .replace('if(!disposed&&document.activeElement===media)','if(!state.embedSandbox&&!disposed&&document.activeElement===media)'));
await edit('src/pages/LiveTrialPage.js',s=>s.replace("if(channel.provider&&channel.provider!=='WS_DDL')","if(true)").replace('mountAlternativeLive(root,{...state,channel},options)','mountAlternativeLive(root,{...state,channel:{...channel,url:channel.url||channelEmbedUrl(channel.wsNumber||channel.number)}},options)'));
await edit('src/pages/LiveTrialPage.js',s=>(catalogueOrigin?"import {stagingLiveSource} from '../components/stagingLiveSources.js';\n":"")+"import {mountWebLive} from '../components/WebLivePlayer.js';\n"+s.replace('const channel=state.channel||trialChannel;if(true)',"const channel=state.channel||trialChannel;"+(catalogueOrigin?"const pilot=stagingLiveSource(channel);if(pilot)return mountAlternativeLive(root,{...state,channel:{...channel,...pilot},embedSandbox:\"allow-scripts allow-same-origin\"},options);":"")+"if((!channel.provider||channel.provider==='WS_DDL')&&Number(channel.wsNumber||channel.number)>0)return mountWebLive(root,{...state,channel},options);if(true)"));
await cp('web/web.css',path.join(root,'styles/web.css'));
await edit('src/app.js',s=>s.replace('onCancel:()=>router.back(),prepareNextEpisode,onNextEpisode:', "onCancel:()=>router.back(),onSelectEpisode:async(season,episode)=>{await router.go('/player',{...state,season,episode,restart:true},true);return true;},prepareNextEpisode,onNextEpisode:"));
const embedStyles=await readFile('web/experimentalEmbed.css','utf8');
await edit('styles/web.css',s=>s+'\n'+embedStyles);
await edit('src/pages/PlayerPage.js',s=>"import {shouldUseExperimentalEmbed,mountExperimentalEmbed} from '../components/ExperimentalEmbedPlayer.js';\nimport {setExperimentalTransport} from '../components/experimentalEmbedPolicy.js';\n"+s.replace('export function mountPlayer(state,root,{onNextEpisode,prepareNextEpisode,onCancel}={}){',`export function mountPlayer(state,root,{onNextEpisode,prepareNextEpisode,onCancel,onSelectEpisode}={}){if(shouldUseExperimentalEmbed(state)){let stopEmbed,stopDirect;stopEmbed=mountExperimentalEmbed(state,root,{onNextEpisode,prepareNextEpisode,onCancel,onSelectEpisode,onUseDirect:()=>{stopEmbed?.();setExperimentalTransport('direct');stopDirect=mountPlayer(state,root,{onNextEpisode,prepareNextEpisode,onCancel});}});return()=>{stopEmbed?.();stopDirect?.();};}`));
if(splitLive){
 await cp('research/split-live/attachSplit.js',path.join(root,'src/components/attachSplit.js'));
 await cp('research/prototypes/browser-live-decode.mjs',path.join(root,'src/components/splitDecoder.js'));
 await cp('research/live-phase2/https/public/hls.js',path.join(root,'split-hls.js'));
 await edit('src/components/WebLivePlayer.js',s=>"import {attachSplit} from './attachSplit.js';\n"+s.replace('await attachWebSource(video,source);','await (number===339?attachSplit(video,source):attachWebSource(video,source));'));
}
await build({nodePaths:[path.resolve('web/node_modules')],entryPoints:[path.join(root,'src/bootstrap.js')],outdir:path.join(root,'app'),bundle:true,splitting:true,format:'esm',platform:'browser',target:['es2022'],minify:true,sourcemap:false,legalComments:'none',entryNames:'start',chunkNames:'[name]-[hash]'});
await edit('index.html',s=>s.replace('src/bootstrap.js','app/start.js'));
await rm(path.join(root,'src'),{recursive:true,force:true});
await cp('web/landing',path.join(root,'download'),{recursive:true});
await cp('web/manifest.webmanifest',path.join(root,'manifest.webmanifest'));
console.log('Web build ready: '+root+' (no private configuration copied; experimental embeds '+(staging&&process.env.MJ_WEB_EXPERIMENTAL_EMBEDS==='1'?'enabled':'disabled')+').');



