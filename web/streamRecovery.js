// A playback session has a finite recovery budget, including failed renewals.
export function createStreamRecovery({refresh,reload,snapshot,onFailure,maxAttempts=2}){
 let attempts=0,pending=null,disposed=false,failed=false;
 const fail=()=>{if(!failed&&!disposed){failed=true;onFailure();}};
 return {
  recover(){
   if(disposed||failed)return Promise.resolve(false);
   if(pending)return pending;
   if(attempts>=maxAttempts){fail();return Promise.resolve(false);}
   attempts++;const state=snapshot();
   pending=(async()=>{try{const source=await refresh();if(disposed)return false;await reload(source,state);return !disposed;}catch{fail();return false;}finally{pending=null;}})();return pending;
  },
  dispose(){disposed=true;},
 };
}
