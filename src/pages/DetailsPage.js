import {appNow} from '../services/appClock.js';
import {titleProgress} from '../components/titleActionPresentation.js';
import {feedbackIcon} from '../components/icons.js';
import {episodeProgress} from '../components/episodeProgress.js';
import {findNextEpisode} from '../components/nextEpisode.js';
import {playLabel,playbackNote} from '../components/playbackLabels.js';
import {tmdb} from '../services/tmdb.js';
import {artwork,escapeHtml as esc} from '../components/ui.js';
import {library} from '../storage/library.js';
import {progressStore} from '../storage/progress.js';
import {playbackProvider} from '../config/playback.js';
import {resumable,timeLabel} from '../components/PlaybackProgress.js';
export async function DetailsPage(type,id,state={}){
 const item=await tmdb.details(type,id),last=library.last(type,id);
 const seasons=item.seasons.filter(x=>x.season_number>0);
 const requested=Number(state.season)||last?.season;
 const season=seasons.find(x=>x.season_number===requested)?.season_number||seasons[0]?.season_number;
 let episodes=[],seasonFailed=false;
 if(type==='tv'&&season){try{episodes=(await tmdb.seasonDetails(id,season)).episodes||[];}catch{seasonFailed=true;console.warn('Season could not load');}}
 const nextUnwatched=episodes.find(ep=>ep.air_date&&ep.air_date<=new Date(appNow()).toISOString().slice(0,10)&&!progressStore.latest(playbackProvider.capabilities.name,item,season,ep.episode_number)?.completed&&!(progressStore.latest(playbackProvider.capabilities.name,item,season,ep.episode_number)?.duration-progressStore.latest(playbackProvider.capabilities.name,item,season,ep.episode_number)?.position<=15));
 const demoNote=playbackNote(),saved=library.has(type,id);
 const progressFor=(season,episode)=>playbackProvider.capabilities.supportsProgress?progressStore.latest(playbackProvider.capabilities.name,item,season,episode):null;
 let continuation=last;const previous=progressFor(last?.season,last?.episode);if(type==='tv'&&last&&previous&&(previous.completed||previous.duration-previous.position<=15)){try{continuation=await findNextEpisode(tmdb,item,last.season,last.episode);}catch{continuation=null;}}
 const progress=progressFor(continuation?.season,continuation?.episode),resume=resumable(progress);
 const continueButton=continuation&&type==='tv'?`<button class="primary" data-focus="detail-continue" data-play="tv/${id}" data-season="${continuation.season}" data-episode="${continuation.episode}">▶ ${resume?'Resume':'Continue'}</button>`:'';
 const upcoming=item.releaseDate>new Date(appNow()).toISOString().slice(0,10);
 const play=upcoming?`<p class="release-notice">Upcoming · Expected ${esc(item.releaseDate)}. Add to My List to save it.</p>`:type==='tv'?`${continueButton||`<button class="primary" data-focus="detail-play" data-play="tv/${id}" data-season="${season||1}" data-episode="${episodes[0]?.episode_number||1}">▶ Play</button>`}<button data-focus="detail-choose" data-choose-episode ${seasons.length?'':'disabled'}>${last?'More episodes':'Choose episodes'}</button>`:`<button class="primary" data-focus="detail-play" data-play="movie/${id}">▶ ${resume?'Resume':playLabel(type)}</button>`;
 return `<section class="details" style="background-image:linear-gradient(90deg,#080b18,rgba(8,11,24,.7)),linear-gradient(0deg,#080b18,transparent),url('${artwork(item.backdrop,'w1280')}')">
 <img class="detail-poster" src="${artwork(item.poster)}" onerror="this.onerror=null;this.src='assets/placeholders/poster.svg'" alt="${esc(item.title)} poster">
 <div class="detail-copy"><p class="eyebrow">${type==='tv'?'SERIES':'MOVIE'} · MJ PLAY</p><h1>${esc(item.title)}</h1><p class="metadata"><span class="rating">★ ${esc(item.rating)}</span> ${esc(item.year)} ${item.runtime?'· '+item.runtime+' min':''}</p><p class="subtle">${esc(item.genres.join(' · '))}</p><p class="overview">${esc(item.overview)}</p>
 ${titleProgress(progress)}<div class="actions" data-title-actions data-focus-row>${play}<button data-focus="detail-related" data-section="related-titles">More like this</button><button data-focus="detail-save" data-save="${type}/${id}" aria-pressed="${saved}">${saved?'Remove from My List':'＋ My List'}</button>${last?`<button data-focus="detail-remove-recent" data-remove-recent="${type}/${id}">Remove from Continue Watching</button>`:''}<button id="detail-trailer" data-focus="detail-trailer" hidden>▷ Watch Trailer</button><button data-focus="detail-like" data-taste="like" aria-pressed="false">${feedbackIcon()}<span>Like</span></button><button data-focus="detail-dislike" data-taste="dislike" aria-pressed="false">${feedbackIcon(true)}<span>Not for me</span></button></div>
 <p id="trailer-note" class="subtle trailer-note"></p>${demoNote?`<p class="subtle provider-note">${esc(demoNote)}</p>`:''}${last?`<p class="subtle history-note">${progress?'Playback position saved on this TV.':'Last opened on this TV; no playback position received yet.'}</p>`:''}
 ${item.cast.length?`<div class="cast" data-focus-row><strong>Cast</strong> ${item.cast.filter(x=>x.id).map(x=>`<button class="cast-link" data-focus="cast-${x.id}" data-route="/person/${x.id}">${esc(x.name)}</button>`).join('')}</div>`:''}</div></section>
 ${type==='tv'?`<section class="seasons" id="episode-picker"><h2>Seasons & episodes</h2><p class="subtle">Choose a season with OK, then select an episode to play.</p>
 ${seasons.length?`<div class="season-selector"><details class="season-picker"><summary class="selected" data-focus="season-${season}" aria-label="Choose season">${esc(seasons.find(s=>s.season_number===season)?.name||'Season '+season)}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="season-picker-options" aria-label="Seasons">${seasons.map(s=>`<button aria-pressed="${s.season_number===season}" data-focus="season-option-${s.season_number}" data-season-route="${s.season_number}"><span>${esc(s.name)}</span><small>${s.episode_count||0} episodes</small></button>`).join('')}</div></details></div>`:`<p class="subtle">${tmdb.demo?'Connect TMDB to browse this series’ seasons and episodes.':'No seasons available.'}</p>`}
 ${seasonFailed?'<p>Episodes could not load.</p><button data-focus="season-retry" data-retry>Try Again</button>':''}
 ${episodes.length?`<h3 class="season-heading">Season ${season} · ${episodes.length} episodes</h3>`:season&&!seasonFailed?'<p>No episodes available for this season yet.</p>':''}
 <div class="episodes">${episodes.map(ep=>`<button class="episode" data-focus="episode-${ep.episode_number}" data-play="tv/${id}" data-season="${season}" data-episode="${ep.episode_number}"><span class="episode-art"><img loading="lazy" src="${artwork(ep.still_path,'w300')}" onerror="this.onerror=null;this.src='assets/placeholders/poster.svg'" alt="">${episodeProgress(progressFor(season,ep.episode_number))}</span><div><span class="subtle">S${season} E${ep.episode_number}${ep.runtime?' · '+ep.runtime+' min':''}${ep.episode_number===nextUnwatched?.episode_number?' · Next unwatched':''}${(()=>{const p=progressFor(season,ep.episode_number);return p?.completed||p&&p.duration-p.position<=15?' · ✓ Watched':resumable(p)?' · '+Math.max(1,Math.ceil((p.duration-p.position)/60))+' min left':last?.season===season&&last?.episode===ep.episode_number?' · Last opened':'';})()}</span><h3>${esc(ep.name)}</h3><p>${esc(ep.overview||'No description available.')}</p></div></button>`).join('')}</div></section>`:''}${type==='movie'&&item.collection?'<section id="collection-titles" class="media-section" hidden></section>':''}<section id="related-titles" class="media-section"><h2>More Like This</h2><p class="genre-message subtle" role="status">Finding related titles…</p></section>`;
}






