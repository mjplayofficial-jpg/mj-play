import {protectedStorage} from '../storage/protectedStorage.js';
const endpoint='https://api.opensubtitles.com/api/v1/';
export const subtitleKey='mjplay.opensubtitles.key.v1';
export function subtitleIdentity(item,season,episode){return `${item.type}/${item.tmdbId??item.id}${item.type==='tv'?`/${season}/${episode}`:''}`;}
export function subtitleEdition(item,season,episode,duration){return subtitleIdentity(item,season,episode)+'/'+(Number.isFinite(duration)?Math.round(duration):'unknown');}
export function releaseKind(release){return /web[ ._-]?(dl|rip)?|webrip/i.test(release||'')?'WEB':/blu[ ._-]?ray|bdrip/i.test(release||'')?'Blu-ray':/dvd/i.test(release||'')?'DVD':'Other';}
const releaseScore=a=>({WEB:3,Other:2,'Blu-ray':1,DVD:0})[releaseKind(a.release)];
export function subtitleSearch(item,season,episode){
 const query=new URLSearchParams({languages:'en'}),imdb=String(item.imdbId||'').replace(/^tt/,'');
 const id=Number(item.tmdbId??item.id);
 if(item.type==='tv'){
  if(![season,episode].every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid subtitle episode.');
  query.set('season_number',season);query.set('episode_number',episode);
  if(/^\d+$/.test(imdb))query.set('parent_imdb_id',imdb);else if(Number.isSafeInteger(id)&&id>0)query.set('parent_tmdb_id',id);else throw Error('Title identifier missing.');
 }else if(item.type==='movie'){
  if(/^\d+$/.test(imdb))query.set('imdb_id',imdb);else if(Number.isSafeInteger(id)&&id>0)query.set('tmdb_id',id);else throw Error('Title identifier missing.');
 }else throw Error('Unsupported subtitle title.');
 query.sort();return query.toString();
}
export function rankEnglish(rows,item,season,episode){
 return rows.map(r=>r.attributes).filter(a=>{
  if(!a||a.language!=='en'||a.foreign_parts_only||a.machine_translated||a.ai_translated||!a.files?.[0]?.file_id)return false;
  const f=a.feature_details||{};
  if(item.type==='tv')return Number(f.season_number)===season&&Number(f.episode_number)===episode&&(item.imdbId?String(f.parent_imdb_id)===item.imdbId.replace(/^tt/,''):Number(f.parent_tmdb_id)===Number(item.tmdbId??item.id));
  return f.feature_type==='Movie'&&(item.imdbId?String(f.imdb_id)===item.imdbId.replace(/^tt/,''):Number(f.tmdb_id)===Number(item.tmdbId??item.id));
 }).sort((a,b)=>releaseScore(b)-releaseScore(a)||Number(!!b.from_trusted)-Number(!!a.from_trusted)||Number(!!a.hearing_impaired)-Number(!!b.hearing_impaired)||(Number(b.download_count)||0)-(Number(a.download_count)||0));
}
const stamp=value=>{const parts=value.replace(',','.').split(':').map(Number);return parts.length===3?parts[0]*3600+parts[1]*60+parts[2]:parts[0]*60+parts[1];};
export function parseSubtitle(text){
 if(typeof text!=='string'||text.length>800000)throw Error('Subtitle file is too large.');
 const cues=[];
 for(const block of text.replace(/^\uFEFF/,'').replace(/\r/g,'').split(/\n\s*\n/)){
  const lines=block.split('\n'),i=lines.findIndex(line=>line.includes('-->'));if(i<0)continue;
  const match=lines[i].match(/^\s*((?:\d+:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d+:)?\d{2}:\d{2}[.,]\d{3})/);if(!match)continue;
  const start=stamp(match[1]),end=stamp(match[2]);
  const body=lines.slice(i+1).join('\n').replace(/<[^>]*>/g,'').replace(/\{\\[^}]*\}/g,'').replace(/&(amp|lt|gt|quot|apos|nbsp);/g,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[n]).trim().slice(0,1500);
  if(Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&end>start&&end<=604800&&body)cues.push({start,end,text:body});
 }
 if(!cues.length)throw Error('Subtitle file has no readable captions.');
 return cues.sort((a,b)=>a.start-b.start);
}
export function captionAt(cues,time){
 let lo=0,hi=cues.length;while(lo<hi){const mid=(lo+hi)>>1;if(cues[mid].start<=time)lo=mid+1;else hi=mid;}
 return cues.slice(Math.max(0,lo-20),lo).filter(c=>c.end>time).map(c=>c.text).slice(-3).join('\n');
}
export async function fetchEnglishSubtitle(item,season,episode,{signal,alternate=false,duration,storage=protectedStorage,fetcher=globalThis.fetch}={}){
 if(!alternate){const stream=globalThis.__mjProviderEnglish?.[subtitleIdentity(item,season,episode)];if(stream&&stream.expiresAt>Date.now()){const result=await stream.promise;if(signal?.aborted)throw new DOMException('Cancelled','AbortError');if(result)return result;}}
 const identity=subtitleEdition(item,season,episode,duration),cacheKey='mjplay.subtitles.cache.v2';let cache=[];
 try{const saved=JSON.parse(storage.getItem(cacheKey)||'[]');if(Array.isArray(saved))cache=saved.filter(r=>typeof r.text==='string'&&r.text.length<=800000);}catch{}
 const previous=cache.find(r=>r.identity===identity);
 if(previous&&!alternate)return {cues:parseSubtitle(previous.text),release:previous.release,fileId:previous.fileId,cached:true};
 const key=storage?.getItem(subtitleKey);if(!key)throw Error('OpenSubtitles API key is not configured on this TV.');
 const api=async(path,body)=>{
  const response=await fetcher(endpoint+path,{signal,method:body?'POST':'GET',headers:{'Api-Key':key,'X-User-Agent':'MJPlay v1.1.51',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok)throw Error(response.status===429||response.status===406?'Subtitle download limit reached. Try again later.':`Subtitle service unavailable (${response.status}).`);
  return response.json();
 };
 const results=await api('subtitles?'+subtitleSearch(item,season,episode));
 const candidates=rankEnglish(results.data||[],item,season,episode),candidate=alternate?candidates.find(a=>![...(previous?.tried||[]),previous?.fileId].includes(a.files[0].file_id)):candidates[0];
 if(!candidate)throw Error(alternate?'No other English subtitle available.':'No English subtitle found for this title.');
 const fileId=candidate.files[0].file_id,download=await api('download',{file_id:fileId,sub_format:'srt'}),url=new URL(download.link);
 if(url.protocol!=='https:'||url.username||url.password||!/(^|\.)(opensubtitles\.com|osdb\.link)$/.test(url.hostname))throw Error('Invalid subtitle download address.');
 const response=await fetcher(url.href,{signal});if(!response.ok)throw Error('Subtitle download failed.');
 if(Number(response.headers.get('content-length'))>800000)throw Error('Subtitle file is too large.');
 const text=await response.text(),cues=parseSubtitle(text);
 cache=[{identity,text,fileId,tried:alternate?[...(previous?.tried||[]),previous?.fileId].filter(Boolean):[],release:String(candidate.release||'English').slice(0,200)},...cache.filter(r=>r.identity!==identity)].slice(0,6);
 while(JSON.stringify(cache).length>1500000&&cache.length>1)cache.pop();
 try{storage.setItem(cacheKey,JSON.stringify(cache));}catch{}
 return {cues,release:candidate.release,fileId,cached:false};
}
