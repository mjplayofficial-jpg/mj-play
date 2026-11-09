import {library} from '../storage/library.js';
import {card} from '../components/ui.js';
export function MyListPage(){const items=library.favorites();return `<section class="search-page"><p class="eyebrow">YOUR COLLECTION</p><h1>My List</h1><p class="subtle">Saved on this TV. Add or remove titles from their details page.</p>${items.length?`<div class="results">${items.map(card).join('')}</div>`:'<p>No saved titles yet.</p><button data-focus="list-browse" data-route="/">Browse titles</button>'}</section>`;}
