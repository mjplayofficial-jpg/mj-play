const httpsUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
export function publicMediaSource(value){
 if(!value||!httpsUrl(value.url))return null;
 const variants=(Array.isArray(value.variants)?value.variants:[]).filter(v=>v&&httpsUrl(v.url)&&Number.isInteger(v.height)&&v.height>0&&v.height<=4320).slice(0,12).map(v=>({url:httpsUrl(v.url),height:v.height,bandwidth:Number(v.bandwidth)||0}));
 const subtitles=(Array.isArray(value.subtitles)?value.subtitles:[]).filter(t=>t&&httpsUrl(t.url)&&/^(en|eng)(-|$)/i.test(t.language||'en')).slice(0,5).map(t=>({url:httpsUrl(t.url),language:'en',label:'English'}));
 return {url:httpsUrl(value.url),masterUrl:httpsUrl(value.masterUrl)||httpsUrl(value.url),adaptive:!!value.adaptive,streamType:value.streamType==='hls'?'hls':undefined,variants,subtitles};
}
