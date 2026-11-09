// Creates only the parent-owned element; never reads the third-party frame DOM.
export function createPlaybackIframe(document,source){
 const frame=document.createElement('iframe');
 frame.title=source.label||'External playback';
 frame.tabIndex=0;
 frame.setAttribute('data-focus','player-frame');
 frame.referrerPolicy='no-referrer';
 frame.allow='autoplay; fullscreen; encrypted-media; picture-in-picture';
 frame.allowFullscreen=true;
 if(source.useSandbox===false||source.sandbox===null)frame.removeAttribute('sandbox');
 else frame.setAttribute('sandbox',source.sandbox??'allow-scripts allow-same-origin allow-forms allow-presentation');
 return frame;
}
