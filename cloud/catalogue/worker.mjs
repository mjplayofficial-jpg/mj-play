// Catalogue JSON only. No media, arbitrary URL proxy, viewer state or server secrets returned.
export function cataloguePath(path) {
 return /^(?:trending\/(?:movie|tv)\/week|(?:movie|tv)\/(?:popular|top_rated|now_playing|on_the_air)|search\/(?:multi|movie|tv|person|keyword|company)|discover\/(?:movie|tv)|person\/\d+(?:\/(?:combined_credits|movie_credits|tv_credits))?|collection\/\d+)$/.test(path)||/^(movie|tv)\/\d+(?:\/(credits|external_ids|videos|recommendations|similar|season\/\d+(?:\/episode\/\d+)?))?$/.test(path);
}
const params=new Set(['query','page','language','region','sort_by','with_genres','with_keywords','with_companies','include_adult','include_video','primary_release_date.gte','primary_release_date.lte','first_air_date.gte','first_air_date.lte','vote_count.gte']);
const json=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'}});
export function createCatalogueWorker({fetcher=fetch,cache,now=Date.now}={}) {
 return {async fetch(request,env={},ctx={waitUntil:()=>{}}) {
  const url=new URL(request.url);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, HEAD, OPTIONS'}});
  if(!['GET','HEAD'].includes(request.method))return json(405,{error:'Method not allowed'});
  if(url.pathname==='/healthz')return json(200,{ok:true,service:'mjplay-catalogue',media:false});
  if(url.pathname==='/api/config')return json(200,{catalogue:!!(env.TMDB_READ_TOKEN||env.TMDB_API_KEY),media:false});
  const route=url.pathname.startsWith('/api/catalogue/')?url.pathname.slice(15):'';
  if(!cataloguePath(route))return json(404,{error:'Unknown catalogue request'});
  if(!env.TMDB_READ_TOKEN&&!env.TMDB_API_KEY)return json(503,{error:'Catalogue is not configured'});
  const upstream=new URL('https://api.themoviedb.org/3/'+route);
  if(url.search.length>2000)return json(400,{error:'Invalid query'});
  for(const [k,v]of url.searchParams) {
   if(k==='append_to_response'){
    const allowed=/^(movie|tv)\/\d+$/.test(route)?['credits','external_ids']:/^person\/\d+$/.test(route)?['combined_credits']:[];
    const fields=v.split(',');
    if(fields.length>allowed.length||new Set(fields).size!==fields.length||!fields.every(field=>allowed.includes(field)))return json(400,{error:'Invalid query'});
    upstream.searchParams.set(k,v);
    continue;
   }
   if(!params.has(k)||v.length>300)return json(400,{error:'Invalid query'});
   if(k==='page'&&(!/^\d{1,2}$/.test(v)||+v<1||+v>50))return json(400,{error:'Invalid page'});
   upstream.searchParams.set(k,v);
  }
  upstream.searchParams.set('include_adult','false'); upstream.searchParams.sort();
  const cacheKey=new Request(url.origin+'/api/catalogue/'+route+'?'+upstream.searchParams);
  const hit=await cache?.match(cacheKey); if(hit)return request.method==='HEAD'?new Response(null,{status:hit.status,headers:hit.headers}):hit;
  try {
   if(!env.TMDB_READ_TOKEN)upstream.searchParams.set('api_key',env.TMDB_API_KEY);
   const response=await fetcher(upstream,{headers:env.TMDB_READ_TOKEN?{Authorization:'Bearer '+env.TMDB_READ_TOKEN}:{},redirect:'manual',signal:AbortSignal.timeout(10000)});
   
   if(!response.ok)return json(response.status===404?404:response.status===429?429:502,{error:'Catalogue temporarily unavailable'});
   if(!(response.headers.get('content-type')||'').includes('json'))throw Error('Invalid response');
   const reader=response.body.getReader(),parts=[];let size=0;
   try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4*1024*1024)throw Error('Oversized response');parts.push(value);}}finally{await reader.cancel();}
   const body=new Uint8Array(size);let offset=0;for(const part of parts){body.set(part,offset);offset+=part.length;}
   const result=new Response(body,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'}});
   if(cache)ctx.waitUntil(cache.put(cacheKey,result.clone()).catch(()=>{}));
   return request.method==='HEAD'?new Response(null,{headers:result.headers}):result;
  }catch{return json(502,{error:'Catalogue temporarily unavailable'});}
 }};
}
export default {fetch(request,env,ctx){return createCatalogueWorker({cache:caches.default}).fetch(request,env,ctx);}};




