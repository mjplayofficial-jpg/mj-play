import {paintTitleSaveButton} from './components/titleActionPresentation.js';
import {enhanceTVTitleActions} from './components/TVTitleActions.js';
import {ActorPage,mountActor} from './pages/ActorPage.js';
import {showUndo} from './components/LibraryActions.js';
import {startCloudBackup} from './services/privateBackup.js';
import {ProfilesPage} from './pages/ProfilesPage.js';
import {selectProfile} from './storage/profiles.js';
import {SportsPlayerPage,mountSportsPlayer} from './pages/SportsPlayerPage.js';
import {SportsPage,mountSports,SportsEventPage,mountSportsEvent} from './pages/SportsPage.js';
import {protectedStorage} from './storage/protectedStorage.js';
import {LiveTVPage,mountLiveTV} from './pages/LiveTVPage.js';
import {LiveTrialPage,mountLiveTrial} from './pages/LiveTrialPage.js';
import {clearSearchHistory} from './storage/searchHistory.js';
import {findNextEpisode} from './components/nextEpisode.js';
import {slideToSection,createTitleConfirmation} from './components/TitleActions.js';
import {mountDirectPreparation} from './components/DirectPreparation.js';
import {mountTitleExtras} from './components/TitleExtras.js';
import {mountRecentEpisodes,mountRelatedTitles} from './components/DiscoveryShelves.js';
import {GenreGridPage,mountGenreGrid} from './pages/GenreGridPage.js';
import {mountBrowsePreview} from './components/BrowsePreview.js';
import {GenrePage} from './pages/GenrePage.js';
import {Router} from './router.js';
import {FocusManager} from './navigation/FocusManager.js';
import {header} from './components/Header.js';
import {loading,errorScreen} from './components/ui.js';
import {tmdb} from './services/tmdb.js';
import {HomePage,mountHome} from './pages/HomePage.js';
import {BrowsePage} from './pages/BrowsePage.js';
import {SearchPage,mountSearch} from './pages/SearchPage.js';
import {DetailsPage} from './pages/DetailsPage.js';
import {PlayerPage,mountPlayer} from './pages/PlayerPage.js';
import {MyListPage} from './pages/MyListPage.js';
import {SettingsPage,mountSettings} from './pages/SettingsPage.js';
import {library} from './storage/library.js';
import {selectPlaybackProvider,initializeDirectDefault} from './config/playback.js';
import {createExitDialog} from './components/ExitDialog.js';
import {startStartup} from './components/Startup.js';
import {progressStore} from './storage/progress.js';
import {removeRecentTile} from './components/RecentRemoval.js';
import {TVCompanionClient} from './companion/TVClient.js';
import {companionConfig} from './companion/config.js';
import {createCompanionUI} from './companion/CompanionUI.js';
import {createCompanionActions} from './companion/actions.js';
initializeDirectDefault();
const startup=startStartup();const stopCloudBackup=startCloudBackup();window.addEventListener('pagehide',stopCloudBackup);
const root=document.querySelector('#app');let cleanup=()=>{};let router;
let companionUI,companionClient;const titleConfirmation=createTitleConfirmation(root);
const handleBack=()=>{const picker=root.querySelector(".season-picker[open],.actor-sort-picker[open]");if(picker){picker.open=false;picker.querySelector("summary").focus();return;}if(titleConfirmation.isOpen()){titleConfirmation.cancel();return;}if(companionUI?.back())return; if(exitDialog.isOpen())exitDialog.cancel();else if(router.current.path==='/profiles'||!router.stack.length&&router.current.path==='/')exitDialog.show();else return router.back();};
const focus=new FocusManager(root,handleBack);
const exitDialog=createExitDialog(root,focus);
router=new Router(async(path,state,serial,navigation={})=>{titleConfirmation.cancel();cleanup();cleanup=()=>{};const player=path==='/player',live=path==='/live-trial',sportsPlayer=path==='/sports/player';if((!navigation.back||!navigation.focus)&&['/movies','/tv'].includes(path))state.initialFocus='genre-drama';if((!navigation.back||!navigation.focus)&&path==='/')state.initialFocus='hero-play';if((!navigation.back||!navigation.focus)&&path==='/live-tv')state.initialFocus='live-filter-popular';if((!navigation.back||!navigation.focus)&&path==='/sports')state.initialFocus='sports-filter-'+(state.sportsCategory||'Match');if(path==='/sports/event'&&!navigation.back)state.initialFocus=state.event?.servers?.length?'sports-watch-primary':'sports-event-back';const preserveGenre=state.genreTransition===true&&!!root.querySelector('.genre-filters');if(!preserveGenre)root.innerHTML=(player||live||sportsPlayer||path==='/profiles'||path.startsWith('/genre/')?'':header(path,tmdb.demo))+'<main>'+loading()+'</main>';let html;
try{if(path==='/profiles')html=ProfilesPage();else if(path==='/')html=await HomePage(state);else if(path==='/movies'||path==='/tv')html=await BrowsePage(path==='/movies'?'movie':'tv');else if(/^\/genre\/[a-z]+$/.test(path))html=await GenrePage(path.split('/')[2],state);else if(/^\/genre\/[a-z]+\/(movie|tv)\/([a-z]+)$/.test(path))html=await GenreGridPage(...path.split('/').slice(2),state);else if(/^\/person\/\d+$/.test(path))html=await ActorPage(path.split('/')[2],state);else if(path==='/search')html=await SearchPage(state);else if(path==='/my-list')html=MyListPage();else if(path==='/settings')html=SettingsPage();else if(path==='/live-tv')html=LiveTVPage();else if(path==='/sports')html=SportsPage();else if(path==='/sports/event')html=SportsEventPage(state);else if(sportsPlayer)html=SportsPlayerPage(state);else if(live)html=LiveTrialPage(state);else if(player)html=PlayerPage(state);else{const match=path.match(/^\/(movie|tv)\/(\d+)$/);if(!match)throw new Error('Unknown page');html=await DetailsPage(match[1],match[2],state);} }catch(e){console.warn('Screen could not load:',e.name);html=errorScreen();}
if(serial!==router.serial)return;root.querySelector('main').innerHTML=html;if(globalThis.location?.protocol==='file:')enhanceTVTitleActions(root);root.querySelector('main').classList.toggle('genre-refresh',preserveGenre);delete state.genreTransition;if(sportsPlayer){cleanup=mountSportsPlayer(root,state,{onBack:()=>router.back()});}else if(live){cleanup=mountLiveTrial(root,state,{onBack:()=>router.back(),onOriginal:()=>router.go('/live-trial',{...state,useOriginalLive:true},true),onSwitch:channel=>router.go('/live-trial',{channel,previousChannel:state.channel},true)});}else if(path==='/live-tv'){cleanup=mountLiveTV(root,state,channel=>router.go('/live-trial',{channel}));}else if(path==='/sports'){cleanup=mountSports(root,state,event=>router.go('/sports/event',{event}));}else if(path==='/sports/event'){cleanup=mountSportsEvent(root,state,value=>value.sportsEmbed?router.go('/sports/player',value):router.go('/live-trial',{channel:value}));}else if(player){let nextPromise;const prepareNextEpisode=()=>nextPromise??=(findNextEpisode(tmdb,state.item,state.season,state.episode).catch(error=>{nextPromise=null;throw error;}));cleanup=mountPlayer(state,root,{onCancel:()=>router.back(),prepareNextEpisode,onNextEpisode:async()=>{const next=await prepareNextEpisode();if(!next)return false;await router.go('/player',{...state,...next,restart:true},true);return true;}});}else {if(path==='/settings')cleanup=mountSettings(root,{confirm:(message,label)=>titleConfirmation.ask(message,{confirmLabel:label||'Continue'}),reload:()=>router.go('/settings',{},true)});if(path==='/search')cleanup=mountSearch(root,state);if(/^\/person\/\d+$/.test(path))cleanup=mountActor(root,state);if(path==='/'||path==='/movies'||path==='/tv'||path.startsWith('/genre/')||/^\/(movie|tv)\/\d+$/.test(path)){const stopPreview=mountBrowsePreview(root);const parts=path.split('/');const stopGrid=parts.length===5&&parts[1]==='genre'?mountGenreGrid(root,...parts.slice(2),state):()=>{};const detail=path.match(/^\/(movie|tv)\/(\d+)$/);const stopPreparation=()=>{};const stopExtras=detail?mountTitleExtras(root,detail[1],detail[2]):()=>{};const stopRelated=detail?mountRelatedTitles(root,detail[1],detail[2],tmdb,state):()=>{};const stopRecent=path==='/'?mountRecentEpisodes(root):()=>{};const stopHome=path==='/'?mountHome(root,state,{focusFeatured:!navigation.back||!navigation.focus}):()=>{};cleanup=()=>{stopHome();stopPreparation();stopExtras();stopRecent();stopRelated();stopGrid();stopPreview();};}if(path!=='/profiles')root.querySelector('main').insertAdjacentHTML('beforeend','<footer>This product uses the TMDB API but is not endorsed or certified by TMDB. <span>↑ ↓ ← → Navigate &nbsp; OK Select &nbsp; BACK Return</span></footer>');}companionUI?.render();companionClient?.publish();
},focus);
const companionActions=createCompanionActions({focus,router,back:handleBack,modalOpen:()=>companionUI?.isOpen()||exitDialog.isOpen()});
companionClient=new TVCompanionClient({...companionConfig,actions:companionActions,getState:()=>({route:router.current.path}),onChange:()=>companionUI?.render()});
companionUI=createCompanionUI(root,focus,companionClient);companionClient.start();
window.addEventListener('pagehide',()=>companionClient.stop());
window.addEventListener('pageshow',event=>{if(event.persisted)companionClient.start();});
root.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;try{if(el.hasAttribute('data-companion-pair'))companionUI.pair();else if(el.hasAttribute('data-companion-close'))companionUI.close();else if(el.dataset.companionDecision)companionUI.decision(el.dataset.companionDecision==='allow');else if(el.dataset.companionRevoke)companionClient.revoke(el.dataset.companionRevoke);}catch{toast('Companion relay is unavailable. Try again.');}});
function toast(message){const notice=document.createElement("p");notice.className="toast";notice.textContent=message;root.append(notice);setTimeout(()=>notice.remove(),4000);}
root.addEventListener('click',async e=>{const el=e.target.closest('button,a');if(!el)return;if(el.dataset.profile){selectProfile(el.dataset.profile);router.stack=[];await router.go('/');return;}if(el.hasAttribute('data-tv-relay-test')){await router.go('/live-trial',{tvRelayTrial:true,channel:{number:38,title:'Sky Sports Main Event · Direct trial'}});}else if(el.dataset.route){e.preventDefault();if(/^\/genre\/[a-z]+$/.test(el.dataset.route)){
 const switching=/^\/genre\/[a-z]+$/.test(router.current.path),state={genreFilter:router.current.path==='/movies'?'movie':router.current.path==='/tv'?'tv':'all',genreTransition:switching,initialFocus:'genre-play'};
 if(switching){router.current.focus=el.dataset.focus;router.current.scroll=window.scrollY;}
 await router.go(el.dataset.route,state,switching);
}else router.go(el.dataset.route);}else if(el.hasAttribute('data-back'))router.back();else if(el.hasAttribute('data-retry'))router.go(router.current.path,router.current.state,true);else if(el.hasAttribute('data-choose-episode')){slideToSection(root,'episode-picker');}else if(el.dataset.section){slideToSection(root,el.dataset.section);}else if(el.dataset.save){const [type,id]=el.dataset.save.split('/');if(library.has(type,id)&&!await titleConfirmation.ask('Remove this title from My List?'))return;el.disabled=true;try{const item=await tmdb.details(type,id);if(!library.toggle(item))throw new Error('Storage unavailable');const saved=library.has(type,id);paintTitleSaveButton(el,saved);el.setAttribute('aria-pressed',String(saved));}catch{toast('Could not save My List. Try again.');}finally{el.disabled=false;}}else if(el.dataset.removeRecent){const [type,id]=el.dataset.removeRecent.split('/');if(!await titleConfirmation.ask('Remove from Continue Watching? Your saved playback position will be kept.'))return;const previousRecent=protectedStorage.getItem('mjplay.recent.v1')||'[]';if(library.removeRecent(type,id)){if(el.closest('.recent-item'))removeRecentTile(el,document);else await router.go(router.current.path,router.current.state,true);showUndo(root,'Removed from Continue Watching',()=>{protectedStorage.setItem('mjplay.recent.v1',previousRecent);router.go(router.current.path,router.current.state,true);});}else toast('Could not update history. Try again.');}else if(el.dataset.provider){try{selectPlaybackProvider(el.dataset.provider);await router.go('/settings',{},true);focus.restore('provider-'+el.dataset.provider);}catch{toast('Could not save your player choice. Try again.');}}else if(el.dataset.genreFilter){if(router.current.state.genreFilter===el.dataset.genreFilter)return;router.current.scroll=window.scrollY;router.current.focus='genre-filter-'+el.dataset.genreFilter;await router.go(router.current.path,{genreFilter:el.dataset.genreFilter,genreTransition:true},true);}else if(el.dataset.preference){try{protectedStorage.setItem(el.dataset.preference,el.dataset.value);await router.go('/settings',{},true);focus.restore(el.dataset.focus);}catch{toast('Could not save preference.');}}else if(el.dataset.searchPage){await router.go('/search',{...router.current.state,page:Number(el.dataset.searchPage)},true);focus.restore('search-input');}else if(el.dataset.searchQuery){await router.go('/search',{query:el.dataset.searchQuery},true);}else if(el.hasAttribute('data-search-history-clear')){clearSearchHistory();await router.go('/search',{},true);}else if(el.dataset.searchFilter){await router.go('/search',{...router.current.state,filter:el.dataset.searchFilter},true);focus.restore('filter-'+el.dataset.searchFilter);}else if(el.hasAttribute('data-search-clear')){await router.go('/search',{},true);focus.restore('search-input');}else if(el.dataset.seasonRoute){await router.go(router.current.path,{...router.current.state,season:Number(el.dataset.seasonRoute)},true);focus.restore('season-'+el.dataset.seasonRoute);}else if(el.dataset.play){const [type,id]=el.dataset.play.split('/');el.disabled=true;try{const item=await tmdb.details(type,id);await router.go('/player',{item,season:Number(el.dataset.season)||1,episode:Number(el.dataset.episode)||1,restart:el.dataset.restart==='true'});}catch(err){const notice=document.createElement('p');notice.className='toast';notice.textContent='This title could not open. Try again.';root.append(notice);setTimeout(()=>notice.remove(),4000);}finally{el.disabled=false;}}});
root.addEventListener('submit',async e=>{if(e.target.id==='search-form'){e.preventDefault();const form=e.target;if(form.dataset.submitting==='true')return;form.dataset.submitting='true';const query=String(new FormData(form).get('query')||'').trim();form.querySelector('[data-search-editor]')?.blur();await router.go('/search',{...router.current.state,query,page:1},true);focus.restore('search-submit');}});
router.go('/profiles',{initialFocus:'profile-me'},true).finally(()=>startup.finish());




















