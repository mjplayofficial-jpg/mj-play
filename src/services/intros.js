const cache=new Map();
export function validateIntro(data,item,season,episode,duration,source='IntroDB'){
 if(item?.type!=='tv'||!data||Number(data.season)!==Number(season)||Number(data.episode)!==Number(episode)||!Number.isFinite(duration))return null;
 if(source==='IntroDB'&&(data.media_type!=='tv'||data.imdb_id!==item.imdbId))return null;
 if(source==='TheIntroDB'&&(data.type!=='tv'||Number(data.tmdb_id)!==Number(item.tmdbId??item.id)))return null;
 const intro=source==='TheIntroDB'?data.intro?.[0]:data.intro;if(!intro)return null;if(source==='IntroDB'&&(intro.confidence<.8||!Number.isFinite(intro.confidence)))return null;
 const start=intro.start_ms/1000,end=intro.end_ms/1000,editionEnd=(data.post_credits?.end_ms??data.outro?.end_ms??data.duration_ms)/1000;
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end-start<5||end-start>240||start>Math.min(900,duration*.35)||end>duration*.5)return null;
 // Only use markers whose edition can be checked against the playing stream's runtime.
 if(source==='IntroDB'&&(!Number.isFinite(editionEnd)||Math.abs(editionEnd-duration)>20))return null;
 if(source==='TheIntroDB'&&Number.isFinite(data.video_duration_ms)&&Math.abs(data.video_duration_ms/1000-duration)>20)return null;
 return {start,end,source};
}
export async function fetchIntro(item,season,episode,duration,{signal,fetcher=fetch}={}){
 if(item?.type!=='tv'||!/^tt\d+$/.test(item.imdbId||'')||!Number.isSafeInteger(season)||season<1||!Number.isSafeInteger(episode)||episode<1||!Number.isFinite(duration)||duration<300)return null;
 const key=[item.imdbId,season,episode,Math.round(duration)].join('/');if(cache.has(key))return cache.get(key);
 const sources=[['IntroDB','https://api.introdb.app/segments?'+new URLSearchParams({imdb_id:item.imdbId,season,episode})]];const tmdb=Number(item.tmdbId??item.id);if(Number.isSafeInteger(tmdb)&&tmdb>0)sources.push(['TheIntroDB','https://api.theintrodb.org/v3/media?'+new URLSearchParams({tmdb_id:tmdb,season,episode,duration_ms:Math.round(duration*1000)})]);
 for(const [source,url] of sources){if(signal?.aborted)return null;const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,5000);signal?.addEventListener('abort',abort,{once:true});try{const r=await fetcher(url,{signal:controller.signal});if(!r.ok)continue;const marker=validateIntro(await r.json(),item,season,episode,duration,source);if(marker){if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(key,marker);return marker;}}catch{}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}}return null;
}
