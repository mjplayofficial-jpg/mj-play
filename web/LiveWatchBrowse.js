import {loadSports,eventStatus} from '../services/sports.js';
import {liveCatalogue} from '../data/liveCatalogue.js';
import {liveCategories,liveFavourites} from './liveCatalogue.js';
import {loadLiveGuide,guideWindow} from '../services/liveGuide.js';
import {escapeHtml as esc} from './ui.js';

export function mountLiveWatchBrowse(shell,channel,onSwitch){
 if(channel.sports)return mountSportsWatchBrowse(shell,channel,onSwitch);
 const panel=document.createElement('section');panel.className='web-live-browse';panel.setAttribute('aria-label','Programme information and channels');shell.append(panel);
 let category='popular',disposed=false,programmes=[];
 panel.innerHTML='<aside class="web-watch-programmes" aria-live="polite">Loading scheduleâ€¦</aside><h2>Channels</h2><div class="web-watch-categories" aria-label="Channel categories"></div><div class="web-watch-channels"></div>';
 const schedule=panel.querySelector('aside'),filters=panel.querySelector('.web-watch-categories'),grid=panel.querySelector('.web-watch-channels');
 function paint(){
  filters.innerHTML='<label class="web-live-category">Category<select aria-label="Channel category">'+[...liveCategories.slice(0,1),['favourites','Favourites'],...liveCategories.slice(1),['all','All channels']].map(([id,label])=>'<option value="'+id+'"'+(id===category?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select></label>';
  filters.querySelector('select').onchange=e=>{category=e.target.value;paint();filters.querySelector('select').focus({preventScroll:true});};
  const favourites=liveFavourites(),channels=liveCatalogue.filter(c=>category==='all'||category==='favourites'&&favourites.has(c.number)||c.categories.includes(category));
  grid.innerHTML=channels.map(c=>'<button data-watch-channel="'+c.number+'" aria-label="'+esc(c.title)+(c.number===channel.number?' â€” watching':'')+'" aria-current="'+(c.number===channel.number)+'"><span class="web-watch-logo"><img loading="lazy" src="'+esc(c.logo)+'" alt=""></span><strong>'+esc(c.title)+'</strong>'+(c.number===channel.number?'<small>Watching</small>':'')+'</button>').join('')||(category==='favourites'?'<p>No saved channels yet. Use Favourite while watching to add one.</p>':'<p>No channels in this category. Try another category.</p>');
 }
 function paintGuide(){const {current,next}=guideWindow(programmes);const rows=[['NOW',current],['NEXT',next]].filter(([,p])=>p);schedule.innerHTML=rows.length?rows.map(([label,p])=>'<div><small>'+label+' Â· '+new Date(p.start).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'â€“'+new Date(p.end).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</small><strong>'+esc(p.title)+'</strong></div>').join(''):'<p>Programme information unavailable</p>';}
 async function update(){try{const result=await loadLiveGuide(channel.number);if(!disposed){programmes=Array.isArray(result)?result:[];paintGuide();}}catch{if(!disposed)paintGuide();}}
 panel.onclick=e=>{const categoryButton=e.target.closest('[data-watch-category]'),button=e.target.closest('[data-watch-channel]');if(categoryButton){category=categoryButton.dataset.watchCategory;paint();filters.querySelector('[data-watch-category="'+category+'"]')?.focus({preventScroll:true});}else if(button){const next=liveCatalogue.find(c=>c.number===Number(button.dataset.watchChannel));if(next&&next.number!==channel.number)onSwitch?.(next);}};
 const favouriteClick=e=>{if(e.target.closest('[data-live-favourite]'))paint();};shell.addEventListener('click',favouriteClick);
 const error=e=>{if(e.target.tagName==='IMG')e.target.hidden=true;};grid.addEventListener('error',error,true);
 const timer=setInterval(update,60000);paint();void update();
 return {dispose(){disposed=true;clearInterval(timer);shell.removeEventListener('click',favouriteClick);grid.removeEventListener('error',error,true);panel.remove();}};
}

function mountSportsWatchBrowse(shell,channel,onSwitch){
 const panel=document.createElement('section');panel.className='web-live-browse web-sports-watch';panel.setAttribute('aria-label','Match details and streams');shell.append(panel);let disposed=false;
 const event=channel.event;
 const streams=(event?.servers||[]).filter(s=>s.kind==='channel');
 panel.innerHTML='<aside class="web-watch-programmes"><strong>'+esc(event?.title||channel.title)+'</strong>'+(event?'<small>'+esc(event.league||'')+' · '+new Date(event.starts).toLocaleString([],{weekday:'short',hour:'2-digit',minute:'2-digit'})+'</small>':'')+'<p>Live channels may show other programmes before kickoff.</p></aside><h2>Available streams</h2><div class="web-watch-channels">'+streams.map((s,i)=>'<button data-match-stream="'+i+'" aria-current="'+(s.number===channel.number)+'"><strong>WS_DDL · Server '+(s.serverNumber||Number(s.title?.match(/server\s*(\d+)/i)?.[1])||i+1)+'</strong><small>'+(s.number===channel.number?'Watching':'Switch stream')+'</small></button>').join('')+'</div><h2>Other live matches</h2><div data-other-matches class="web-watch-channels"><p>Loading matches…</p></div>';
 panel.onclick=e=>{const stream=e.target.closest('[data-match-stream]');if(stream){const source=streams[Number(stream.dataset.matchStream)];if(source&&source.number!==channel.number)onSwitch?.({...channel,number:source.number,wsNumber:source.number,sourceLabel:'WS_DDL · Server '+(source.serverNumber||Number(stream.dataset.matchStream)+1)});}};
 loadSports('Match').then(events=>{if(disposed)return;const other=events.filter(e=>e.id!==event?.id&&eventStatus(e)==='Live'&&e.servers.some(s=>s.kind==='channel')).slice(0,8);const box=panel.querySelector('[data-other-matches]');box.innerHTML=other.map((e,i)=>'<button data-other-match="'+i+'"><strong>'+esc(e.title)+'</strong><small>Watch live</small></button>').join('')||'<p>No other live matches with streams right now.</p>';box.onclick=e=>{const b=e.target.closest('[data-other-match]');if(!b)return;const match=other[Number(b.dataset.otherMatch)],s=match.servers.find(s=>s.kind==='channel');onSwitch?.({number:s.number,title:match.title,sports:true,event:match,sourceLabel:'WS_DDL · Server '+(s.serverNumber||1)});};}).catch(()=>{if(!disposed)panel.querySelector('[data-other-matches]').innerHTML='<p>Other matches could not load. You can keep watching.</p>';});
 return {dispose(){disposed=true;panel.remove();}};
}
