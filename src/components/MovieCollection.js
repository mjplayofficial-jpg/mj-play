import {row,escapeHtml as esc} from './ui.js';
import {progressStore} from '../storage/progress.js';
import {playbackProvider} from '../config/playback.js';
import {playbackState} from './progressState.js';
export function collectionRow(collection,currentId){
 return row('In this collection · '+collection.name,collection.items).replace(/<button class="card"([\s\S]*?)<\/button>/g,(html,attributes)=>{
  const id=Number(attributes.match(/data-route="\/movie\/(\d+)"/)?.[1]),item=collection.items.find(i=>i.id===id);if(!item)return html;
  const value=progressStore.latest(playbackProvider.capabilities.name,item),{watched,percent}=playbackState(value,'movie');
  if(id===Number(currentId))html=html.replace('class="card"','class="card collection-current" aria-current="true"');
  const label=id===Number(currentId)?'Current movie':watched?'Watched':percent>0?Math.ceil((value.duration-value.position)/60)+' min left':'';
  return html.replace('</button>',`${value?'<span class="collection-progress" role="progressbar" aria-label="Movie progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(percent)+'"><span style="width:'+percent+'%"></span></span>':''}${label?'<span class="collection-note">'+esc(label)+'</span>':''}</button>`);
 });
}
export function mountMovieCollection(root,type,id,service){
 const section=root.querySelector('#collection-titles');if(type!=='movie'||!section)return ()=>{};let disposed=false;
 void service.details(type,id).then(item=>item.collection?.id?service.collection(item.collection.id):null).then(collection=>{if(disposed||!collection?.items.length)return;section.innerHTML=collectionRow(collection,id).replace(/^<section[^>]*>/,'').replace(/<\/section>$/,'');section.hidden=false;}).catch(()=>{});
 return ()=>{disposed=true;};
}
