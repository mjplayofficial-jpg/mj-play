export function titleDestination(root,current,direction){
 const picker=current.closest?.('.season-picker[open]');
 if(picker&&(direction==='up'||direction==='down')){const summary=picker.querySelector('summary'),options=[...picker.querySelectorAll('button[data-season-route]')];if(current===summary&&direction==='down')return options[0]||summary;const index=options.indexOf(current);if(index>=0)return direction==='up'?(options[index-1]||summary):(options[index+1]||current);}
 const actions=root.querySelector?.('[data-title-actions]');if(!actions?.querySelector)return undefined;
 const play=actions.querySelector('[data-play]:not([disabled])')||actions.querySelector('[data-focus]:not([disabled])');
 const home=root.querySelector('[data-focus="nav-Home"]');
 if(current.closest('header nav')&&direction==='down')return play;
 const buttons=()=>[...actions.querySelectorAll?.('[data-focus]:not([disabled])')||[]].filter(b=>!b.hidden&&b.getBoundingClientRect?.().height>0);
 const rect=b=>{const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,height:r.height};};
 if(actions.contains(current)){
  if(current.getBoundingClientRect){const here=rect(current),horizontal=direction==='left'||direction==='right',sign=direction==='up'||direction==='left'?-1:1;
   let candidates=buttons().filter(b=>b!==current).map(b=>({b,r:rect(b)})).filter(({r})=>horizontal?Math.abs(r.y-here.y)<here.height*.5&&(r.x-here.x)*sign>5:(r.y-here.y)*sign>here.height*.55);
   if(horizontal){candidates.sort((a,b)=>Math.abs(a.r.x-here.x)-Math.abs(b.r.x-here.x));return candidates[0]?.b||null;}
   if(candidates.length){if(direction==='up'&&['detail-save','detail-remove-recent'].includes(current.dataset?.focus))return play;const distance=Math.min(...candidates.map(({r})=>Math.abs(r.y-here.y)));candidates=candidates.filter(({r})=>Math.abs(r.y-here.y)<=distance+here.height*.4);candidates.sort((a,b)=>Math.abs(a.r.x-here.x)-Math.abs(b.r.x-here.x));return candidates[0].b;}
  }
  if(direction==='up')return home;if(direction==='down')return root.querySelector('.season-selector [data-focus].selected')||root.querySelector('#collection-titles:not([hidden]) [data-focus]')||root.querySelector('#related-titles [data-focus]')||null;
 }
 if(current.closest('#collection-titles')&&direction==='up')return play;
 if(current.closest('#related-titles')&&direction==='up'){const episodes=[...root.querySelectorAll?.('.episodes [data-focus]')||[]];return episodes.find(e=>e.dataset.focus===root.dataset?.lastEpisodeFocus)||episodes[episodes.length-1]||root.querySelector('#collection-titles:not([hidden]) [data-focus]')||play;}
 if(current.closest('.episodes')&&root.dataset)root.dataset.lastEpisodeFocus=current.dataset.focus;
 if(current.closest('.season-selector')&&direction==='up'){const items=buttons();if(items.length){const y=Math.max(...items.map(b=>rect(b).y));return items.find(b=>Math.abs(rect(b).y-y)<10)||play;}return play;}
 return undefined;
}

