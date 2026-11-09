import {protectedStorage as localStorage} from './protectedStorage.js';
const key='mjplay.search.history.v1';
export function searchHistory(){try{return JSON.parse(localStorage.getItem(key)||'[]').filter(x=>typeof x==='string'&&x.length<=120).slice(0,8);}catch{return [];}}
export function rememberSearch(query){query=String(query).trim().slice(0,120);if(!query)return;try{localStorage.setItem(key,JSON.stringify([query,...searchHistory().filter(x=>x.toLowerCase()!==query.toLowerCase())].slice(0,8)));}catch{}}
export function clearSearchHistory(){try{localStorage.setItem(key,'[]');}catch{}}
