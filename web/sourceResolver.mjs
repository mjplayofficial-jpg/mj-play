const playerOrigin='https://stellarconductornexus.com',dataOrigin='https://data.vidsrc.sh';
async function read(url,referer,kind='text'){
 const response=await fetch(url,{headers:{Referer:referer,Accept:kind==='json'?'application/json':'*/*'},signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!response.ok)throw Error('Source request unavailable');return kind==='json'?response.json():response.text();
}
const configFrom=(html,key)=>{const match=html.match(new RegExp('window\\.'+key+'\\s*=\\s*({[^\\n]+});<\\/script>'));if(!match)throw Error('Source format changed');return JSON.parse(match[1]);};
export async function resolveWebMovie(imdbId){
 if(!/^tt\d+$/.test(imdbId))throw Error('Invalid movie');
 const outer='https://vsembed.ru/embed/movie/'+imdbId;
 const gate=await read('https://vsembed.ru/vs_src.php?type=movie&id='+imdbId,outer,'json');
 const landing=new URL(gate.src);if(landing.origin!==playerOrigin||landing.pathname!=='/embed/movie/'+imdbId)throw Error('Unexpected player');
 const first=await read(landing,outer),cfg=configFrom(first,'CFG'),player=new URL(cfg.playerUrl,landing);
 if(player.origin!==playerOrigin||player.pathname!=='/embed/player/movie/'+imdbId)throw Error('Unexpected player');
 const html=await read(player,landing.href),config=configFrom(html,'CONFIG'),api=new URL(config.api);
 if(api.origin!==dataOrigin)throw Error('Unexpected media API');if(config.apiToken)api.searchParams.set('api_token',config.apiToken);
 const data=await read(api,player.href,'json');let streams=data.data?.stream_urls;
 if(typeof streams==='string'&&data.vs?.wasm_url){
  const wasmUrl=new URL(data.vs.wasm_url);if(wasmUrl.origin!==dataOrigin)throw Error('Unexpected decoder');
  const r=await fetch(wasmUrl,{headers:{Referer:player.href},signal:AbortSignal.timeout(10000),redirect:'error'});if(!r.ok)throw Error('Metadata decoder unavailable');
  const bytes=await r.arrayBuffer();if(bytes.byteLength>1048576)throw Error('Metadata too large');
  const {instance}=await WebAssembly.instantiate(bytes,{}),e=instance.exports,enc=Buffer.from(streams,'base64');if(enc.length>65536)throw Error('Metadata too large');
  const ptr=e.alloc(enc.length);new Uint8Array(e.memory.buffer,ptr,enc.length).set(enc);const length=e.decrypt(ptr,enc.length);if(length<0||length>65536)throw Error('Invalid metadata');streams=new TextDecoder().decode(new Uint8Array(e.memory.buffer,ptr+12,length)).split('\n').filter(Boolean);
 }
 if(!Array.isArray(streams))throw Error('No direct streams');
 const candidates=streams.filter(value=>{try{const u=new URL(value);return u.protocol==='https:'&&/^[a-z0-9-]+\.space$/.test(u.hostname)&&u.pathname.endsWith('.m3u8')&&!u.username&&!u.password;}catch{return false;}}).slice(0,3);
 if(!candidates.length)throw Error('No compatible stream');return {url:candidates[0],candidates,adaptive:true,browserToken:true,subtitles:[]};
}
