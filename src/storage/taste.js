import {protectedStorage as storage} from './protectedStorage.js';
const key='mjplay.taste.v1';
export function taste(){try{const value=JSON.parse(storage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
export function rateTitle(type,id,value){if(!['like','dislike'].includes(value))return;const ratings=taste(),key=type+'/'+id;if(!['movie','tv'].includes(type)||!/^\d+$/.test(String(id)))return;const next=ratings[key]?.value===value?null:{value,updatedAt:Date.now()};if(next)ratings[key]=next;else delete ratings[key];storage.setItem('mjplay.taste.v1',JSON.stringify(Object.fromEntries(Object.entries(ratings).sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0)).slice(0,200))));}
