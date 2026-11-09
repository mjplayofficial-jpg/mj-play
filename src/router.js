export class Router {
 constructor(render,focus){this.render=render;this.focus=focus;this.stack=[];this.current={path:'/',state:{}};this.serial=0;}
 async go(path,state={},back=false){
  this.cancelRestore?.();
  if(!back){
   const previous={...this.current,focus:document.activeElement?.dataset.focus,scroll:window.scrollY,rowScroll:document.activeElement?.closest?.('.media-row')?.scrollLeft||0};
   if(previous.focus?.startsWith('recent-')){const tiles=[...document.activeElement?.closest?.('.media-row')?.querySelectorAll?.('[data-focus]')||[]],index=tiles.indexOf(document.activeElement);previous.focusAlternatives=[...tiles.slice(index+1),...tiles.slice(0,index).reverse()].map(t=>t.dataset.focus);}
   if(path==='/')this.stack=[];
   else if(['/search','/tv','/movies','/settings','/live-tv','/sports'].includes(path)){
    const home=this.current.path==='/'?previous:this.stack.find(entry=>entry.path==='/');
    this.stack=[home||{path:'/',state:{},focus:'hero-play',scroll:0}];
   }else if(path!==this.current.path){
    if(path==='/live-trial'&&this.current.path!=='/live-tv'&&this.current.path!=='/sports/event')this.stack=[{path:'/',state:{},focus:'hero-play',scroll:0},{path:'/live-tv',state:{},focus:'live-filter-popular',scroll:0}];
    else this.stack.push(previous);
   }
  }
  this.current=back?{...this.current,path,state}:{path,state};const serial=++this.serial;await this.render(path,state,serial,{back,focus:this.current.focus});if(serial!==this.serial)return;const scroll=back?(this.current.scroll||0):0;window.scrollTo(0,scroll);const key=(back?this.current.focus:state.initialFocus)||state.initialFocus;
  const scope=this.focus.root,find=()=>[key,...(back?this.current.focusAlternatives||[]:[])].map(k=>scope?.querySelector?.('[data-focus='+JSON.stringify(k)+']')).find(Boolean);const rowScroll=this.current.rowScroll||0;
  const restore=()=>{window.scrollTo(0,scroll);const target=find(),row=back&&target?.closest?.('.media-row');if(row)row.scrollLeft=rowScroll;this.focus.restore(target?.dataset?.focus||key);target?.scrollIntoView?.({block:'nearest',inline:'nearest'});};
  if(back&&key&&scope&&!find()&&typeof MutationObserver==='function'){
   // Browse rows arrive asynchronously. Wait for the saved card instead of selecting a fallback.
   let timer;const stop=()=>{observer.disconnect();clearTimeout(timer);document.removeEventListener('keydown',stop,true);document.removeEventListener('pointerdown',stop,true);if(this.cancelRestore===stop)this.cancelRestore=null;};
   const observer=new MutationObserver(()=>{if(serial!==this.serial){stop();return;}if(find()){stop();restore();}});
   observer.observe(scope,{childList:true,subtree:true});document.addEventListener('keydown',stop,true);document.addEventListener('pointerdown',stop,true);timer=setTimeout(()=>{stop();if(serial===this.serial)this.focus.restore(key);},10000);this.cancelRestore=stop;
  }else restore();
 }
 async back(){if(this.backPending)return;this.backPending=true;try{const previous=this.stack.pop();if(previous){this.current=previous;await this.go(previous.path,previous.state,true);}else if(this.current.path!=='/')await this.go('/',{},true);else this.focus.restore('nav-Home');}finally{this.backPending=false;}}
}

