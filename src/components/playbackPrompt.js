export function focusPlaybackPrompt(button,panel,blocked=false){
 if(blocked||!panel.hidden||!button?.focus)return false;
 const active=panel.ownerDocument?.activeElement;
 if(active?.closest?.('[data-modal]')||active?.closest?.('[data-playback-prompt]:not([hidden])'))return false;
 button.focus({preventScroll:true});return true;
}
export function releasePlaybackPrompt(element,video){if(element.contains?.(video.ownerDocument.activeElement)){video.tabIndex=-1;video.focus?.({preventScroll:true});}}
