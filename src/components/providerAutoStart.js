// Runs only in an already title-matched provider frame after the user requests playback.
// Never activate verification, consent, advertisement, or arbitrary page controls.
export function startNormalProviderPlayback(){
 if(!(window.CONFIG||window.CFG?.playerUrl))return false;
 const video=document.querySelector('video');
 if(video){video.muted=true;if(!video.__mjPreparationMuted){video.__mjPreparationMuted=true;const silence=()=>{if(!video.muted)video.muted=true;};video.addEventListener('volumechange',silence);video.addEventListener('playing',silence);}}
 if(video?.paused===false)return false;
 const previous=window.__mjNormalPlayAttempt||{count:0,time:0};
 if(previous.count>=3||Date.now()-previous.time<1500)return false;
 const selectors=['button#bigPlay.jw-bigplay','button#play.jw-btn','.jw-display-icon-container .jw-icon-playback','.vjs-big-play-button','.plyr__control--overlaid','button[aria-label="Play"]','button[aria-label="Play video"]','button[title="Play"]'];
 for(const selector of selectors){
  const button=document.querySelector(selector);if(!button||button.disabled||!button.getClientRects().length)continue;
  const label=[button.textContent,button.getAttribute('aria-label'),button.getAttribute('title')].join(' ');
  if(/human|verif|captcha|advert|consent/i.test(label))continue;
  window.__mjNormalPlayAttempt={count:previous.count+1,time:Date.now()};button.click();return true;
 }
 return false;
}
