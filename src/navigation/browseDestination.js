// Adjacent browse sections have explicit vertical paths; avoid measuring every card.
export function browseDestination(root,current,direction){
 if(!['up','down'].includes(direction)||!current?.closest)return undefined;
 const blocks=[...root.querySelectorAll?.('header nav, .genre-filters, .hero[data-focus], .genre-row, .media-row')||[]],index=blocks.findIndex(b=>b===current||b.contains(current));if(index<0)return undefined;
 for(const block of direction==='up'?blocks.slice(0,index).reverse():blocks.slice(index+1)){
  const candidates=block.matches?.('[data-focus]')?[block]:[...block.querySelectorAll?.('[data-focus]')||[]];
  const target=candidates.find(e=>!e.disabled&&!e.hidden&&e.getClientRects().length);if(!target)continue;
  if(block.classList?.contains('media-row')||block.classList?.contains('genre-row'))block.scrollLeft=0;
  return target;
 }
 return null;
}
