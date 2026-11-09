import {tmdb} from '../services/tmdb.js';
import {escapeHtml as esc,artwork} from './ui.js';
export function mountTVPlayerMenus(panel,{item,season,episode}){
 const doc=panel.ownerDocument,row=panel.querySelector('.cinema-bottom-actions');let disposed=false,request=0;
 const make=(label,key,path)=>{const b=doc.createElement('button');b.dataset.focus=key;b.setAttribute('aria-label',label);b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg><span>'+label+'</span>';return b;};
 const settings=make('Settings','tv-player-settings','M4 7h16M4 17h16M9 4v6M15 14v6');row.append(settings);
 const sheet=doc.createElement('div');sheet.className='tv-player-menu';sheet.hidden=true;
 const heading=doc.createElement('h3');heading.textContent='Player settings';sheet.append(heading);
 const extras=panel.querySelector('.cinema-extra-actions'),popup=panel.querySelector('.cinema-subtitles'),options=panel.querySelector('[data-focus="direct-options"]');
 if(extras)sheet.append(extras);if(popup)sheet.append(popup);if(options)sheet.append(options);
 const observer=popup?new MutationObserver(()=>sheet.classList.toggle('tv-subtitle-open',!popup.hidden)):null;
 if(popup)observer.observe(popup,{attributes:true,attributeFilter:['hidden']});
 const done=make('Done','tv-settings-close','m5 12 4 4L19 6');sheet.append(done);panel.append(sheet);
 const closeSettings=()=>{sheet.hidden=true;sheet.removeAttribute('data-modal');panel.hidden=false;settings.focus();};
 settings.onclick=()=>{panel.hidden=false;sheet.hidden=false;sheet.setAttribute('data-modal','');sheet.querySelector('[data-focus]')?.focus();};done.onclick=closeSettings;
 for(const key of ['direct-quality','direct-options']){const b=sheet.querySelector('[data-focus="'+key+'"]');if(b){const action=b.onclick;b.onclick=e=>{closeSettings();action?.(e);};}}
 let drawer=null,episodesButton=null;
 if(item.type==='tv'){
  episodesButton=make('Episodes','tv-player-episodes','M3 4h18v4H3ZM3 11h18v4H3ZM3 18h18v3H3Z');row.insertBefore(episodesButton,settings);
  drawer=doc.createElement('div');drawer.className='tv-episode-drawer';drawer.hidden=true;panel.append(drawer);
  const close=()=>{request++;drawer.hidden=true;drawer.removeAttribute('data-modal');episodesButton.focus();};
  const load=async selected=>{const serial=++request;drawer.innerHTML='<div class="tv-drawer-heading"><h3>Episodes</h3><button data-focus="tv-episodes-close">Close</button></div><p role="status">Loading episodes…</p>';drawer.querySelector('button').onclick=close;
   try{const data=await tmdb.seasonDetails(item.tmdbId??item.id,selected);if(disposed||serial!==request)return;
    drawer.innerHTML='<div class="tv-drawer-heading"><h3>'+esc(item.title)+'</h3><button data-focus="tv-episodes-close">Close</button></div><details class="season-picker tv-drawer-seasons"><summary data-focus="tv-drawer-season">Season '+selected+'</summary><div class="season-picker-options">'+(item.seasons||[{season_number:season}]).filter(s=>s.season_number>0).map(s=>'<button data-focus="tv-drawer-season-'+s.season_number+'" data-tv-season="'+s.season_number+'">'+esc(s.name||'Season '+s.season_number)+'</button>').join('')+'</div></details><div class="tv-drawer-episodes">'+(data.episodes||[]).map(ep=>'<button data-focus="tv-drawer-episode-'+ep.episode_number+'" data-play="tv/'+(item.tmdbId??item.id)+'" data-season="'+selected+'" data-episode="'+ep.episode_number+'" '+(selected===season&&ep.episode_number===episode?'aria-current="true"':'')+'><img src="'+artwork(ep.still_path,'w300')+'" alt="" loading="lazy"><span><strong>'+ep.episode_number+'. '+esc(ep.name)+'</strong><small>'+(selected===season&&ep.episode_number===episode?'Now playing · ':'')+(ep.runtime?ep.runtime+' min':'')+'</small></span></button>').join('')+'</div>';
    drawer.querySelector('[data-focus="tv-episodes-close"]').onclick=close;
    for(const button of drawer.querySelectorAll('[data-tv-season]'))button.onclick=()=>{void load(Number(button.dataset.tvSeason));};
    (drawer.querySelector('[aria-current]')||drawer.querySelector('.tv-drawer-episodes button')||drawer.querySelector('summary')).focus();
   }catch{if(!disposed&&serial===request){drawer.querySelector('[role="status"]').textContent='Episodes could not load. Close and try again.';drawer.querySelector('button').focus();}}
  };
  episodesButton.onclick=()=>{sheet.hidden=true;sheet.removeAttribute('data-modal');panel.hidden=false;drawer.hidden=false;drawer.setAttribute('data-modal','');void load(Number(season)||1);};
 }
 const back=e=>{if(!['Escape','Backspace'].includes(e.key)&&e.keyCode!==461)return;if(popup&&!popup.hidden)return;const openSeason=drawer?.querySelector('.season-picker[open]');if(openSeason){e.preventDefault();e.stopImmediatePropagation();openSeason.open=false;openSeason.querySelector('summary').focus();return;}if(drawer&&!drawer.hidden){e.preventDefault();e.stopImmediatePropagation();request++;drawer.hidden=true;drawer.removeAttribute('data-modal');episodesButton.focus();}else if(!sheet.hidden){e.preventDefault();e.stopImmediatePropagation();closeSettings();}};
 doc.addEventListener('keydown',back,true);
 return {isOpen:()=>!sheet.hidden||!!drawer&&!drawer.hidden,dispose(){disposed=true;request++;observer?.disconnect();doc.removeEventListener('keydown',back,true);drawer?.remove();episodesButton?.remove();sheet.remove();settings.remove();}};
}
