import {shelfDefinition} from '../config/genreShelves.js';
import {genres} from '../config/genres.js';
import {tmdb} from '../services/tmdb.js';
import {card,escapeHtml as esc} from '../components/ui.js';

export async function GenreGridPage(slug,type,sort,state){
 const genre=genres.find(value=>value.slug===slug);
 if(!genre||!['movie','tv'].includes(type)||genre[type]===null||!shelfDefinition(genre,type,sort))throw new Error('Unknown shelf');
 const definition=shelfDefinition(genre,type,sort);
 if(!state.grid){const page=await tmdb.genreShelf(type,genre[type],genre.name,{...definition,page:1});state.grid={...page,page:1};}
 const title=definition.label+' · '+genre.name+' '+(type==='movie'?'Movies':'Series');
 return `<section class="genre-grid-page"><div class="page-heading"><p class="eyebrow">EXPLORE ${esc(genre.name.toUpperCase())}</p><h1>${esc(title)}</h1><button data-focus="grid-back" data-back>← Back to shelves</button></div><div class="genre-grid results" id="genre-grid">${state.grid.items.map(card).join('')}</div><div class="grid-loading"><p id="grid-status" role="status"></p><button id="grid-load" data-focus="grid-load" ${state.grid.hasMore?'':'hidden'}>Load more titles</button></div>${state.grid.items.length?'':'<p class="genre-message subtle">No titles available yet.</p>'}</section>`;
}

export function mountGenreGrid(root,slug,type,sort,state,win=window,service=tmdb){
 const genre=genres.find(value=>value.slug===slug),grid=root.querySelector('#genre-grid'),button=root.querySelector('#grid-load'),status=root.querySelector('#grid-status');
 if(!grid||!button)return ()=>{};
 let disposed=false,busy=false,failed=false;
 const load=async()=>{
  if(disposed||busy||!state.grid.hasMore)return;
  busy=true;failed=false;button.disabled=true;status.textContent='Loading more titles…';
  try{
   const next=await service.genreShelf(type,genre[type],genre.name,{...shelfDefinition(genre,type,sort),page:state.grid.page+1});if(disposed)return;
   const seen=new Set(state.grid.items.map(item=>item.id));const added=next.items.filter(item=>!seen.has(item.id)&&seen.add(item.id));
   state.grid.items.push(...added);state.grid.page++;state.grid.hasMore=next.hasMore;
   grid.insertAdjacentHTML('beforeend',added.map(card).join(''));
   const fromButton=root.ownerDocument.activeElement===button;
   status.textContent=next.hasMore?'':'You’ve reached the end.';button.hidden=!next.hasMore;button.textContent='Load more titles';
   // Explicit loading continues directly into the newly appended titles.
   if(fromButton){const target=added[0]&&grid.querySelector(`[data-focus="${type}-${added[0].id}"]`);target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest'});}
  }catch{if(!disposed){failed=true;status.textContent='Could not load more titles. Try again.';button.textContent='Try again';}}
  finally{busy=false;if(!disposed)button.disabled=false;}
 };
 const focus=event=>{const tile=event.target.closest?.('.card');if(!tile||!grid.contains(tile)||failed)return;const cards=[...grid.querySelectorAll('.card')];if(cards.indexOf(tile)>=cards.length-6)load();};
 const scroll=()=>{if(!failed&&grid.getBoundingClientRect().bottom<win.innerHeight+250)load();};
 root.addEventListener('focusin',focus);button.addEventListener('click',load);win.addEventListener('scroll',scroll,{passive:true});
 return ()=>{disposed=true;root.removeEventListener('focusin',focus);button.removeEventListener('click',load);win.removeEventListener('scroll',scroll);};
}
