import {protectedStorage as localStorage} from '../storage/protectedStorage.js';
import {createCreditsCountdown} from './creditsCountdown.js';
import {mountEnglishSubtitles} from './EnglishSubtitles.js';
import {escapeHtml as esc} from './ui.js';
import {focusPlaybackPrompt,releasePlaybackPrompt} from './playbackPrompt.js';
export function preferredSubtitle(tracks,preference){
 if(!preference||preference==='off')return -1;
 const key=value=>String(value||'').toLowerCase().replaceAll('_','-');
 const exact=tracks.findIndex(t=>key(t.language||t.label)===key(preference));
 return exact>=0?exact:tracks.findIndex(t=>t.language&&key(t.language).split('-')[0]===key(preference).split('-')[0]);
}
export function mountPlaybackExtras(video,panel,{onNextEpisode,prepareNextEpisode,isMenuOpen,item,season,episode,getCredits=()=>null,isInteracting=()=>false}){
 const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
 const write=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
 let enabled=read('mj-autoplay-next','true')==='true',cancelled=false,busy=false,disposed=false,nextInfo=null,subtitleOpen=false;
 const doc=video.ownerDocument,extras=doc.createElement('div');extras.className='cinema-extras';
 extras.innerHTML=`<div class="cinema-extra-actions" data-focus-row><button data-focus="subtitle-menu">Subtitles</button><button data-focus="subtitle-quick-earlier" aria-label="Show subtitles half a second earlier">Earlier −0.5s</button><button data-focus="subtitle-quick-later" aria-label="Show subtitles half a second later">Later +0.5s</button>${onNextEpisode?'<button data-focus="autoplay-toggle"></button>':''}</div><div class="cinema-subtitles" hidden></div><div class="cinema-up-next" hidden><div class="up-next-heading"><p class="up-next-eyebrow">UP NEXT</p><p data-up-label></p></div><div class="up-next-countdown"><span></span></div><div data-focus-row><button data-focus="up-play">Play next</button><button data-focus="up-cancel" aria-label="Keep watching this episode">Stay</button></div></div>`;
 panel.querySelector('.cinema-bottom').append(extras);
 const popup=extras.querySelector('.cinema-subtitles'),card=extras.querySelector('.cinema-up-next'),auto=extras.querySelector('[data-focus="autoplay-toggle"]');
 panel.parentElement.append(card);
 card.setAttribute?.('data-playback-prompt','');
 const hideCard=()=>{releasePlaybackPrompt(card,video);card.hidden=true;};
 let englishController=null;
 const tracks=()=>Array.from(video.textTracks||[]).filter(t=>['subtitles','captions'].includes(t.kind));
 const applySubtitles=()=>{if(englishController)return;const available=tracks(),selected=preferredSubtitle(available,read('mj-subtitle-language','off'));available.forEach((t,i)=>{const mode=i===selected?'showing':'disabled';if(t.mode!==mode)t.mode=mode;});};
 const applySize=()=>{video.classList.toggle('large-subtitles',read('mj-subtitle-size','normal')==='large');};applySize();applySubtitles();
 const refreshEnglish=()=>{if(!englishController||!subtitleOpen)return;const state=englishController.status();const notice=popup.querySelector('[data-subtitle-status]');if(notice)notice.textContent=state.message;const version=popup.querySelector('[data-subtitle-version]');if(version)version.textContent=state.source==='Provider'?'Included with this stream':state.release||'Finding an English version';const offset=popup.querySelector('[data-subtitle-offset]');if(offset)offset.textContent='Timing: '+(state.delay>0?'+':'')+state.delay.toFixed(1)+'s';for(const b of popup.querySelectorAll('[data-subtitle-enabled]'))b.setAttribute('aria-pressed',String(state.enabled===(b.dataset.subtitleEnabled==='true')));};
 if(item)englishController=mountEnglishSubtitles(video,panel,{item,season,episode,onChange:refreshEnglish});
 for(const [key,delta] of [['earlier',-.5],['later',.5]]){const button=extras.querySelector('[data-focus="subtitle-quick-'+key+'"]');if(button)button.onclick=()=>{if(!englishController)return;englishController.shift(delta);const value=englishController.status();const notice=panel.querySelector('.cinema-message');if(notice)notice.textContent=value.source==='Provider'?value.message:'Subtitle timing '+(value.delay>0?'+':'')+value.delay.toFixed(1)+'s';};}

 const englishMenu=()=>{subtitleOpen=true;popup.hidden=false;popup.setAttribute('data-modal','');popup.innerHTML='<div class="subtitle-heading"><span class="subtitle-badge">CC</span><div><h3>Subtitles</h3><p data-subtitle-status></p></div></div><p class="subtitle-section-label">LANGUAGE</p><div class="subtitle-language" data-focus-row><button data-focus="subtitle-english" data-subtitle-enabled="true">English</button><button data-focus="subtitle-off" data-subtitle-enabled="false">Off</button></div><div class="subtitle-version"><p class="subtitle-section-label">CURRENT VERSION</p><p data-subtitle-version></p><button data-focus="subtitle-retry">Try another version</button></div><p class="subtle">If captions drift further out of sync as you watch, try another version. Timing adjustment only corrects a steady delay.</p><div class="subtitle-timing-heading"><p class="subtitle-section-label">ADJUST TIMING</p><p data-subtitle-offset></p></div><div class="subtitle-timing" data-focus-row><button data-focus="subtitle-earlier">− 0.5s</button><button data-focus="subtitle-later">Later +0.5s</button><button data-focus="subtitle-reset">Reset</button></div><div class="subtitle-footer" data-focus-row><button data-focus="subtitle-size">Text size: '+esc(read('mj-subtitle-size','normal'))+'</button><button data-focus="subtitle-close">Done</button></div>';
 for(const button of popup.querySelectorAll('[data-subtitle-enabled]'))button.onclick=()=>englishController.enable(button.dataset.subtitleEnabled==='true');
 popup.querySelector('[data-focus="subtitle-retry"]').onclick=()=>{englishController.enable(true);englishController.retry();};
 popup.querySelector('[data-focus="subtitle-earlier"]').onclick=()=>englishController.shift(-.5);
 popup.querySelector('[data-focus="subtitle-later"]').onclick=()=>englishController.shift(.5);
 popup.querySelector('[data-focus="subtitle-reset"]').onclick=()=>englishController.shift(-englishController.status().delay);
 popup.querySelector('[data-focus="subtitle-size"]').onclick=()=>{write('mj-subtitle-size',read('mj-subtitle-size','normal')==='normal'?'large':'normal');applySize();englishController.resize();popup.querySelector('[data-focus="subtitle-size"]').textContent='Text size: '+read('mj-subtitle-size','normal');};
 popup.querySelector('[data-focus="subtitle-close"]').onclick=()=>{subtitleOpen=false;popup.hidden=true;popup.removeAttribute?.('data-modal');extras.querySelector('[data-focus="subtitle-menu"]').focus();};refreshEnglish();popup.querySelector('button').focus();};
 const menu=()=>{subtitleOpen=true;if(englishController){englishMenu();return;}popup.hidden=false;const available=tracks();popup.innerHTML=`<p>Subtitles</p><div data-focus-row><button data-focus="subtitle-off">Off</button>${available.map((t,i)=>`<button data-focus="subtitle-${i}" data-track="${i}">${esc(t.label||t.language||'Track '+(i+1))}</button>`).join('')}</div>${available.length?'':'<p>This stream has no subtitle tracks available.</p>'}<div data-focus-row><button data-focus="subtitle-size">Text size: ${read('mj-subtitle-size','normal')}</button><button data-focus="subtitle-close">Done</button></div>`;
 popup.querySelector('[data-focus="subtitle-off"]').onclick=()=>{write('mj-subtitle-language','off');applySubtitles();};
 for(const button of popup.querySelectorAll('[data-track]'))button.onclick=()=>{const t=available[Number(button.dataset.track)];write('mj-subtitle-language',t.language||t.label);applySubtitles();};
 popup.querySelector('[data-focus="subtitle-size"]').onclick=()=>{write('mj-subtitle-size',read('mj-subtitle-size','normal')==='normal'?'large':'normal');applySize();menu();};
 popup.querySelector('[data-focus="subtitle-close"]').onclick=()=>{subtitleOpen=false;popup.hidden=true;extras.querySelector('[data-focus="subtitle-menu"]').focus();};popup.querySelector('button').focus();};
 extras.querySelector('[data-focus="subtitle-menu"]').onclick=()=>{if(subtitleOpen){subtitleOpen=false;popup.hidden=true;}else menu();};
 const subtitleBack=e=>{if(!subtitleOpen||!(e.key==='Escape'||e.key==='Backspace'||e.keyCode===461))return;e.preventDefault();e.stopImmediatePropagation();subtitleOpen=false;popup.hidden=true;popup.removeAttribute?.('data-modal');extras.querySelector('[data-focus="subtitle-menu"]').focus();};doc.addEventListener('keydown',subtitleBack,true);
 const countdown=createCreditsCountdown();
 const refresh=()=>{if(auto)auto.textContent='Autoplay next: '+(enabled?'On':'Off');};refresh();if(auto)auto.onclick=()=>{enabled=!enabled;write('mj-autoplay-next',String(enabled));refresh();countdown.reset();if(!enabled)hideCard();};
 const advance=async()=>{if(busy||disposed||!onNextEpisode)return;busy=true;card.hidden=false;card.querySelector('[data-up-label]').textContent='Loading next episode…';try{const result=await onNextEpisode();if(!result&&!disposed){cancelled=true;card.querySelector('[data-up-label]').textContent='No more episodes available.';}}catch{if(!disposed){cancelled=true;card.querySelector('[data-up-label]').textContent='Could not load next episode. Press Play next to retry, or use Playback options.';}}finally{busy=false;}};
 card.querySelector('[data-focus="up-play"]').onclick=advance;const stay=()=>{cancelled=true;hideCard();};card.querySelector('[data-focus="up-cancel"]').onclick=stay;
 const promptKey=e=>{if(card.hidden||isMenuOpen()||subtitleOpen)return;const back=e.keyCode===461||e.key==='Escape'||e.key==='Backspace',ok=e.keyCode===13||e.key==='Enter';if(back){e.preventDefault();e.stopImmediatePropagation();stay();}else if(ok&&card.contains?.(doc.activeElement)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)doc.activeElement.click();}};doc.addEventListener('keydown',promptKey,true);
 const update=()=>{
 const marker=getCredits(),inCredits=!!marker&&video.currentTime>=marker.start,remaining=video.duration-video.currentTime;
 if(marker&&!inCredits){countdown.reset();cancelled=false;}
 const canRun=enabled&&!cancelled&&!!nextInfo&&!isMenuOpen()&&!subtitleOpen&&!video.paused&&!video.seeking&&!video.ended&&(video.readyState===undefined||video.readyState>=3);
 const state=countdown.update({position:video.currentTime,marker,playing:canRun});
 if(!enabled||cancelled||!nextInfo||isMenuOpen()||subtitleOpen||!Number.isFinite(remaining)||(!inCredits&&remaining>15)){if(!busy)hideCard();return;}
 if(!busy&&remaining>0){card.hidden=false;card.querySelector('[data-up-label]').textContent=`S${nextInfo.season} · E${nextInfo.episode}${state.protectedScene?' · Post-credit scene ahead':''}`;
 const seconds=state.active?state.seconds:remaining;
 card.querySelector('.up-next-countdown span').style.width=`${state.protectedScene?0:Math.max(0,Math.min(100,seconds/(state.active?10:15)*100))}%`;
 card.querySelector('[data-focus="up-play"]').textContent=state.protectedScene?'Next episode':`Next episode · ${Math.ceil(seconds)}s`;
 focusPlaybackPrompt(card.querySelector('[data-focus="up-play"]'),panel,video.seeking||isInteracting()||isMenuOpen()||subtitleOpen);
 if(state.due&&canRun)advance();
 }
 };
 const ended=()=>{if(enabled&&!cancelled&&nextInfo)advance();};
 if(prepareNextEpisode)Promise.resolve().then(prepareNextEpisode).then(next=>{if(!disposed){nextInfo=next;update();}}).catch(()=>{});
 const countdownTimer=setInterval(update,250);
 video.addEventListener('timeupdate',update);video.addEventListener('ended',ended);video.textTracks?.addEventListener?.('addtrack',applySubtitles);video.addEventListener('loadedmetadata',applySubtitles);
 return {keepVisible:()=>subtitleOpen,dispose:()=>{disposed=true;clearInterval(countdownTimer);doc.removeEventListener('keydown',subtitleBack,true);doc.removeEventListener('keydown',promptKey,true);englishController?.dispose();video.removeEventListener('timeupdate',update);video.removeEventListener('ended',ended);video.removeEventListener('loadedmetadata',applySubtitles);video.textTracks?.removeEventListener?.('addtrack',applySubtitles);card.remove();extras.remove();}};
}


