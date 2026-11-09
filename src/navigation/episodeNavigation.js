export function episodeDestination(current,items,direction){
 const r=current.getBoundingClientRect(),cx=r.left+r.width/2;
 if(direction==='left'||direction==='right'){
  const row=items.filter(el=>Math.abs(el.getBoundingClientRect().top-r.top)<10).sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left);
  return row[row.indexOf(current)+(direction==='right'?1:-1)];
 }
 const candidates=items.filter(el=>direction==='up'?el.getBoundingClientRect().top<r.top-10:el.getBoundingClientRect().top>r.top+10);
 candidates.sort((a,b)=>{const score=el=>{const b=el.getBoundingClientRect();return Math.abs(b.top-r.top)*10000+Math.abs(b.left+b.width/2-cx);};return score(a)-score(b);});
 return candidates[0];
}
