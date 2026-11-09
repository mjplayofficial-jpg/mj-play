import {validCommand} from './protocol.js';
export function createCompanionActions({focus,router,back,modalOpen}){
 return async message=>{
  if(!validCommand(message)||modalOpen())throw Error('Command unavailable');
  if(message.command==='navigate'){
   if(router.current.path==='/player')throw Error('Player navigation unsupported in Stage 1');
   focus.navigate(message.args.direction);
  }else if(message.command==='activate'){
   if(router.current.path==='/player')throw Error('Player controls unsupported in Stage 1');
   focus.activate();
  }else if(message.command==='back')await back();
  else if(message.command==='home')await router.go('/');
 };
}
