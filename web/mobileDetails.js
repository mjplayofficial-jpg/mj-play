import {decorateTitleAction} from './components/titleActionPresentation.js';
const icon=path=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
export function mountMobileDetails(){
 const root=document.querySelector('#app');
 const enhance=()=>{
  const details=root.querySelector('.details');
  const watched=details?.querySelector('[data-mark-watched]');if(watched&&!watched.querySelector('svg')){const label=watched.textContent.trim();watched.innerHTML=icon('m5 12 4 4L19 6');const text=document.createElement('span');text.textContent=label;watched.append(text);watched.classList.add('title-icon-action');watched.setAttribute('aria-label',label);}
  if(!details||details.dataset.mobileReady)return;details.dataset.mobileReady='true';
  const actions=details.querySelector('[data-title-actions]'),copy=details.querySelector('.detail-copy');if(!actions||!copy)return;
  const primary=document.createElement('div');primary.className='web-detail-primary';const secondary=document.createElement('div');secondary.className='web-detail-secondary';
  for(const b of [...actions.children]){const name=b.dataset.focus||'';if(['detail-play','detail-continue','detail-restart','detail-choose','detail-trailer'].includes(name))primary.append(b);else secondary.append(b);}
  actions.append(primary,secondary);
  const symbols={'detail-save':'M12 5v14M5 12h14','detail-remove-recent':'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14','detail-watched':'m5 12 4 4L19 6','detail-back':'m14 5-7 7 7 7','detail-related':'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z'};
  for(const b of secondary.children){const label=b.textContent.trim().replace(/^[＋+]\s*/, "");b.setAttribute('aria-label',label);if(!b.querySelector('svg'))b.insertAdjacentHTML('afterbegin',icon(symbols[b.dataset.focus]||'M4 12h16'));if(!b.querySelector('span')){const span=document.createElement('span');span.textContent=label;b.replaceChildren(b.querySelector('svg'),span);}}
  for(const button of secondary.children){decorateTitleAction(button);if(button.dataset.focus==='detail-watched')button.classList.add('title-icon-action');}
  const cast=details.querySelector('.cast');if(cast){const heading=cast.querySelector('strong'),row=document.createElement('div');row.className='web-cast-row';for(const b of [...cast.querySelectorAll('button')])row.append(b);cast.replaceChildren(...(heading?[heading]:[]),row);}
  const image=details.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];if(image){const art=document.createElement('div');art.className='web-detail-art';art.style.backgroundImage='url('+JSON.stringify(image)+')';art.setAttribute('aria-hidden','true');details.prepend(art);}
  const back=document.createElement('button');back.className='web-detail-close';back.dataset.back='';back.setAttribute('aria-label','Back to browsing');back.innerHTML=icon('M14 5 7 12l7 7');details.prepend(back);
  const seasons=root.querySelector('.seasons');if(!seasons)return;
  const heading=seasons.querySelector('h2'),selector=seasons.querySelector('.season-selector');const line=document.createElement('div');line.className='web-episode-heading';heading.textContent='Episodes';heading.before(line);line.append(heading);
  if(selector?.querySelector(".season-picker")){selector.classList.add("web-season-picker");line.append(selector);}else if(selector){const select=document.createElement('select');select.className='web-season-select';select.setAttribute('aria-label','Season');for(const b of selector.querySelectorAll('button')){const option=new Option(b.textContent.replace(' · Selected',''),b.dataset.seasonRoute);option.selected=b.getAttribute('aria-pressed')==='true';select.add(option);}select.onchange=()=>selector.querySelector('[data-season-route="'+select.value+'"]').click();line.append(select);}
  const spoiler=document.createElement('button');spoiler.className='web-spoiler-toggle';spoiler.textContent='Hide episode spoilers';spoiler.setAttribute('aria-pressed','false');spoiler.onclick=()=>{const hidden=seasons.classList.toggle('web-hide-spoilers');spoiler.setAttribute('aria-pressed',String(hidden));spoiler.textContent=hidden?'Show episode spoilers':'Hide episode spoilers';};line.after(spoiler);
 };
 const observer=new MutationObserver(enhance);observer.observe(root,{childList:true,subtree:true});enhance();return()=>observer.disconnect();
}



