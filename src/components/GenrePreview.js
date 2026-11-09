import {artwork,escapeHtml as esc} from './ui.js';
import {scrollShelfIntoView} from '../navigation/shelfScroll.js';
export function mountGenrePreview(root,doc=document){
 let active,original,timer;
 const clear=()=>{clearTimeout(timer);if(!active)return;active.classList.remove('genre-expanded');const image=active.querySelector('img');if(image&&original)image.src=original;active.querySelector('.genre-card-summary')?.remove();active=null;};
 const focus=event=>{
  const card=event.target.closest?.('.card[data-preview]');if(card===active)return;clear();if(!card||card.classList.contains('recent-landscape')||!root.contains(card))return;
  let item;try{item=JSON.parse(card.dataset.preview);}catch{return;}
  active=card;const image=card.querySelector('img');original=image?.src;
  card.classList.add('genre-expanded');
  const summary=doc.createElement('span');summary.className='genre-card-summary';summary.innerHTML=`<span class="metadata">${item.type==='tv'?'Series':'Movie'}${item.year?' · '+esc(item.year):''}${item.rating?' · ★ '+esc(item.rating):''}</span><span class="genre-card-overview">${esc(item.overview||'Open this title to explore more.')}</span>`;card.append(summary);


 };
 root.addEventListener('focusin',focus);return ()=>{root.removeEventListener('focusin',focus);clear();};
}
