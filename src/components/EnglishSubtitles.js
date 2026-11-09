import {protectedStorage} from '../storage/protectedStorage.js';
import {fetchEnglishSubtitle,captionAt,subtitleEdition} from '../services/englishSubtitles.js';
import {prepareEnglishSubtitle} from '../services/subtitlePreparation.js';
export function mountEnglishSubtitles(video,panel,{item,season,episode,onChange=()=>{}}){
 const storage=protectedStorage,read=(key,fallback)=>{try{return storage.getItem(key)??fallback;}catch{return fallback;}},write=(key,value)=>{try{storage.setItem(key,String(value));}catch{}};
 let offsetKey='',release='';
 const overlay=video.ownerDocument.createElement('div');overlay.className='english-subtitle-overlay';overlay.hidden=true;panel.parentElement.append(overlay);
 let enabled=read('mj-subtitle-language','en')!=='off',delay=Math.max(-120,Math.min(120,0)),cues=[],busy=false,disposed=false,message='English subtitles',source='',abort,timer,preferExternal=false;
 const tracks=()=>Array.from(video.textTracks||[]),english=()=>tracks().find(t=>['subtitles','captions'].includes(t.kind)&&(/^(en|eng)(-|$)/i.test(t.language)||/^english\b/i.test(t.label)));
 const render=()=>{overlay.textContent=enabled&&!video.seeking&&['OpenSubtitles','Stream'].includes(source)&&cues.length?captionAt(cues,video.currentTime-delay):'';overlay.hidden=!overlay.textContent;overlay.classList.toggle('large-subtitles',read('mj-subtitle-size','normal')==='large');overlay.classList.toggle('controls-visible',!panel.hidden);};
 const changed=()=>{render();onChange();};
 const load=async(alternate=false)=>{
  if(!enabled||disposed)return;
  const track=english();if(track&&!alternate&&!preferExternal){for(const t of tracks())t.mode=t===track?'showing':'disabled';source='Provider';message='English · Provider';changed();return;}
  if(busy||!Number.isFinite(video.duration)||video.duration<=0)return;
  if(cues.length&&!alternate)return;
  busy=true;message='Loading English subtitles…';changed();abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),15000);
  try{const result=await (alternate?fetchEnglishSubtitle(item,season,episode,{signal:abort.signal,alternate,duration:video.duration}):prepareEnglishSubtitle(item,season,episode,{duration:video.duration}));if(disposed||!enabled)return;if(!result)return;cues=result.cues;release=result.release||'English';offsetKey='mjplay.subtitle.offset.v2/'+subtitleEdition(item,season,episode,video.duration)+'/'+result.fileId;delay=Math.max(-120,Math.min(120,Number(read(offsetKey,0))||0));if(english()&&!alternate&&!preferExternal){source='Provider';message='English · Provider';for(const t of tracks())t.mode=t===english()?'showing':'disabled';}else{preferExternal=alternate||preferExternal;source=result.source||'OpenSubtitles';message=source==='Stream'?'English · included with this stream':'English · title matched; timing may vary';for(const t of tracks())t.mode='disabled';}}
  catch(e){if(!disposed)message=e.name==='AbortError'?'Subtitle request timed out. Try again.':e.message;}
  finally{clearTimeout(timeout);busy=false;if(!disposed)changed();}
 };
 const metadata=()=>{clearTimeout(timer);timer=setTimeout(()=>load(),100);};
 const clock=setInterval(render,100);
 video.addEventListener('loadedmetadata',metadata);video.addEventListener('playing',metadata);video.addEventListener('durationchange',metadata);video.addEventListener('timeupdate',render);video.addEventListener('seeking',render);video.addEventListener('seeked',render);video.textTracks?.addEventListener?.('addtrack',metadata);
 load();
 return {
  status:()=>({enabled,delay,message,source,busy,release}),
  enable(value){enabled=value;write('mj-subtitle-language',value?'en':'off');if(!value){abort?.abort();for(const t of tracks())t.mode='disabled';}else load();changed();},
  retry(){return load(source==='Provider'||(['OpenSubtitles','Stream'].includes(source)&&cues.length>0));},
  shift(seconds){if(source==='Provider'){message='Timing adjustment is available for downloaded subtitles. Use another English subtitle.';changed();return;}delay=Math.max(-120,Math.min(120,delay+seconds));if(offsetKey)write(offsetKey,delay);changed();},
  resize(){render();},
  dispose(){disposed=true;abort?.abort();clearTimeout(timer);clearInterval(clock);video.removeEventListener('loadedmetadata',metadata);video.removeEventListener('playing',metadata);video.removeEventListener('durationchange',metadata);video.removeEventListener('timeupdate',render);video.removeEventListener('seeking',render);video.removeEventListener('seeked',render);video.textTracks?.removeEventListener?.('addtrack',metadata);overlay.remove();}
 };
}

