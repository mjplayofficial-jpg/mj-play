import {trailerIdentity} from './trailerIdentity.js';
export function trailerEmbedUrl(key){
 if(typeof key!=='string'||!/^[-\w]{11}$/.test(key))throw Error('Invalid trailer');
 const url=new URL('https://www.youtube.com/embed/'+key);
 for(const [name,value] of Object.entries({autoplay:'1',playsinline:'1',enablejsapi:'1',rel:'0',widget_referrer:'https://com.mjentertainment.mjplay'}))url.searchParams.set(name,value);
 if(/^https?:$/.test(globalThis.location?.protocol))url.searchParams.set('origin',globalThis.location.origin);
 return url.href;
}
export function mountTrailer(root,key,{title='Official trailer',kind='trailer'}={}){
 const doc=root.ownerDocument,win=doc.defaultView||window,previous=doc.activeElement;
 const modal=doc.createElement('section');modal.className='trailer-modal';modal.setAttribute('data-modal','');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Trailer');
 modal.innerHTML='<div class="trailer-heading"><div><p class="eyebrow">MJ PLAY · PREVIEW</p><h2>Official trailer</h2></div><button data-focus="trailer-close">✕ Close</button></div><iframe title="YouTube trailer" allow="autoplay; encrypted-media; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="trailer-controls"><div class="trailer-timeline"><span data-trailer-time>0:00</span><button data-focus="trailer-seek" role="slider" aria-label="Trailer position" aria-valuemin="0"><span></span></button><span data-trailer-duration>0:00</span></div><div class="trailer-actions" data-focus-row><button data-focus="trailer-rewind" aria-label="Rewind 10 seconds"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 2 12l7 7V5zm10 0-7 7 7 7V5z"/></svg> 10</button><button class="trailer-primary" data-focus="trailer-toggle">Ⅱ Pause</button><button data-focus="trailer-forward" aria-label="Forward 10 seconds">10 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 7 7-7 7V5zm10 0 7 7-7 7V5z"/></svg></button><p role="status">Loading trailer…</p><button data-focus="trailer-retry">Retry</button></div></div>';
 modal.querySelector('h2').textContent=title;if(kind==='highlights')modal.querySelector('.eyebrow').textContent='MJ PLAY · HIGHLIGHTS';modal.setAttribute('aria-label',kind);modal.querySelector('iframe').title='YouTube '+kind;
 const frame=modal.querySelector('iframe'),closeButton=modal.querySelector('[data-focus="trailer-close"]'),status=modal.querySelector('[role="status"]'),toggle=modal.querySelector('[data-focus="trailer-toggle"]'),bar=modal.querySelector('[data-focus="trailer-seek"]');let closed=false,state=-1,position=0,duration=0,stopIdentity=()=>{};
 const send=(event,extra={})=>frame.contentWindow?.postMessage(JSON.stringify({event,...extra}),'https://www.youtube.com');
 const command=(func,args=[])=>send('command',{func,args});
 const format=n=>Math.floor((n||0)/60)+':'+String(Math.floor((n||0)%60)).padStart(2,'0');
 const paint=()=>{toggle.textContent=state===1?'Ⅱ Pause':'▶ Play';bar.setAttribute('aria-valuemax',String(duration));bar.setAttribute('aria-valuenow',String(Math.floor(position)));bar.querySelector('span').style.width=(duration?position/duration*100:0)+'%';modal.querySelector('[data-trailer-time]').textContent=format(position);modal.querySelector('[data-trailer-duration]').textContent=format(duration);};
 const seek=delta=>{if(duration<=0)return;position=Math.max(0,Math.min(duration-.1,position+delta));command('seekTo',[position,true]);paint();};
 const close=()=>{if(closed)return;closed=true;stopIdentity();clearInterval(poll);clearTimeout(timeout);win.removeEventListener('message',message);doc.removeEventListener('keydown',keys,true);frame.src='about:blank';modal.remove();if(previous?.isConnected)previous.focus({preventScroll:true});};
 const keys=e=>{if(e.key==='Escape'||e.key==='Backspace'||e.keyCode===461){e.preventDefault();e.stopImmediatePropagation();close();return;}if(doc.activeElement===bar&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();e.stopImmediatePropagation();seek(e.key==='ArrowLeft'?-10:10);}};
 const message=e=>{if(e.source!==frame.contentWindow||e.origin!=='https://www.youtube.com')return;let data=e.data;try{if(typeof data==='string')data=JSON.parse(data);}catch{return;}
  if(data?.event==='onReady'){status.textContent='OK to use controls · BACK to close';send('command',{func:'addEventListener',args:['onStateChange']});send('command',{func:'addEventListener',args:['onError']});}
  if(data?.event==='infoDelivery'&&data.info){if(Number.isFinite(data.info.currentTime))position=data.info.currentTime;if(Number.isFinite(data.info.duration))duration=data.info.duration;if(Number.isFinite(data.info.playerState))state=data.info.playerState;paint();}
  if(data?.event==='onStateChange'){state=Number(data.info);paint();if(state===1){status.textContent='Playing '+kind;clearTimeout(timeout);}else if(state===2)status.textContent=kind+' paused';else if(state===0)close();}
  if(data?.event==='onError')status.textContent='This trailer cannot play inside the app. Try another title.';
 };
 const poll=setInterval(()=>send('listening',{id:'mj-trailer'}),500),timeout=setTimeout(()=>{status.textContent='If playback has not started, press Play in the YouTube player or Retry.';},15000);
 closeButton.onclick=close;toggle.onclick=()=>command(state===1?'pauseVideo':'playVideo');modal.querySelector('[data-focus="trailer-rewind"]').onclick=()=>seek(-10);modal.querySelector('[data-focus="trailer-forward"]').onclick=()=>seek(10);bar.onclick=e=>{if(e.detail&&duration>0){const rect=bar.getBoundingClientRect();seek((e.clientX-rect.left)/rect.width*duration-position);}else toggle.onclick();};modal.querySelector('[data-focus="trailer-retry"]').onclick=()=>{status.textContent='Loading '+kind+'…';position=duration=0;paint();frame.src=trailerEmbedUrl(key);};
 win.addEventListener('message',message);doc.addEventListener('keydown',keys,true);root.append(modal);closeButton.focus();
 trailerIdentity().then(stop=>{if(closed){stop();return;}stopIdentity=stop;frame.src=trailerEmbedUrl(key);}).catch(()=>{if(!closed)frame.src=trailerEmbedUrl(key);});
 return close;
}
