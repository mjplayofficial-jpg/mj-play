import {protectedStorage} from '../storage/protectedStorage.js';
export const liveCategories=[['popular','Popular'],['news','News'],['sports','Sports'],['entertainment','Entertainment'],['movies','Movies'],['kids','Kids'],['educational','Documentary'],['music','Music']];
const foreign=/^(?:iran(?:ian)?|hebrew|israel|german|italian|indian|france|french|algeria|arabic|spanish|bengali|urdu|portuguese|greek|scandinavian|slavic|russian|serbia|slovakia|czech|brazil|balkan|romania|turkish|croatia|bulgaria|poland|chile|sweden|belgium)(?:_|$)/i;
export function channelFromPost(post){
 const labels=(post.category||[]).map(c=>c.term.toLowerCase());
 if(!labels.includes('_tv_search')||labels.some(l=>foreign.test(l)))return null;
 const categories=liveCategories.map(([id])=>id).filter(id=>labels.includes(id));if(!categories.length)return null;
 const match=post.content?.$t?.match(/<script\b[^>]*\bid=["']__STR34M_X_D4T4__["'][^>]*>([\s\S]*?)<\/script>/i);if(!match)return null;
 let data;try{data=JSON.parse(match[1]);}catch{return null;}
 if(data.module!=='MUB'||data.is_live!==true)return null;
 let number;for(const s of data.servers||[]){if(s.fb_id!=='WS_DDL')continue;try{const u=new URL(s.url),id=u.pathname.match(/\/stream-(\d+)\.php$/)?.[1]||u.searchParams.get('id');if(/^[1-9]\d{0,5}$/.test(id)){number=Number(id);break;}}catch{}}
 if(!number)return null;
 let logo='';try{const u=new URL(data.thumb);if(['https:','http:'].includes(u.protocol))logo=u.href;}catch{}
 return {number,title:String(data.title||post.title?.$t||'Channel '+number).trim(),logo,categories,labels,explicitNumber:Number(post.title?.$t?.match(/CH\s*[-:]\s*(\d+)/i)?.[1])===number};
}
export function buildLiveCatalogue(posts){
 const channels=new Map();for(const post of posts){const c=channelFromPost(post);if(!c)continue;const old=channels.get(c.number);if(old&&old.title===c.title)old.categories=[...new Set([...old.categories,...c.categories])];else if(!old||c.explicitNumber&&!old.explicitNumber)channels.set(c.number,c);}
 return [...channels.values()].map(({explicitNumber,...c})=>c).sort((a,b)=>a.title.localeCompare(b.title,'en'));
}
export function liveFavourites(storage=protectedStorage){try{const value=JSON.parse(storage.getItem('mj-live-favourites')||'[]');return new Set(Array.isArray(value)?value.filter(n=>Number.isSafeInteger(n)&&n>0):[]);}catch{return new Set();}}
export function toggleLiveFavourite(number,storage=protectedStorage){const values=liveFavourites(storage);if(values.has(number))values.delete(number);else values.add(number);try{storage.setItem('mj-live-favourites',JSON.stringify([...values]));}catch{}return values.has(number);}
