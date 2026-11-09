import {genres} from '../config/genres.js';
import {escapeHtml as esc} from './ui.js';
export function genreRow(selected='',type){return `<section class="genre-section" aria-label="Browse by genre"><div class="genre-row" data-focus-row>${genres.filter(genre=>!type||genre[type]!==null).map(genre=>`<button class="genre-tile genre-${genre.slug}${selected===genre.slug?' selected':''}" data-focus="genre-${genre.slug}" data-route="/genre/${genre.slug}" aria-pressed="${selected===genre.slug}">${esc(genre.name)}</button>`).join('')}</div></section>`;}
