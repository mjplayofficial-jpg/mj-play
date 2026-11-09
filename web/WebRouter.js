import {Router as AppRouter} from '../src/router.js';
const tabs=new Set(['/search','/tv','/movies','/settings','/live-tv','/sports']);
const valid=value=>value&&Number.isSafeInteger(value.index)&&value.index>=0&&typeof value.current?.path==='string'&&value.current.path.startsWith('/')&&Array.isArray(value.stack);
export class Router extends AppRouter{
 constructor(render,focus){super(render,focus);this.webIndex=0;this.webStarted=false;this.webPopping=false;window.addEventListener('popstate',event=>{const saved=event.state?.mjPlayWeb;if(!valid(saved))return;this.webIndex=saved.index;this.stack=saved.stack;this.current=saved.current;this.webPopping=true;this.backPending=false;void super.go(this.current.path,this.current.state,true).finally(()=>{this.webPopping=false;});});}
 webSave(){return JSON.parse(JSON.stringify({index:this.webIndex,current:this.current,stack:this.stack}));}
 webWrite(replace){const saved=this.webSave();window.history[replace?'replaceState':'pushState']({mjPlayWeb:saved},'', '#'+this.current.path);}
 async go(path,state={},replace=false){
  if(path==='/settings'){path='/';state={};}
  if(!this.webStarted){this.webStarted=true;const saved=window.history.state?.mjPlayWeb;if(valid(saved)&&saved.current.path!=='/settings'){this.webIndex=saved.index;this.current=saved.current;this.stack=saved.stack;await super.go(this.current.path,this.current.state,true);return;}await super.go(path,state,replace);this.webWrite(true);return;}
  if(this.webPopping)return super.go(path,state,replace);
  // Record the screen being left, including its selected tile and scroll.
  this.current={...this.current,focus:document.activeElement?.dataset.focus,scroll:window.scrollY,rowScroll:document.activeElement?.closest?.('.media-row')?.scrollLeft||0};this.webWrite(true);
  const previous=this.current.path,replaceEntry=replace||path===previous||tabs.has(path)&&previous!=='/'&&tabs.has(previous);
  await super.go(path,state,replace);if(!replaceEntry)this.webIndex++;this.webWrite(replaceEntry);
 }
 async back(){if(this.backPending)return;if(this.webIndex>0){this.backPending=true;window.history.back();return;}return super.back();}
}
