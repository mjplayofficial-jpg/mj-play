import {mountGenrePreview} from './GenrePreview.js';
import {tmdb} from '../services/tmdb.js';
import {scrollShelfIntoView} from '../navigation/shelfScroll.js';
import {artwork,escapeHtml as esc} from './ui.js';


export function mountBrowsePreview(root,doc=document,service=tmdb,scheduler=globalThis){
 if(root.querySelector?.('.home-cinema'))return mountGenrePreview(root,doc);if(root.querySelector?.('.search-page,.details'))return ()=>{};
 if(root.querySelector?.('.genre-cinema'))return mountGenrePreview(root,doc);
 const panel=doc.createElement('aside');panel.className='browse-preview';panel.hidden=true;panel.setAttribute('aria-label','Selected title preview');root.append(panel);
 let timer,serial=0,disposed=false;
 const hide=()=>{serial++;scheduler.clearTimeout(timer);panel.hidden=true;doc.documentElement.classList.remove('browse-preview-visible');};
 const paint=item=>{panel.innerHTML=`<div class="browse-preview-art" aria-hidden="true"></div><div class="browse-preview-copy"><p class="eyebrow">${item.type==='tv'?'SERIES':'MOVIE'} · MJ PLAY</p><div class="preview-title">${item.logo?`<img class="preview-title-logo" src="${esc(artwork(item.logo))}" alt="${esc(item.title)}" onload="this.nextElementSibling.hidden=true" onerror="this.remove()">`:''}<h2>${esc(item.title)}</h2></div><p class="metadata"><span class="rating">★ ${esc(item.rating||'—')}</span><span>${esc(item.year)}</span>${item.runtime?`<span>${esc(item.runtime)} min</span>`:''}<span>${esc((item.genres||[]).slice(0,3).join(' · '))}</span></p><p class="overview">${esc(item.overview||'Explore this title for more information.')}</p><p class="browse-preview-hint">OK for details · BACK to return</p></div>`;
  const art=panel.querySelector('.browse-preview-art');if(item.backdrop)art.style.backgroundImage=`url("${artwork(encodeURI(item.backdrop),'w1280').replaceAll('"','%22')}")`;
  panel.hidden=false;doc.documentElement.classList.add('browse-preview-visible');
 };
 const onFocus=event=>{
  const card=event.target.closest?.('[data-preview]');if(!card||!root.contains(card)){hide();return;}
  if(card.closest?.('#collection-titles')){hide();return;}
  let item;try{item=JSON.parse(card.dataset.preview);}catch{hide();return;}
  if(!['movie','tv'].includes(item.type)||!Number.isSafeInteger(item.id)||item.id<1){hide();return;}
  const current=++serial;scheduler.clearTimeout(timer);
  // One short delay avoids work and visual flashes while holding an arrow key.
  timer=scheduler.setTimeout(async()=>{
   if(disposed||serial!==current)return;paint(item);scrollShelfIntoView(card,{doc});
   try{const detail=await service.details(item.type,item.id);if(!disposed&&serial===current){paint(detail);if(service.titleLogo){const logo=await service.titleLogo(item.type,item.id);if(logo&&!disposed&&serial===current)paint({...detail,logo});}}}catch{/* Basic catalogue metadata remains useful when details cannot load. */}
  },220);
 };
 root.addEventListener('focusin',onFocus);
 return ()=>{disposed=true;hide();root.removeEventListener('focusin',onFocus);panel.remove();};
}

