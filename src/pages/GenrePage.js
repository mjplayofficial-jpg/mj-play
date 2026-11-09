import {featuredPanel} from '../components/Featured.js';
import {genres} from '../config/genres.js';
import {tmdb} from '../services/tmdb.js';
import {row,artwork,escapeHtml as esc} from '../components/ui.js';
import {shelfDefinitions,uniqueShelfItems} from '../config/genreShelves.js';
export async function GenrePage(slug,state={}){
 const genre=genres.find(value=>value.slug===slug);if(!genre)throw new Error('Unknown genre');
 const filter=['movie','tv'].includes(state.genreFilter)&&genre[state.genreFilter]!==null?state.genreFilter:'all';
 const types=['movie','tv'].filter(type=>genre[type]!==null&&(filter==='all'||filter===type));
 const shelves=shelfDefinitions(genre,types[0]).map((value,i)=>{const type=types.includes(value.preferredType)?value.preferredType:types[i%types.length],definition=shelfDefinitions(genre,type)[i];return {...definition,type,title:definition.label+' · '+(type==='movie'?'Movies':'Series')};});
 const results=await Promise.allSettled(shelves.map(shelf=>tmdb.genreShelf(shelf.type,genre[shelf.type],genre.name,{...shelf,page:1})));
 if(results.every(result=>result.status==='rejected'))throw new Error('Genre catalogue unavailable');
 const featured=results.find(result=>result.status==='fulfilled'&&result.value.items.length)?.value.items[0];
 const seen=new Set(featured?[featured.type+'/'+featured.id]:[]);
 const filters=[['all','All'],...typesForGenre(genre)];
 return `<div class="genre-cinema"><div class="genre-context"><h1>${esc(genre.name)}</h1></div><div class="genre-filters" data-focus-row aria-label="Title type">${filters.map(([id,label])=>`<button class="${id===filter?'selected':''}" data-focus="genre-filter-${id}" data-genre-filter="${id}" aria-pressed="${id===filter}">${label}</button>`).join('')}</div>${featured?featuredPanel(featured,{focus:'genre-play',genre:true}):''}<div class="rows">${results.map((result,i)=>{
  const shelf=shelves[i];
  if(result.status==='rejected')return `<section class="media-section"><h2>${esc(shelf.title)}</h2><p class="genre-message subtle">This shelf could not load.</p><button class="genre-retry" data-focus="genre-retry-${shelf.key}" data-retry>Try Again</button></section>`;
  const items=uniqueShelfItems(result.value.items,seen);
  if(!items.length)return '';
  const preview=items.slice(0,10);
  const tile=`<button class="card see-all-card" data-focus="genre-see-all-${shelf.key}" data-route="/genre/${genre.slug}/${shelf.type}/${shelf.key}" aria-label="See all ${esc(shelf.title)}"><span class="see-all-icon">→</span><strong>See all</strong><span>${esc(shelf.title)}</span></button>`;
  return row(shelf.title,preview.map(item=>({...item,poster:item.backdrop||item.poster}))).replace('</div></section>',tile+'</div></section>');
 }).join('')}${!featured?'<p class="genre-message subtle">No titles available in this genre yet.</p>':''}</div></div>`;
}
function typesForGenre(genre){return [['movie','Movies'],['tv','Series']].filter(([type])=>genre[type]!==null);}
