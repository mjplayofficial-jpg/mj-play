import {appNow} from '../services/appClock.js';
import {playbackState} from './progressState.js';
import {progressStore} from '../storage/progress.js';
import {finishedMovieProgress} from './continueSeries.js';
import {playbackProvider} from '../config/playback.js';
import {resumable,timeLabel} from './PlaybackProgress.js';
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function artwork(path,size='w500'){return path?'https://image.tmdb.org/t/p/'+size+path:'assets/placeholders/poster.svg';}
export function card(item){const preview=escapeHtml(JSON.stringify({id:item.id,type:item.type,title:item.title,year:item.year,rating:item.rating,backdrop:item.backdrop,overview:item.overview}));return `<button class="card" data-preview="${preview}" data-focus="${item.type}-${item.id}" data-route="/${item.type}/${item.id}"><img loading="lazy" decoding="async" src="${escapeHtml(artwork(item.poster,'w342'))}" onerror="this.onerror=null;this.src='assets/placeholders/poster.svg'" alt=""><span class="card-title">${escapeHtml(item.title)}</span><span class="subtle">${item.releaseDate>new Date(appNow()).toISOString().slice(0,10)?'Upcoming · ':''}${escapeHtml(item.year)} · ${item.type==='tv'?'Series':'Movie'}</span></button>`;}
export function row(title,items){return `<section class="media-section"><h2>${escapeHtml(title)}</h2><div class="media-row" data-focus-row>${items.map((item,index)=>card(item).replace('loading="lazy"',index<4?'loading="eager"':'loading="lazy"').replace('data-focus="','data-focus="'+escapeHtml(title)+'-')).join('')}</div></section>`;}
export function recentProgress(item){
 const value=progressStore.latest(playbackProvider.capabilities.name,item,item.season,item.episode);
 if(!value)return {value:null,resume:false,percent:0,label:item.upNext?'Up next · Ready to play':'Resume position unavailable'};
 const status=playbackState(value,item.type);return {value,resume:status.resumable,percent:status.percent,label:status.watched?'Watched':resumable(value)?Math.ceil((value.duration-value.position)/60)+' min remaining':'Just started'};
}
function recentCard(item){
 const preview=escapeHtml(JSON.stringify({id:item.id,type:item.type,title:item.title,year:item.year,backdrop:item.backdrop}));
 return `<button class="card recent-landscape" data-preview="${preview}" data-focus="recent-${item.type}-${item.id}" data-route="/${item.type}/${item.id}"><span class="recent-scene"><img data-recent-art="${item.id}/${item.season}/${item.episode}" loading="lazy" decoding="async" src="${escapeHtml(artwork(item.backdrop||item.poster,'w500'))}" onerror="this.onerror=null;this.src='assets/placeholders/poster.svg'" alt=""><span class="recent-scene-play" aria-hidden="true">▶</span></span><span class="recent-title">${escapeHtml(item.title)}</span></button>`;
}
export function recentRow(items){items=items.filter(item=>{const value=recentProgress(item).value;return item.type==='movie'?!finishedMovieProgress(value):!value||(!value.completed&&value.duration-value.position>15);});if(!items.length)return '';return `<section class="media-section"><h2>Continue Watching</h2><div class="media-row" data-focus-row>${items.map(item=>{
 const progress=recentProgress(item),episode=item.type==='tv'?`data-season="${item.season}" data-episode="${item.episode}"`:'';
 return `<div class="recent-item">${recentCard(item)}<p class="recent-episode subtle" ${item.type==='tv'?`data-recent-episode="${item.id}/${item.season}/${item.episode}"`:''}>${item.type==='tv'?`S${item.season} E${item.episode}`:'Movie'}</p>${progress.value?`<div class="recent-progress" role="progressbar" aria-label="${escapeHtml(item.title)} playback progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress.percent)}"><span style="width:${progress.percent}%"></span></div>`:''}<p class="recent-remaining subtle">${escapeHtml(progress.label)}</p></div>`;
 }).join('')}</div></section>`;}
export function loading(){return '<div class="loading" role="status" aria-label="Loading"><div class="spinner" aria-hidden="true"></div></div>';}
export function errorScreen(message='The catalogue is unavailable. Check your connection and TMDB configuration.'){return `<section class="empty"><p class="eyebrow">MARIA JOHN PLAY</p><h1>Something went wrong</h1><p>${escapeHtml(message)}</p><div data-focus-row><button data-focus="retry" data-retry>Try Again</button><button data-focus="back" data-back>Back</button></div></section>`;}







