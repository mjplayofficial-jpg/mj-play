import {mountAutoLoad} from '../components/autoLoadResults.js';
import {searchHistory,rememberSearch} from '../storage/searchHistory.js';
import {tmdb} from '../services/tmdb.js';
import {card,artwork,escapeHtml as esc} from '../components/ui.js';
import {loadMoreSearch,uniqueSearchItems} from '../components/searchResults.js';
const countLabel=data=>`${data.items.length} titles${data.hasMore?' loaded':''} for “${data.query}”`;
export async function SearchPage(state={}){
 const query=(state.query||'').trim(),filter=['movie','tv'].includes(state.filter)?state.filter:'all';let data=state.searchData;
 if(!data||data.query!==query||data.filter!==filter){const results=query?await tmdb.multiSearch(query,1):[];data={query,filter,page:1,hasMore:results.hasMore===true,items:uniqueSearchItems(results.filter(x=>filter==='all'||x.type===filter))};state.searchData=data;}
 if(query)rememberSearch(query);
 if(query&&state.actorQuery!==query){try{state.actors=await tmdb.searchActors(query);state.actorQuery=query;}catch{state.actors=[];}}
 const actors=query?(state.actors||[]):[];
 return `<section class="search-page"><div class="search-heading"><p class="eyebrow">FIND YOUR NEXT STORY</p><h1>Search</h1></div><form id="search-form" data-focus-row><div class="search-field"><button type="button" class="search-box" data-focus="search-input" data-search-edit aria-label="Search movies and TV shows">${esc(query)||'Movies, shows and actors'}</button><input hidden data-search-editor type="text" enterkeyhint="search" autocomplete="off" name="query" maxlength="120" value="${esc(query)}" placeholder="Movies, shows and actors" aria-label="Type your search"></div><button class="primary" data-focus="search-submit" type="submit">Search</button><button data-focus="search-clear" type="button" data-search-clear>Clear</button></form>
 <div class="search-filter-line"><div class="actions search-filters" data-focus-row>${[['all','All'],['movie','Movies'],['tv','Shows']].map(([value,label])=>`<button data-focus="filter-${value}" data-search-filter="${value}" class="${value===filter?'selected':''}" aria-pressed="${value===filter}">${label}</button>`).join('')}</div><p class="subtle" data-search-count aria-live="polite">${query?esc(countLabel(data)):'Search movies and TV shows'}</p></div>
 ${!query&&searchHistory().length?`<h2>Recent searches</h2><div class="actions search-history" data-focus-row>${searchHistory().map((q,i)=>`<button data-focus="recent-search-${i}" data-search-query="${esc(q)}">${esc(q)}</button>`).join('')}<button data-focus="history-clear" data-search-history-clear>Clear history</button></div>`:''}
 ${actors.length?`<section class="actor-search"><h2>Actors</h2><div class="media-row" data-focus-row>${actors.map(p=>`<button class="actor-card" data-focus="actor-${p.id}" data-route="/person/${p.id}"><img src="${esc(artwork(p.photo,'w185'))}" alt="" onerror="this.onerror=null;this.src='assets/placeholders/poster.svg'"><strong>${esc(p.name)}</strong><span class="subtle">${esc(p.knownFor)}</span></button>`).join('')}</div></section>`:''}
 ${query?'<h2 class="search-titles-heading">Movies & Shows</h2>':''}<div class="results search-results">${data.items.map(card).join('')}</div>
 ${query?`<div class="search-more"><p class="subtle" data-search-status role="status">${!data.items.length?'No matching titles loaded. Try another category or load more.':!data.hasMore?'You’ve reached the end of these results.':''}</p><div class="actions" data-focus-row><button class="primary" data-focus="search-load" data-search-load ${data.hasMore?'':'hidden'}>Load more titles</button><button data-focus="search-top" data-search-top>Back to search</button></div></div>`:'<p class="subtle">Select the search field and press OK to use your TV keyboard.</p>'}</section>`;
}
export function mountSearch(root,state={},service=tmdb){
 const form=root.querySelector('#search-form'),box=form.querySelector('[data-search-edit]'),input=form.querySelector('[data-search-editor]');let edited=false,disposed=false,busy=false;
 box.onclick=()=>{edited=false;box.hidden=true;input.hidden=false;input.focus();};input.onblur=()=>{input.hidden=true;box.hidden=false;box.textContent=input.value.trim()||'Movies, shows and actors';};
 const changed=()=>{edited=true;};const enter=e=>{if((e.key==='Enter'||e.keyCode===13)&&edited){e.preventDefault();if(form.dataset.submitting!=='true')form.requestSubmit();}};input.addEventListener('input',changed);input.addEventListener('keyup',enter);
 const load=root.querySelector('[data-search-load]'),top=root.querySelector('[data-search-top]');if(top)top.onclick=()=>{box.focus({preventScroll:true});box.scrollIntoView({block:'center',behavior:'auto'});};
 let automaticFailed=false;
 const loadResults=async(automatic=false)=>{
  if(busy||disposed||!state.searchData?.hasMore||automatic&&automaticFailed)return;busy=true;load.disabled=true;load.textContent='Loading…';load.setAttribute('aria-busy','true');const status=root.querySelector('[data-search-status]');status.textContent='Finding more titles…';
  try{const added=await loadMoreSearch(state.searchData,service);if(disposed)return;const grid=root.querySelector('.search-results'),oldCount=grid.querySelectorAll('.card').length;grid.insertAdjacentHTML('beforeend',added.map(card).join(''));root.querySelector('[data-search-count]').textContent=countLabel(state.searchData);load.hidden=automatic||!state.searchData.hasMore;status.textContent=!state.searchData.hasMore?'You’ve reached the end of these results.':!added.length?'No more matches on these pages. Try loading more or change category.':'';const next=grid.querySelectorAll('.card')[oldCount];if(!automatic&&next){next.focus({preventScroll:true});next.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});}else if(!automatic&&load.hidden)top.focus();}
  catch{automaticFailed=true;if(!disposed){load.hidden=false;status.textContent='Could not load more titles. Select Load more to retry.';}}
  finally{busy=false;if(!disposed){load.disabled=false;load.textContent='Load more titles';load.removeAttribute('aria-busy');}}
 };
 if(load)load.onclick=()=>{automaticFailed=false;return loadResults(false);};
 if(load&&state.searchData?.items.length)load.hidden=true;
 const stopAuto=mountAutoLoad(root,root.querySelector('.search-results'),()=>loadResults(true));
 return ()=>{stopAuto();disposed=true;box.onclick=null;input.onblur=null;if(load)load.onclick=null;if(top)top.onclick=null;input.removeEventListener('keyup',enter);input.removeEventListener('input',changed);};
}

