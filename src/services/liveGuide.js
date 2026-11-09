import {appNow} from './appClock.js';
import {localGuideSources} from '../data/liveGuideSources.js';
import {liveGuideCloudUrl} from '../config/liveGuideCloud.js';
import {createGuideLoader} from './cloudGuideLoader.js';
export const guideSources={...localGuideSources,349:{id:'BBCNews.uk',url:'https://raw.githubusercontent.com/sasagr/bbcnews-epg/main/bbcnews.xml',name:'BBC News UK'}};
export function parseGuidePayload(payload,number){if(payload?.version!==1||payload.channel!==Number(number)||!Array.isArray(payload.programmes)||payload.programmes.length>1000)throw Error('Invalid channel guide');return payload.programmes.filter(p=>Number.isFinite(p.start)&&Number.isFinite(p.end)&&p.end>p.start&&typeof p.title==='string'&&p.title.length<=1000).sort((a,b)=>a.start-b.start);}
export function xmltvTime(value){const m=/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s+([+-])(\d{2})(\d{2})$/.exec(value||'');if(!m)return NaN;return Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6])-(m[7]==='+'?1:-1)*(+m[8]*60 + +m[9])*60000;}
const decode=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):+n)).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
export function parseGuide(xml,id){const programmes=[];for(const m of xml.matchAll(/<programme\b([^>]*)>([\s\S]*?)<\/programme>/g)){const attrs=Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]]));if(attrs.channel!==id)continue;const start=xmltvTime(attrs.start),end=xmltvTime(attrs.stop),title=decode(/<title\b[^>]*>([\s\S]*?)<\/title>/.exec(m[2])?.[1]||'');if(Number.isFinite(start)&&end>start&&title)programmes.push({start,end,title});}return programmes.sort((a,b)=>a.start-b.start);}
export function guideWindow(programmes,now=appNow()){const current=programmes.find(p=>p.start<=now&&p.end>now)||null,upcoming=programmes.filter(p=>p.start>now).slice(0,12);return {current,next:upcoming[0]||null,upcoming};}
let defaultLoader;
export async function loadLiveGuide(number,{fetcher}={}){if(fetcher)return createGuideLoader({sources:guideSources,parsePayload:parseGuidePayload,parseXml:parseGuide,cloudUrl:liveGuideCloudUrl,fetcher})(number);defaultLoader??=createGuideLoader({sources:guideSources,parsePayload:parseGuidePayload,parseXml:parseGuide,cloudUrl:liveGuideCloudUrl});return defaultLoader(number);}

