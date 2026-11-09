import {appNow} from '../services/appClock.js';
import {escapeHtml as esc} from './ui.js';
import {guideWindow} from '../services/liveGuide.js';
export function liveGuidePreview(channel,programmes,now=appNow(),message='Schedule unavailable'){
 const {current,upcoming}=guideWindow(programmes,now),slots=[current,...upcoming.slice(0,3)];while(slots.length<4)slots.push(null);const available=slots.some(Boolean);
 const time=t=>new Date(t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
 return '<div class="live-guide-heading"><div><small>CHANNEL GUIDE · LOCAL TIME</small><strong>'+esc(channel.title)+'</strong></div><button data-focus="live-guide" data-live-guide'+(available?'':' disabled aria-disabled="true"')+'>Full schedule <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button></div><div class="live-guide-timeline">'+slots.map((p,i)=>'<div class="live-guide-slot'+(i===0?' live-guide-current':'')+'"><small>'+['On now','Up next','Later','Later'][i]+'</small><strong>'+(p?esc(p.title):(i===0?esc(message):'—'))+'</strong><time>'+(p?time(p.start)+'–'+time(p.end):'—')+'</time>'+(i===0&&p?'<progress aria-label="Programme progress" max="1" value="'+Math.max(0,Math.min(1,(now-p.start)/(p.end-p.start)))+'"></progress>':'')+'</div>').join('')+'</div>';
}
