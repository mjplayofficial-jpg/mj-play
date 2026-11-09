import {taste,rateTitle} from '../storage/taste.js';
import {tmdb} from '../services/tmdb.js';
import {mountTrailer} from './TrailerPlayer.js';
import {mountWatchedAction} from './LibraryActions.js';

export function trailerUrl(key){if(typeof key!=='string'||!/^[-\w]{11}$/.test(key))throw new Error('Invalid trailer');return 'https://www.youtube.com/watch?v='+key;}

export function mountTitleExtras(root,type,id,service=tmdb,launch=key=>mountTrailer(root,key)){
 const buttons=[...root.querySelectorAll('[data-taste]')],paint=()=>{const value=taste()[type+'/'+id]?.value;buttons.forEach(b=>b.setAttribute('aria-pressed',String(value===b.dataset.taste)));};buttons.forEach(b=>b.onclick=()=>{rateTitle(type,id,b.dataset.taste);paint();});paint();
 const stopWatched=mountWatchedAction(root,type,id,service);
 let disposed=false,closeTrailer;
 const title=root.querySelector('.detail-copy h1');
 service.titleLogo(type,id).then(path=>{
  if(disposed||!path||!title)return;
  const image=root.ownerDocument.createElement('img');image.className='detail-title-logo';image.alt=title.textContent;image.src='https://image.tmdb.org/t/p/w500'+path;
  image.onload=()=>{if(!disposed)title.classList.add('title-text-hidden');};image.onerror=()=>{title.classList.remove('title-text-hidden');image.remove();};title.before(image);
 }).catch(()=>{});
 const button=root.querySelector('#detail-trailer'),note=root.querySelector('#trailer-note');
 if(button)service.trailer(type,id).then(video=>{
  if(disposed||!video)return;button.hidden=false;
  note.textContent='';
  button.onclick=async()=>{button.disabled=true;try{closeTrailer?.();closeTrailer=await launch(video.key);}catch(error){if(!disposed)note.textContent=error.message+'. Try again.';}finally{if(!disposed)button.disabled=false;}};
 }).catch(()=>{});
 return ()=>{disposed=true;buttons.forEach(b=>b.onclick=null);stopWatched();closeTrailer?.();};
}

