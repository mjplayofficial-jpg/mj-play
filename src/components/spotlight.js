export function chooseSpotlight(items,state={},storage=globalThis.localStorage){
 const choices=items.filter(x=>x.backdrop&&x.id).slice(0,8);if(!choices.length)return items[0]||null;
 const current=choices.find(x=>x.id===state.spotlightId);if(current)return current;
 let last;try{last=Number(storage?.getItem('mjplay.spotlight.last'));}catch{}
 const index=choices.findIndex(x=>x.id===last),selected=choices[(index+1)%choices.length];state.spotlightId=selected.id;
 try{storage?.setItem('mjplay.spotlight.last',String(selected.id));}catch{}return selected;
}
