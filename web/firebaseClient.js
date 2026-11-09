import {initializeApp} from 'firebase/app';
import {getRemoteConfig,isSupported as supportsConfig,fetchAndActivate,getValue,activate,onConfigUpdate} from 'firebase/remote-config';
import {remoteDefaults,sectionForPath,safeEvent} from './firebasePolicy.js';
let remote,applyRemote,app,analytics,analyticsSDK,analyticsReady,config={...remoteDefaults};
const consentKey='mj-usage-analytics';
const readConsent=()=>{try{return localStorage.getItem(consentKey);}catch{return 'denied';}};
const privateBrowser=()=>navigator.globalPrivacyControl||(navigator.doNotTrack==='1'&&readConsent()!=='granted');
export const firebaseFlags=()=>({...config});
export function playbackAllowed(kind){return !config.maintenance_message&&(kind==='sports'?config.sports_enabled:kind==='live'?config.live_tv_enabled:config.vod_enabled);}
export function trackUsage(name,params){const event=safeEvent(name,params);if(!event||!analytics||privateBrowser()||readConsent()!=='granted')return;try{analyticsSDK.logEvent(analytics,event.name,{...event.params,page_location:location.origin+'/',page_referrer:'',page_title:'MJ Play'});}catch{}}
async function startAnalytics(){
 if(!app||privateBrowser()||readConsent()!=='granted')return;
 if(analyticsReady)return analyticsReady;
 analyticsReady=(async()=>{analyticsSDK=await import('firebase/analytics');if(!await analyticsSDK.isSupported()||privateBrowser()||readConsent()!=='granted')return;
  analytics=analyticsSDK.initializeAnalytics(app,{config:{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+'/',page_referrer:'',page_title:'MJ Play'}});
  trackUsage('section_view',{section:sectionForPath(location.hash.slice(1).split('?')[0]||'/')});
 })().catch(()=>{analyticsReady=null;});return analyticsReady;
}
function consentUI(){
 if(readConsent())return;
 if(document.querySelector('.usage-consent'))return;
 const box=document.createElement('aside');box.className='usage-consent';box.setAttribute('aria-label','Usage analytics preference');
 box.innerHTML='<p>Help improve MJ Play? Share usage and playback diagnostics with Google Analytics. We omit title names, searches and stream links.</p><button data-usage="granted">Allow analytics</button><button data-usage="denied">No thanks</button>';
 if(navigator.globalPrivacyControl){box.querySelector('p').textContent='Analytics are off because your browser requests privacy protection. MJ Play respects Do Not Track and Global Privacy Control.';box.querySelector('[data-usage="granted"]').remove();box.querySelector('[data-usage="denied"]').textContent='Close';}
 box.onclick=e=>{const value=e.target.closest('[data-usage]')?.dataset.usage;if(!value)return;try{localStorage.setItem(consentKey,value);}catch{}if(analytics)analyticsSDK.setAnalyticsCollectionEnabled(analytics,value==='granted');box.remove();if(value==='granted')void startAnalytics();};document.body.append(box);
}
export async function initializePublicFirebase(options){
 if(!options?.projectId)return;
 try{app=initializeApp(options);}catch{return;}
 // Remote Config never blocks catalogue startup or interrupts active playback.
 void (async()=>{try{if(!await supportsConfig())return;remote=getRemoteConfig(app);remote.defaultConfig={...remoteDefaults,community_links:'[]',drawer_header:'{"tagline":"Your world. Press play.","image_url":""}'};remote.settings={minimumFetchIntervalMillis:60000,fetchTimeoutMillis:8000};applyRemote=()=>{config=Object.fromEntries(Object.entries(remoteDefaults).map(([k,v])=>[k,typeof v==='boolean'?getValue(remote,k).asBoolean():typeof v==='number'?getValue(remote,k).asNumber():getValue(remote,k).asString().slice(0,240)]));try{const raw=getValue(remote,'community_links').asString();community=parseCommunityLinks(raw);}catch{}try{const h=JSON.parse(getValue(remote,'drawer_header').asString());if(typeof h.tagline==='string'&&h.tagline.length<=100)tagline=h.tagline;}catch{}document.dispatchEvent(new Event('mj-config-updated'));};await activate(remote);applyRemote();await fetchAndActivate(remote);applyRemote();onConfigUpdate(remote,{next:()=>{void activate(remote).then(applyRemote);},error:()=>{}});}catch{}})();
 if(readConsent()==='granted')void startAnalytics();else if(!readConsent()&&!privateBrowser())consentUI();
 const section=()=>trackUsage('section_view',{section:sectionForPath(location.hash.slice(1).split('?')[0]||'/')});window.addEventListener('hashchange',section);
 const sessions=new WeakMap();
 for(const name of ['loadstart','playing','waiting','ended','error'])document.addEventListener(name,e=>{
  const video=e.target;if(video?.tagName!=='VIDEO')return;
  let state=sessions.get(video);if(!state||name==='loadstart'){state={at:performance.now(),started:false,waiting:0};sessions.set(video,state);}
  const content_type=video.dataset.usageType||'unknown';
  if(name==='playing'){if(!state.started){state.started=true;trackUsage('playback_started',{content_type,startup_ms:performance.now()-state.at});}if(state.waiting){trackUsage('playback_buffering',{content_type,duration_ms:performance.now()-state.waiting});state.waiting=0;}}
  if(name==='waiting'&&state.started&&!video.seeking&&!state.waiting)state.waiting=performance.now();
  if(name==='ended')trackUsage('playback_ended',{content_type});
  if(name==='error')trackUsage('playback_failed',{content_type,error_code:video.error?.code||0});
 },true);
 const enhance=()=>{let notice=document.querySelector('.firebase-maintenance');if(config.maintenance_message){if(!notice){notice=document.createElement('aside');notice.className='firebase-maintenance';notice.setAttribute('role','status');document.body.append(notice);}if(notice.textContent!==config.maintenance_message)notice.textContent=config.maintenance_message;}else notice?.remove();};
 document.addEventListener('mj-config-updated',enhance);
 new MutationObserver(enhance).observe(document.querySelector('#app'),{childList:true,subtree:true});enhance();
}

let community=[],tagline='Your world. Press play.';
export function parseCommunityLinks(raw){
 if(typeof raw!=='string'||raw.length>16000)return [];
 const values=JSON.parse(raw);if(!Array.isArray(values))return [];
 const known=new Set(['facebook','instagram','telegram','whatsapp','tiktok','x','youtube','website']),seen=new Set();
 return values.slice(0,8).filter(x=>{try{const u=new URL(x.url);if(!known.has(x.platform)||seen.has(x.platform)||x.enabled!==true||u.protocol!=='https:'||u.username||u.password||u.port||x.url.length>2048||typeof x.label!=='string'||!x.label.trim()||x.label.length>60)return false;seen.add(x.platform);return true;}catch{return false;}}).map(x=>({platform:x.platform,label:x.label,url:x.url}));
}
export const publicCommunity=()=>({links:community.map(x=>({...x})),tagline});
export const diagnosticsAllowed=()=>!privateBrowser()&&readConsent()==='granted';
export const diagnosticsLocked=()=>!!navigator.globalPrivacyControl;
export function setDiagnostics(value){const allowed=!!value&&!navigator.globalPrivacyControl;try{localStorage.setItem(consentKey,allowed?'granted':'denied');}catch{}document.querySelector('.usage-consent')?.remove();if(analytics)analyticsSDK.setAnalyticsCollectionEnabled(analytics,allowed);if(allowed)void startAnalytics();}
export async function refreshPublicConfig(){if(!remote||!applyRemote)return false;try{const previous=remote.settings.minimumFetchIntervalMillis;remote.settings.minimumFetchIntervalMillis=0;try{await fetchAndActivate(remote);applyRemote();return true;}finally{remote.settings.minimumFetchIntervalMillis=previous;}}catch{return false;}}
