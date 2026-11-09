import {protectedStorage} from '../storage/protectedStorage.js';
export const qualityKey='mjplay.video.quality.v1';
export const qualityPreference=()=>protectedStorage.getItem(qualityKey)||'1080';
export function setQualityPreference(value){if(!/^(auto|highest|[1-9]\d*)$/.test(value))throw Error('Invalid quality');protectedStorage.setItem(qualityKey,value);}
export function qualitySource(entry,preference=qualityPreference()){const variants=[...(entry.variants||[])].sort((a,b)=>b.height-a.height||b.bandwidth-a.bandwidth);if(preference==='auto')return entry.adaptive?entry.masterUrl||entry.url:entry.url;if(!variants.length)return entry.url;if(preference==='highest')return variants[0].url;return (variants.find(v=>v.height<=Number(preference))||variants[variants.length-1]).url;}
export function qualityChoices(entry){return [...(entry.adaptive?[['auto','Auto']]:[]),...[...new Set((entry.variants||[]).map(v=>v.height))].filter(n=>n>0).sort((a,b)=>b-a).map(n=>[String(n),n+'p'])];}
