export function decorateTitleAction(button){
 const key=button.dataset.focus;
 if(!['detail-save','detail-like','detail-dislike','detail-remove-recent'].includes(key))return;
 button.classList.add('title-icon-action');
 if(key==='detail-remove-recent'){button.classList.add('title-remove-action');button.setAttribute('aria-label','Remove from Continue Watching');const label=button.querySelector('span');if(label)label.textContent='Remove';}
 else if(key==='detail-save')paintTitleSaveButton(button,button.getAttribute('aria-pressed')==='true');
 else button.setAttribute('aria-label',key==='detail-like'?'Like':'Not for me');
}
export function paintTitleSaveButton(button,saved){
 const label=saved?'Remove from My List':'Add to My List';button.setAttribute('aria-label',label);
 const span=button.querySelector('span');if(span)span.textContent='My List';else button.textContent=saved?'Remove from My List':'＋ My List';
 const path=button.querySelector('svg path');if(path)path.setAttribute('d',saved?'m5 12 4 4L19 6':'M12 5v14M5 12h14');
}
export function titleProgress(progress){
 const duration=Number(progress?.duration),position=Number(progress?.position);
 if(!Number.isFinite(duration)||!Number.isFinite(position)||duration<=0||position<=0||progress.completed)return '';
 const percent=Math.min(100,Math.max(0,position/duration*100));
 return '<div class="title-saved-progress"><div role="progressbar" aria-label="Viewing progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(percent)+'"><span style="width:'+percent+'%"></span></div><small>'+Math.floor(Math.min(position,duration)/60)+' of '+Math.ceil(duration/60)+' min</small></div>';
}
