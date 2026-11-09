import {sportIcon} from './components/sportIcon.js';
import {qualityPreference,setQualityPreference} from './components/videoQuality.js';
import {aboutMJPlay} from './config/about.js';
import {publicCommunity,refreshPublicConfig,diagnosticsAllowed,diagnosticsLocked,setDiagnostics} from './firebaseClient.js';
import {protectedStorage} from './storage/protectedStorage.js';
import {escapeHtml as esc} from './components/ui.js';
import {navigationIcon} from './components/Header.js';
import {experimentalPlaybackPreferences,setExperimentalTransport} from './components/experimentalEmbedPolicy.js';

const homeRoutes=new Set(['/','/movies','/tv','/my-list','/search']);
export function mobileSection(path){return path==='/live-tv'?'live':path==='/sports'?'sports':homeRoutes.has(path)?'home':null;}
const icon=path=>'<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
const menuIcon=icon('M4 6h16M4 12h16M4 18h16');
const bookmark=icon('M6 3h12v18l-6-4-6 4Z');
const routeButton=(route,label,graphic,active=false)=>'<button data-route="'+route+'" class="'+(active?'active':'')+'"'+(active?' aria-current="page"':'')+'>'+graphic+'<span>'+label+'</span></button>';

export function mountMobileNavigation(){
 const root=document.querySelector('#app'),mobile=matchMedia('(max-width:700px)');
 let scheduled=false,returnFocus;
 const path=()=>location.hash.slice(1).split('?')[0]||'/';
 const close=()=>{const drawer=root.querySelector('.web-mobile-drawer');if(!drawer)return;drawer.hidden=true;root.querySelector('[data-mobile-menu]')?.setAttribute('aria-expanded','false');document.body.classList.remove('web-mobile-drawer-open');returnFocus?.focus({preventScroll:true});};
 const enhance=()=>{
  scheduled=false;
  updateMatchContext();
  if(!root.querySelector('.web-mobile-drawer:not([hidden])'))document.body.classList.remove('web-mobile-drawer-open');
  const current=path(),section=mobileSection(current),header=root.querySelector('header');
  if(header&&!header.querySelector('[data-mobile-header]')){
   const controls=document.createElement('div');controls.className='web-mobile-header';controls.dataset.mobileHeader='';
   controls.innerHTML='<button data-mobile-menu aria-label="Open menu" aria-expanded="false" aria-controls="web-mobile-drawer">'+menuIcon+'</button><button data-mobile-search aria-label="Search this section">'+navigationIcon('Search')+'</button>';
   header.append(controls);
   const drawer=document.createElement('div');drawer.className='web-mobile-drawer';drawer.id='web-mobile-drawer';drawer.hidden=true;
   drawer.innerHTML='<button class="web-mobile-scrim" data-mobile-close aria-label="Close menu"></button><aside role="dialog" aria-modal="true" aria-label="MJ Play menu" tabindex="-1"><div class="web-mobile-drawer-title"><img src="assets/logo/header-official.png" alt="MJ Play"><button data-mobile-close aria-label="Close menu">'+icon('m6 6 12 12M6 18 18 6')+'</button></div><p data-drawer-tagline></p><button data-mobile-info="preferences">'+icon('M4 7h16M4 17h16M9 4v6M15 14v6')+'<span>Preferences</span></button><div data-drawer-community></div><button data-mobile-info="privacy">'+icon('m12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7Zm-3 9 2 2 4-4')+'<span>Privacy</span></button><button data-mobile-info="about">'+icon('M12 10v7m0-11v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0')+'<span>About</span></button><button data-mobile-info="updates">'+icon('M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4')+'<span>Updates</span></button><div class="web-mobile-info" hidden></div><p data-drawer-status role="status"></p></aside>';
   paintCommunity(drawer);
   header.append(drawer);
  }
  if(header){
   header.classList.toggle('web-live-search-in-category',current==='/live-tv');
   const nav=header.querySelector('nav:not(.web-mobile-tabs)');
   if(nav&&!nav.querySelector('[data-desktop-preferences]')){const button=document.createElement('button');button.className='nav web-desktop-preferences';button.dataset.desktopPreferences='';button.innerHTML=navigationIcon('Settings')+'<span>Preferences</span>';nav.append(button);}
   const search=header.querySelector('[data-mobile-search]');
   if(search){const label=section==='sports'?'Search matches':section==='live'?'Search channels':'Search movies, shows and actors';search.setAttribute('aria-label',label);}
   let tabs=header.querySelector('.web-mobile-tabs');
   const showTabs=homeRoutes.has(current)&&current!=='/search';
   if(showTabs&&!tabs){tabs=document.createElement('nav');tabs.className='web-mobile-tabs';tabs.setAttribute('aria-label','Browse catalogue');tabs.innerHTML=[['/','Discover'],['/movies','Movies'],['/tv','Shows'],['/my-list','My List']].map(([route,label])=>routeButton(route,label,navigationIcon(label),current===route)).join('');header.append(tabs);}
   if(tabs)tabs.hidden=!showTabs;
  }
 if(mobile.matches&&section&&!root.querySelector('.web-refresh-tip')&&protectedStorage.getItem('mj-pull-refresh-tip')!=='seen'){const tip=document.createElement('div');tip.className='web-refresh-tip';tip.setAttribute('role','status');tip.innerHTML='<span>At the top of a browsing page, pull down to refresh.</span><button>Got it</button>';tip.querySelector('button').onclick=()=>{protectedStorage.setItem('mj-pull-refresh-tip','seen');tip.remove();};root.append(tip);}
  const detail=root.querySelector('.sports-detail-v2'),hero=detail?.querySelector('.sports-event-hero');
  if(hero&&!detail.querySelector('.web-match-context')){const strip=document.createElement('aside');strip.className='web-match-context';strip.hidden=true;strip.setAttribute('aria-label','Selected match');const title=document.createElement('strong'),meta=document.createElement('span');title.textContent=hero.querySelector('h1')?.textContent||'';meta.textContent=(hero.querySelector('.sports-status')?.textContent||'')+' · '+(hero.querySelector('.sports-match-centre time')?.textContent||'');strip.append(title,meta);detail.prepend(strip);}
  const liveBar=root.querySelector('.live-filter-bar');
  if(liveBar){let select=liveBar.querySelector('[data-web-live-category]');if(!select){const label=document.createElement('label');label.className='web-live-category';label.innerHTML='Category<select aria-label="Channel category" data-web-live-category></select>';select=label.querySelector('select');const buttons=[...liveBar.querySelectorAll('[data-live-filter]')];buttons.sort((a,b)=>a.dataset.liveFilter==='popular'?-1:b.dataset.liveFilter==='popular'?1:0);for(const button of buttons){const option=document.createElement('option');option.value=button.dataset.liveFilter;option.textContent=button.textContent;select.append(option);}select.onchange=()=>liveBar.querySelector('[data-live-filter="'+select.value+'"]')?.click();liveBar.prepend(label);}const active=liveBar.querySelector('[data-live-filter][aria-pressed="true"]');if(active)select.value=active.dataset.liveFilter;}
  const sports=root.querySelector('.sports-bar');
  if(sports){
   let controls=sports.querySelector('.web-sports-selects');
   if(!controls){controls=document.createElement('div');controls.className='web-sports-selects';controls.innerHTML='<label>Sport<select aria-label="Sport" data-web-sport></select></label><label>Matches<select aria-label="Matches" data-web-matches></select></label>';sports.prepend(controls);for(const [target,selector,key] of [['[data-web-sport]','[data-sports-filter]','sportsFilter'],['[data-web-matches]','[data-sports-window]','sportsWindow']]){const select=controls.querySelector(target);for(const button of sports.querySelectorAll(selector)){const option=document.createElement('option');option.value=button.dataset[key];option.textContent=option.value==='Match'?'All sports':button.textContent;select.append(option);}select.onchange=()=>{sports.querySelector(selector+'['+(key==='sportsFilter'?'data-sports-filter':'data-sports-window')+'="'+select.value+'"]')?.click();};}}
   for(const [target,selector,key] of [['[data-web-sport]','[data-sports-filter]','sportsFilter'],['[data-web-matches]','[data-sports-window]','sportsWindow']]){const selected=sports.querySelector(selector+'[aria-pressed="true"]');if(selected){controls.querySelector(target).value=selected.dataset[key];if(key==='sportsFilter'){let graphic=controls.querySelector('.web-selected-sport');if(!graphic){graphic=document.createElement('span');graphic.className='web-selected-sport';controls.querySelector(target).before(graphic);}const id=selected.dataset[key];if(graphic.dataset.sport!==id){graphic.dataset.sport=id;graphic.innerHTML=sportIcon(id);}}}}
  }
  paintFooter();
  let bottom=root.querySelector('.web-mobile-bottom');
  if(section&&!bottom){bottom=document.createElement('nav');bottom.className='web-mobile-bottom';bottom.setAttribute('aria-label','Main sections');bottom.innerHTML=[['/','Home','home'],['/sports','Sports','sports'],['/live-tv','Live TV','live']].map(([route,label,id])=>routeButton(route,label,navigationIcon(label),section===id)).join('');root.append(bottom);}
  if(bottom)bottom.hidden=!section;
  document.body.classList.toggle('web-mobile-has-bottom',!!section);
  root.querySelectorAll('.sports-card:not([data-mobile-card])').forEach(card=>{
   card.dataset.mobileCard='true';const centre=card.querySelector('.sports-versus'),status=card.querySelector('.sports-status');
   if(centre){const stamp=Number(card.dataset.webStarts),date=new Date(stamp);const content=document.createElement('span');content.className='web-mobile-match-time';const label=document.createElement('strong'),time=document.createElement('time');
    label.textContent=card.classList.contains('sports-highlight-card')?'Highlights':status?.classList.contains('is-live')?'LIVE':status?.textContent.trim()==='Finished'?'Finished':Number.isFinite(stamp)?date.toDateString()===new Date().toDateString()?'Today':date.toLocaleDateString([],{weekday:'short',day:'numeric'}):'VS';
    if(status?.classList.contains('is-live'))centre.classList.add('web-live');
    content.append(label);centre.append(content);if(Number.isFinite(stamp)&&!card.classList.contains('sports-highlight-card')){time.textContent=date.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});content.append(time);}
   }
  });
 };
 const updateMatchContext=()=>{const detail=root.querySelector('.sports-detail-v2'),hero=detail?.querySelector('.sports-event-hero'),strip=detail?.querySelector('.web-match-context');if(!hero||!strip)return;const top=root.querySelector('header')?.getBoundingClientRect().bottom||0;strip.style.top=Math.max(0,top)+'px';strip.hidden=hero.getBoundingClientRect().bottom>top;};
 window.addEventListener('scroll',updateMatchContext,{passive:true});
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(enhance);}};
 const playbackDefaults=()=>experimentalPlaybackPreferences()+'<label class="web-drawer-setting"><span>English subtitles</span><input type="checkbox" data-default-subtitles '+(protectedStorage.getItem('mj-subtitle-language')!=='off'?'checked':'')+'></label><label class="web-default-quality">Preferred quality<select data-default-quality aria-label="Preferred quality">'+[['auto','Auto'],['1080','Up to 1080p'],['720','Up to 720p']].map(([value,label])=>'<option value="'+value+'"'+(qualityPreference()===value?' selected':'')+'>'+label+'</option>').join('')+'</select></label><p>Defaults for your next movie or episode. Uses the available stream tracks; you can change these while watching.</p>';
 const closePreferences=()=>{const dialog=document.querySelector('.web-preferences-dialog');if(dialog){dialog.close();dialog.remove();}returnFocus?.focus({preventScroll:true});};
 const openPreferences=button=>{
  returnFocus=button;const dialog=document.createElement('dialog');dialog.className='web-preferences-dialog';dialog.setAttribute('aria-labelledby','web-preferences-title');
  dialog.innerHTML='<div class="web-preferences-heading"><h2 id="web-preferences-title">Preferences</h2><button data-preferences-close aria-label="Close preferences">'+icon('m6 6 12 12M6 18 18 6')+'</button></div><label class="web-drawer-setting"><span>Autoplay next episode</span><input type="checkbox" data-mobile-autoplay '+(protectedStorage.getItem('mj-autoplay-next')!=='false'?'checked':'')+'></label>'+playbackDefaults()+'<hr><label class="web-drawer-setting"><span>Share usage diagnostics</span><input type="checkbox" data-mobile-diagnostics '+(diagnosticsAllowed()?'checked ':'')+(diagnosticsLocked()?'disabled':'')+'></label><p>'+(diagnosticsLocked()?'Your browser privacy preference keeps sharing off.':'Optional usage and playback-error reports help us find problems. Your choice is saved in this browser.')+'</p><a href="/download/privacy.html" target="_blank" rel="noopener noreferrer">Privacy policy</a>';
  dialog.addEventListener('change',change);dialog.addEventListener('cancel',e=>{e.preventDefault();closePreferences();});dialog.addEventListener('click',e=>{if(e.target.closest('[data-preferences-close]'))closePreferences();else if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePreferences();}});document.body.append(dialog);dialog.showModal();
 };
 const click=e=>{ 
  const button=e.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-desktop-preferences')){openPreferences(button);return;}
  if(button.hasAttribute('data-mobile-menu')){if(root.querySelector('.web-mobile-drawer:not([hidden])')){close();return;}returnFocus=button;const drawer=root.querySelector('.web-mobile-drawer');drawer.hidden=false;button.setAttribute('aria-expanded','true');document.body.classList.add('web-mobile-drawer-open');drawer.querySelector('aside').focus();return;}
  if(button.hasAttribute('data-mobile-close')){close();return;}
  if(button.hasAttribute('data-mobile-refresh')){void refreshContent(button);return;}
  if(button.dataset.mobileInfo){const info=root.querySelector('.web-mobile-info');info.hidden=false;
   if(button.dataset.mobileInfo==='privacy')info.innerHTML='<h3>Privacy</h3><label class="web-drawer-setting"><span>Share usage diagnostics</span><input type="checkbox" data-mobile-diagnostics '+(diagnosticsAllowed()?'checked ':'')+(diagnosticsLocked()?'disabled':'')+'></label><p>Optional usage and playback-error reports help us find problems. We omit title names, searches and stream links. '+(diagnosticsLocked()?'Your browser privacy preference keeps sharing off.':'Your choice is saved in this browser.')+'</p><a href="/download/privacy.html" target="_blank" rel="noopener noreferrer">Privacy policy</a>';
   else if(button.dataset.mobileInfo==='preferences')info.innerHTML='<h3>Preferences</h3><label class="web-drawer-setting"><span>Autoplay next episode</span><input type="checkbox" data-mobile-autoplay '+(protectedStorage.getItem('mj-autoplay-next')!=='false'?'checked':'')+'></label>'+playbackDefaults()+'';
   else if(button.dataset.mobileInfo==='updates'){info.innerHTML='<h3>Updates</h3><p>Web updates arrive when you refresh or reopen MJ Play.</p><a href="/download/#version" target="_blank" rel="noopener noreferrer">Android release &amp; download</a>';}
   else info.innerHTML='<h3>About</h3><p>'+esc(aboutMJPlay.headline)+'</p><p>'+esc(aboutMJPlay.origin)+'</p><p>Developed by: <strong>'+esc(aboutMJPlay.developer)+'</strong></p><p>'+esc(aboutMJPlay.copyright)+'</p><p><em>'+esc(aboutMJPlay.tagline)+'</em></p><small>This product uses the TMDB API but is not endorsed or certified by TMDB.</small>';
   returnFocus=button;const dialog=document.createElement('dialog');dialog.className='web-preferences-dialog web-menu-dialog';dialog.setAttribute('aria-label',button.textContent.trim());dialog.innerHTML='<div class="web-preferences-heading"><h2>'+esc(button.textContent.trim())+'</h2><button data-menu-dialog-close aria-label="Close '+esc(button.textContent.trim())+'">'+icon('m6 6 12 12M6 18 18 6')+'</button></div>'+info.innerHTML.replace(/<h3>.*?<\/h3>/,'');info.hidden=true;info.innerHTML='';dialog.addEventListener('change',change);dialog.addEventListener('cancel',e=>{e.preventDefault();closePreferences();});dialog.addEventListener('click',e=>{if(e.target.closest('[data-menu-dialog-close]'))closePreferences();else if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePreferences();}});document.body.append(dialog);dialog.showModal();
   return;}

  if(button.hasAttribute('data-mobile-search')){
   const section=mobileSection(path());
   if(section==='sports'){root.querySelector('[data-sports-search-open]')?.click();root.querySelector('.sports-search')?.scrollIntoView({block:'nearest'});}
   else if(section==='live'){const opener=root.querySelector('[data-live-search-open]');if(root.querySelector('.live-search')?.hidden)opener?.click();root.querySelector('.live-search [data-search-edit]')?.click();root.querySelector('.live-search')?.scrollIntoView({block:'nearest'});}
   else root.querySelector('header nav:not(.web-mobile-tabs) [data-route="/search"]')?.click();
  }
 };
 const key=e=>{if(document.querySelector('.web-preferences-dialog[open]')){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closePreferences();}return;}const drawer=root.querySelector('.web-mobile-drawer:not([hidden])');if(!drawer||!mobile.matches)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}
  if(e.key==='Tab'){const buttons=[...drawer.querySelectorAll('aside button, aside a, aside input:not(:disabled)')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===drawer.querySelector('aside'))){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 };
 const change=e=>{if(e.target.matches('[data-experimental-transport]'))setExperimentalTransport(e.target.value);if(e.target.matches('[data-default-subtitles]'))protectedStorage.setItem('mj-subtitle-language',e.target.checked?'en':'off');if(e.target.matches('[data-default-quality]'))setQualityPreference(e.target.value);if(e.target.matches('[data-mobile-diagnostics]'))setDiagnostics(e.target.checked);if(e.target.matches('[data-mobile-autoplay]'))protectedStorage.setItem('mj-autoplay-next',String(e.target.checked));};
 const communityChanged=()=>{const drawer=root.querySelector('.web-mobile-drawer');if(drawer)paintCommunity(drawer);paintFooter();};
 function paintFooter(){const footer=root.querySelector('footer');if(!footer)return;const {links}=publicCommunity();const stamp=JSON.stringify(links);if(footer.dataset.communityStamp===stamp)return;footer.dataset.communityStamp=stamp;footer.classList.add('web-footer');footer.innerHTML='<nav class="web-footer-community" aria-label="MJ Play links">'+links.map(link=>'<a href="'+esc(link.url)+'" target="_blank" rel="noopener noreferrer">'+communityIcon(link.platform)+'<span>'+esc(link.label)+'</span></a>').join('')+'<button data-mobile-info="about">About</button><button data-mobile-info="privacy">Privacy</button></nav><div class="web-footer-credits"><span>'+esc(aboutMJPlay.copyright)+'</span><span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span></div>';}

 function paintCommunity(drawer){const {links,tagline}=publicCommunity();drawer.querySelector('[data-drawer-tagline]').textContent=tagline;const box=drawer.querySelector('[data-drawer-community]');box.innerHTML=links.length?'<h3>Community</h3>'+links.map(link=>'<a href="'+esc(link.url)+'" target="_blank" rel="noopener noreferrer">'+communityIcon(link.platform)+'<span>'+esc(link.label)+'</span></a>').join(''):'';}
 async function refreshContent(button){button.disabled=true;const status=root.querySelector('[data-drawer-status]');status.textContent='Refreshingâ€¦';const ok=await refreshPublicConfig();if(!button.isConnected)return;button.disabled=false;status.textContent=ok?'Settings refreshed. Reloading contentâ€¦':'Reloading contentâ€¦';location.reload();}
 let pullStart;
 const pullDown=e=>{if(!mobile.matches||!mobileSection(path())||window.scrollY>0||e.touches.length!==1||e.target.closest('button,a,input,dialog,.web-mobile-drawer,header'))return;pullStart={x:e.touches[0].clientX,y:e.touches[0].clientY};};
 const pullMove=e=>{if(!pullStart)return;const dy=e.touches[0].clientY-pullStart.y,dx=Math.abs(e.touches[0].clientX-pullStart.x);if(dx>30||dy<0){pullStart=null;return;}if(dy>15&&e.cancelable)e.preventDefault();};
 const pullEnd=e=>{if(!pullStart)return;const dy=e.changedTouches[0].clientY-pullStart.y;pullStart=null;if(dy>90){const status=document.createElement('div');status.className='web-refresh-tip';status.setAttribute('role','status');status.textContent='Refreshing content…';document.body.append(status);void refreshPublicConfig().then(ok=>{status.textContent=ok?'Refreshed. Loading latest content…':'Reloading content. App settings could not refresh.';setTimeout(()=>location.reload(),ok?350:1400);});}};
 root.addEventListener('touchstart',pullDown,{passive:true});root.addEventListener('touchmove',pullMove,{passive:false});root.addEventListener('touchend',pullEnd);const pullCancel=()=>{pullStart=null;};root.addEventListener('touchcancel',pullCancel);

 let touchStart;
 const touchDown=e=>{if(e.target.closest('.web-mobile-drawer aside'))touchStart={x:e.clientX,y:e.clientY};};
 const touchUp=e=>{if(touchStart&&touchStart.x-e.clientX>70&&Math.abs(touchStart.y-e.clientY)<70)close();touchStart=null;};
 root.addEventListener('change',change);root.addEventListener('pointerdown',touchDown);root.addEventListener('pointerup',touchUp);document.addEventListener('mj-config-updated',communityChanged);
 const resize=()=>{if(!mobile.matches)close();schedule();};
 const observer=new MutationObserver(schedule);observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});root.addEventListener('click',click);document.addEventListener('keydown',key,true);window.addEventListener('hashchange',schedule);mobile.addEventListener('change',resize);enhance();
 return()=>{window.removeEventListener('scroll',updateMatchContext);root.removeEventListener('touchstart',pullDown);root.removeEventListener('touchmove',pullMove);root.removeEventListener('touchend',pullEnd);root.removeEventListener('touchcancel',pullCancel);closePreferences();document.removeEventListener('mj-config-updated',communityChanged);root.removeEventListener('change',change);root.removeEventListener('pointerdown',touchDown);root.removeEventListener('pointerup',touchUp);observer.disconnect();root.removeEventListener('click',click);document.removeEventListener('keydown',key,true);window.removeEventListener('hashchange',schedule);mobile.removeEventListener('change',resize);document.body.classList.remove('web-mobile-has-bottom','web-mobile-drawer-open');};
}

function communityIcon(platform){const paths={tiktok:'M14 3v12a4 4 0 1 1-4-4m4-8c0 4 3 6 6 6',instagram:'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm9 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0m1-6h1',telegram:'m3 11 18-8-5 18-5-7-8-3Zm8 3 10-11',youtube:'M3 7h18v10H3Zm7 2 5 3-5 3Z',facebook:'M15 3h-3a3 3 0 0 0-3 3v15m-4-11h12',x:'m4 3 16 18M20 3 4 21',whatsapp:'M20 12a8 8 0 0 1-12 7l-5 2 2-5a8 8 0 1 1 15-4Zm-11-4c0 4 3 7 7 7'};return icon(paths[platform]||'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18');}
