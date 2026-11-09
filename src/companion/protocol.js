export const VERSION=1;
export const directions=['up','down','left','right'];
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
export function validCommand(message){
 if(!object(message)||message.version!==VERSION||message.type!=='command'||typeof message.requestId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(message.requestId))return false;
 if(Object.keys(message).some(key=>!['version','type','requestId','command','args'].includes(key)))return false;
 const args=message.args??{};if(!object(args))return false;
 if(message.command==='navigate')return Object.keys(args).length===1&&directions.includes(args.direction);
 return ['activate','back','home'].includes(message.command)&&Object.keys(args).length===0;
}
export function minimalState(state){
 return {connected:state?.connected===true,route:typeof state?.route==='string'&&/^\/(?:|movies|tv|search|my-list|settings|player|(?:movie|tv)\/\d+)$/.test(state.route)?state.route:'/',pairedDeviceCount:Number.isSafeInteger(state?.pairedDeviceCount)&&state.pairedDeviceCount>=0&&state.pairedDeviceCount<=5?state.pairedDeviceCount:0};
}
