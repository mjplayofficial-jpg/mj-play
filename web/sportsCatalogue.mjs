import {sportsCategories,sportsBlogId,sportsEvent} from '../src/services/sports.js';
import {decryptSportsLink} from '../src/services/sportsCipher.js';
export function decodeSportsPost(post,key){
 const html=post.content?.$t||'',match=html.match(/(<script\b[^>]*\bid=["']__STR34M_X_D4T4__["'][^>]*>)([\s\S]*?)(<\/script>)/i);if(!match)return null;
 try{const data=JSON.parse(match[2]);if(Array.isArray(data.servers))for(const server of data.servers)if(['SS','S8'].includes(server.fb_id)){const decoded=decryptSportsLink(server.url,key);if(decoded)server.url=decoded;}
 return sportsEvent({...post,content:{$t:html.replace(match[0],match[1]+JSON.stringify(data)+match[3])}});
 }catch{return null;}
}
export function createSportsCatalogue({key,request=fetch}){
 const cache=new Map(),pending=new Map();
 return async function get(category){
  if(!sportsCategories.some(([id])=>id===category))throw Error('Unknown sport');
  const old=cache.get(category);if(old&&old.until>Date.now())return old.events;if(pending.has(category))return pending.get(category);
  const operation=(async()=>{const url=new URL('https://www.blogger.com/feeds/'+sportsBlogId+'/posts/default/-/'+encodeURIComponent(category));url.search=new URLSearchParams({alt:'json','max-results':'150',orderby:'published'});
   const r=await request(url,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Sports feed unavailable');let size=0;const chunks=[];for await(const bytes of r.body){size+=bytes.length;if(size>8388608)throw Error('Sports feed too large');chunks.push(bytes);}const data=JSON.parse(Buffer.concat(chunks).toString());if(!String(data.feed?.id?.$t).endsWith('blog-'+sportsBlogId)||(data.feed?.entry!==undefined&&!Array.isArray(data.feed.entry)))throw Error('Invalid sports feed');
   const events=(data.feed.entry||[]).map(post=>decodeSportsPost(post,key)).filter(Boolean).map(event=>({...event,servers:event.servers.filter(server=>server.provider!=='SS')}));cache.set(category,{events,until:Date.now()+120000});return events;
  })();pending.set(category,operation);try{return await operation;}finally{pending.delete(category);}
 };
}
