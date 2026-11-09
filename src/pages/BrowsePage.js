import {tmdb} from '../services/tmdb.js';
import {row} from '../components/ui.js';
import {genreRow} from '../components/genreRow.js';
export async function BrowsePage(type){const kinds=[['Trending this week','trending'],['Popular right now','popular'],['Critically acclaimed','top_rated']];const data=await Promise.all(kinds.map(x=>tmdb.list(x[1],type)));return `<div class="genre-cinema catalogue-cinema"><div class="page-heading"><p class="eyebrow">MJ PLAY</p><h1>${type==='movie'?'Movies':'Shows'}</h1><p class="subtle">Discover something worth staying in for.</p></div>${genreRow('',type)}<div class="rows">${data.map((x,i)=>row(kinds[i][0],x.map(item=>({...item,poster:item.backdrop||item.poster})))).join('')}</div>`;}



