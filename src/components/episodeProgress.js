import {playbackState} from './progressState.js';
export function episodeProgress(value){
 if(!value||!Number.isFinite(value.duration)||value.duration<=0)return '';
 const {watched,percent}=playbackState(value,'tv');
 return `<span class="episode-progress${watched?' watched':''}" role="progressbar" aria-label="Episode playback progress${watched?' · Watched':''}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}"><span style="width:${percent}%"></span></span>`;
}
