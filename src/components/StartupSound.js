// Original MJ Play signature, synthesized through the Web Audio sound-effect path.
export function startupSamples(rate){
 const frames=Math.round(rate*1.4),samples=new Float32Array(frames);
 for(let i=0;i<frames;i++){
  const t=i/rate;
  let value=(1-Math.exp(-t*65))*Math.exp(-t*7)*.22*Math.sin(2*Math.PI*98*t);
  for(const [start,freq,gain] of [[.12,392,.17],[.34,493.883,.15],[.57,659.255,.19]]){
   const age=t-start;if(age<0)continue;
   value+=gain*(1-Math.exp(-age*110))*Math.exp(-age*4.3)*(Math.sin(2*Math.PI*freq*age)+.2*Math.sin(2*Math.PI*freq*2.003*age)+.06*Math.sin(2*Math.PI*freq*3*age));
  }
  samples[i]=value*Math.min(1,(frames-i)/(rate*.15));
 }
 return samples;
}
export function startStartupSound(){
 let context,source,stopped=false;
 const stop=()=>{
  if(stopped)return;stopped=true;
  try{source?.stop();source?.disconnect();}catch{}
  try{context?.close()?.catch(()=>{});}catch{}
 };
 try{
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!AudioContext)throw new Error('Web Audio unavailable');
  context=new AudioContext();
  const samples=startupSamples(context.sampleRate);
  const buffer=context.createBuffer(1,samples.length,context.sampleRate);
  buffer.getChannelData(0).set(samples);
  source=context.createBufferSource();source.buffer=buffer;
  const gain=context.createGain();gain.gain.value=.8;
  source.connect(gain);gain.connect(context.destination);
  const play=()=>{if(!stopped&&context.state==='running'){source.start();console.info('MJ Play startup sound started (Web Audio).');}};
  if(context.state==='running')play();
  else context.resume().then(play).catch(error=>console.warn('MJ Play startup sound unavailable:',error.name));
 }catch(error){console.warn('MJ Play startup sound unavailable:',error.message);stop();}
 return stop;
}
