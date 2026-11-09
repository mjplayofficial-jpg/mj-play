export function sportsDestination(root,current,direction){
 const detail=root.querySelector('.sports-detail-v2');if(!detail?.querySelector)return undefined;
 const primary=detail.querySelector('[data-focus="sports-watch-primary"]'),nav=root.querySelector('[data-focus="nav-Sports"]');
 if(current?.closest?.('header')&&direction==='down')return primary;
 const grid=current?.closest?.('.sports-server-grid');if(grid){const items=[...grid.querySelectorAll('[data-sports-watch]')],i=items.indexOf(current);if(i<0)return undefined;
  if(direction==='up')return i<3?primary:items[i-3];
  if(direction==='down')return items[i+3]||null;
  if(direction==='left')return i%3?items[i-1]:null;
  if(direction==='right')return i%3<2?items[i+1]||null:null;
 }
 if(current?.closest?.('.sports-event-actions')){if(direction==='up')return nav;if(direction==='down')return detail.querySelector('.sports-server-grid button');}
 return undefined;
}
