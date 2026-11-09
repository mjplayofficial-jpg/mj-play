import {decorateTitleAction} from './titleActionPresentation.js';
export function enhanceTVTitleActions(root){
 const actions=root.querySelector('[data-title-actions]');if(!actions||actions.classList.contains('tv-title-actions'))return;
 actions.classList.add('tv-title-actions');
 const primary=document.createElement('div'),secondary=document.createElement('div');primary.className='tv-title-primary';secondary.className='tv-title-secondary';
 const paths={'detail-save':'M12 5v14M5 12h14','detail-remove-recent':'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14','detail-watched':'m5 12 4 4L19 6','detail-back':'m14 5-7 7 7 7','detail-related':'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z'};
 for(const button of [...actions.children]){const key=button.dataset.focus;if(['detail-play','detail-continue','detail-restart','detail-choose','detail-trailer'].includes(key)){primary.append(button);continue;}if(paths[key]&&!button.querySelector('svg')){const label=button.textContent.trim().replace(/^[＋+]\s*/,'');button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+paths[key]+'"/></svg><span></span>';button.querySelector('span').textContent=label;}decorateTitleAction(button);secondary.append(button);}
 actions.append(primary,secondary);
}

