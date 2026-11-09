export function nextShelfStart(root,current,items,direction='down'){
 const blocks=Array.from(root.querySelectorAll?.('header nav, .genre-filters, .hero[data-focus], .genre-row, .media-row')||[]);
 const index=blocks.findIndex(block=>block===current||block.contains(current));if(index<0)return null;
 const candidates=direction==='up'?blocks.slice(0,index).reverse():blocks.slice(index+1);
 for(const block of candidates){
  const first=items.find(item=>item===block||block.contains(item));if(!first)continue;
  if(block.classList.contains('media-row')||block.classList.contains('genre-row'))block.scrollLeft=0;
  return first;
 }
 return null;
}
