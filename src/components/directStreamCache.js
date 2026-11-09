import {directTrialKey} from '../providers/DirectTrialProvider.js';
export function hasReadyDirectStream(item,season,episode,now=Date.now(),sourceProvider){
 try{const entry=globalThis.__mjDirectTrialSources?.[directTrialKey(item.type,{...item,season,episode})];return !!entry&&(!sourceProvider||(entry.sourceProvider||'primary')===sourceProvider)&&Number.isFinite(entry.expiresAt)&&entry.expiresAt>now;}catch{return false;}
}
