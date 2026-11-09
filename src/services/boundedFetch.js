export async function boundedFetch(url,{signal,timeoutMs=5000,...options}={}){
 const controller=new AbortController(),abort=()=>controller.abort();
 if(signal?.aborted)controller.abort();else signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(abort,timeoutMs);
 try{const response=await fetch(url,{...options,signal:controller.signal});const text=await response.text();return {ok:response.ok,status:response.status,text};}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
