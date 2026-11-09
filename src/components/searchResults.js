export function uniqueSearchItems(items){const seen=new Set();return items.filter(item=>{const key=item.type+'/'+item.id;if(seen.has(key))return false;seen.add(key);return true;});}
export async function loadMoreSearch(data,service){
 let page=data.page,hasMore=data.hasMore,added=[];const existing=new Set(data.items.map(x=>x.type+'/'+x.id));
 for(let i=0;i<3&&hasMore&&page<500&&!added.length;i++){
  const results=await service.multiSearch(data.query,page+1);page++;hasMore=results.hasMore===true;
  added=uniqueSearchItems(results.filter(x=>(data.filter==='all'||x.type===data.filter)&&!existing.has(x.type+'/'+x.id)));
 }
 data.page=page;data.hasMore=hasMore;data.items.push(...added);return added;
}
