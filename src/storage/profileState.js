export const profileState={enabled:false,id:'me'};
export const profileKeys=['mjplay.video.quality.v1','mjplay.recent.v1','mjplay.favorites.v1','mjplay.progress.v1','mjplay.taste.v1','mj-subtitle-language','mj-subtitle-size','mj-autoplay-next','mj-live-favourites','mjplay.search.history.v1'];
export const isProfileKey=key=>profileKeys.includes(key)||key.startsWith('mjplay.subtitle.offset.v2/');
export const resolveProfileKey=key=>profileState.enabled&&isProfileKey(key)?'mjplay.profile.'+profileState.id+'/'+key:key;
