const cache=new Map();
// Community markers are hints, not frame analysis. Reject implausible or mismatched cuts.
export function validateCredits(data,item,duration,source,season,episode){
 if(!Number.isFinite(duration)||duration<300)return null;
 if(source==='IntroDB'){
  if(data.imdb_id!==item.imdbId||data.media_type!==item.type)return null;
 }else if(Number(data.tmdb_id)!==Number(item.tmdbId??item.id)||data.type!==item.type)return null;
 if(item.type==='tv'&&(Number(data.season)!==Number(season)||Number(data.episode)!==Number(episode)))return null;
 const segments=source==='IntroDB'?[data.outro]:data.credits;
 if(!Array.isArray(segments))return null;
 const post=data.post_credits;
 const hasPostCredits=!!post||(source==='TheIntroDB'&&segments.length>1);
 for(const segment of segments.filter(Boolean).sort((a,b)=>a.start_ms-b.start_ms)){
  const start=segment.start_ms/1000,end=segment.end_ms==null?null:segment.end_ms/1000;
  if(!Number.isFinite(start)||start<duration*.75||start>=duration-5||duration-start>(item.type==='tv'?240:1200))continue;
  if(end!==null&&(!Number.isFinite(end)||end<=start||end>duration+20))continue;
  // Explicit end timestamps let us reject editions whose runtime does not match.
  const finalEnd=post?post.end_ms/1000:end;
  if(finalEnd!==null&&(!Number.isFinite(finalEnd)||Math.abs(finalEnd-duration)>20))continue;
  if(source==='IntroDB'&&(!Number.isFinite(segment.confidence)||segment.confidence<.8))continue;
  const result={start,source,hasPostCredits};
  if(post)result.postCreditsEnd=post.end_ms/1000;
  else if(hasPostCredits){const last=segments[segments.length-1],after=last?.start_ms/1000;if(Number.isFinite(after)&&after>start&&after<duration)result.postCreditsEnd=after;}
  return result;
 }
 return null;
}
export async function fetchCredits(item,season,episode,duration,{signal,fetcher=fetch}={}){
 if(!['movie','tv'].includes(item?.type)||!Number.isFinite(duration)||duration<300)return null;
 const id=Number(item.tmdbId??item.id);if(!Number.isSafeInteger(id)||id<=0)return null;
 if(item.type==='tv'&&(!Number.isSafeInteger(season)||season<1||!Number.isSafeInteger(episode)||episode<1))return null;
 const key=[item.type,id,item.imdbId,season,episode,Math.round(duration)].join('/'),cached=cache.get(key);
 if(cached&&cached.expires>Date.now())return cached.value;
 const params=new URLSearchParams(item.type==='tv'?{season,episode}:{});
 const sources=[];
 if(/^tt\d+$/.test(item.imdbId||'')){const p=new URLSearchParams(params);p.set('imdb_id',item.imdbId);if(item.type==='movie')p.set('is_movie','true');sources.push(['IntroDB','https://api.introdb.app/segments?'+p]);}
 const p=new URLSearchParams(params);p.set('tmdb_id',id);p.set('duration_ms',Math.round(duration*1000));sources.push(['TheIntroDB','https://api.theintrodb.org/v3/media?'+p]);
 let value=null;
 for(const [source,url] of sources){if(signal?.aborted)return null;const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,5000);
  try{const response=await fetcher(url,{signal:controller.signal});if(response.ok){value=validateCredits(await response.json(),item,duration,source,season,episode);if(value)break;}}catch{}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 }
 // Never cache an empty lookup: transient network failures must not suppress credits all session.
 if(value&&!signal?.aborted){if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(key,{value,expires:Date.now()+86400000});}return value;
}
