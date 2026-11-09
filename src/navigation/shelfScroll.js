export function scrollShelfIntoView(card,{sameShelf=false,previous,doc=globalThis.document,win=globalThis.window}={}){
 if(card.classList?.contains('live-channel-card')||card.classList?.contains('sports-card')){const bar=doc?.querySelector?.('.live-browse-bar,.sports-bar'),bounds=card.getBoundingClientRect();const inset=Math.max(0,bar?.getBoundingClientRect().bottom||0)+16;if(bounds.top<inset)win?.scrollBy(0,bounds.top-inset);else if(bounds.bottom>(win?.innerHeight||1080)-16)win?.scrollBy(0,bounds.bottom-(win?.innerHeight||1080)+16);return;}
 const sports=card.closest?.('.sports-detail-v2');if(sports?.querySelector&&card.closest?.('.sports-event-actions')){if(previous?.closest?.('.sports-server-grid'))win?.scrollBy(0,sports.querySelector('.sports-event-hero').getBoundingClientRect().top-24);return;}
 const title=card.closest?.('.details');
 if(title&&card.closest?.('[data-title-actions]')){
  if(previous?.closest?.('.details')!==title)win?.scrollBy(0,title.getBoundingClientRect().top-24);
  return;
 }
 if(card.matches?.('.hero[data-focus]')){const context=doc?.querySelector?.('.genre-context');const inset=(context?.getBoundingClientRect().height||0)+24;const top=card.getBoundingClientRect().top;win?.scrollBy(0,top-inset);return;}
 const row=card.closest?.('.media-row'),section=row?.closest?.('.media-section');
 const tile=card.closest?.('.recent-item')||card;
 if(!row||!section||!card.getBoundingClientRect){tile.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'auto'});return;}
 const bounds=row.getBoundingClientRect(),rect=card.getBoundingClientRect();
 if(rect.left<bounds.left+24)row.scrollLeft-=bounds.left+24-rect.left;
 else if(rect.right>bounds.right-24)row.scrollLeft+=rect.right-(bounds.right-24);
 if(sameShelf)return;
 if(section.id==='collection-titles'){win?.scrollBy(0,section.getBoundingClientRect().top-24);return;}
 const heading=section.querySelector('h2'),preview=doc?.querySelector?.('.browse-preview:not([hidden])');
 const context=doc?.querySelector?.('.genre-context');
 const inset=Math.max(preview?.getBoundingClientRect().bottom||0,context?.getBoundingClientRect().bottom||0)+24,top=(heading||section).getBoundingClientRect().top,bottom=tile.getBoundingClientRect().bottom;
 const height=win?.innerHeight||1080;
 if(top<inset)win.scrollBy(0,top-inset);
 else if(bottom>height-24){const distance=Math.min(bottom-height+24,top-inset);if(distance>0)win.scrollBy(0,distance);}
}

