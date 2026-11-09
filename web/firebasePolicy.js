export const remoteDefaults={vod_enabled:true,live_tv_enabled:true,sports_enabled:true,maintenance_message:'',min_android_version:0};
export function sectionForPath(path){
 if(path==='/sports')return 'sports';if(path==='/live-tv'||path==='/live-trial')return 'live_tv';
 if(path==='/player')return 'player';if(path.startsWith('/details/'))return 'details';
 if(path.startsWith('/actor/'))return 'actor';return {'/':'home','/movies':'movies','/tv':'shows','/search':'search','/my-list':'my_list'}[path]||'other';
}
export function safeEvent(name,params={}){
 if(!['section_view','playback_requested','playback_started','playback_failed','playback_buffering','playback_ended'].includes(name))return null;
 const clean={};
 if(['movie','tv','live','sport','unknown'].includes(params.content_type))clean.content_type=params.content_type;
 if(['home','movies','shows','sports','live_tv','player','details','actor','search','my_list','other'].includes(params.section))clean.section=params.section;
 for(const key of ['duration_ms','startup_ms','error_code'])if(Number.isFinite(params[key]))clean[key]=Math.max(0,Math.min(3600000,Math.round(params[key])));
 return {name,params:clean};
}
