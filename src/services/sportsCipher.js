// Publishing format: Base64 -> RC4 -> decodeURIComponent. Not video DRM.
export function decryptSportsLink(value,key=globalThis.MJ_SPORTS_CIPHER_KEY){
 if(typeof value!=='string'||value.length>12000)return null;
 try{if(/^https:\/\//i.test(value))return value;if(typeof key!=='string'||!key)return null;
  const bytes=atob(value.trim()),s=Array.from({length:256},(_,i)=>i);let j=0;
  for(let i=0;i<256;i++){j=(j+s[i]+key.charCodeAt(i%key.length))%256;[s[i],s[j]]=[s[j],s[i]];}
  let i=0,out='';j=0;for(let n=0;n<bytes.length;n++){i=(i+1)%256;j=(j+s[i])%256;[s[i],s[j]]=[s[j],s[i]];out+=String.fromCharCode(bytes.charCodeAt(n)^s[(s[i]+s[j])%256]);}
  return decodeURIComponent(out);
 }catch{return null;}
}
export function validateSportsEmbed(value,provider){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return null;
  const host=u.hostname.replace(/^www\./,'');
  const ss=['soccerbox.me','nbabox.co','nhlbox.me','mlbbox.me','nflbox.sx','cricwatch.io','tennisonline.im','rugbybox.me','f1live.me','motogpstream.me','golfstreams.me','dartsstreams.me','mmabox.me','boxingbox.me'];
  if(provider==='SS'&&ss.includes(host)&&u.pathname!=='/')return u.href;
  if(provider==='S8'&&host==='808ball15.com'&&/^\/(football|basketball)\/[\w-]+\.html$/.test(u.pathname))return u.href;
 }catch{}return null;
}
