import {createHash,timingSafeEqual} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest();
export function previewAccess(req,res,{production=process.env.NODE_ENV==='production',password=process.env.MJ_PREVIEW_PASSWORD}={}){
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(['/download','/download/','/download/index.html','/download/style.css','/download/release.js','/download/privacy.html','/download/time.json','/manifest.webmanifest','/assets/icons/app-180.png','/assets/icons/app-192.png','/assets/icons/app-512.png','/assets/icons/app-maskable-192.png','/assets/icons/app-maskable-512.png','/assets/icons/favicon.ico','/assets/logo/og-image.png','/assets/logo/header-official.png','/downloads/android.json'].includes(pathname)||/^\/downloads\/mjplay-[0-9]+\.apk$/.test(pathname))return true;
 if(!production){req.mjPreviewAuthorized=true;return true;}
 res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
 if(!password||password.length<20){res.writeHead(503).end('Preview access is not configured.');return false;}
 if(req.url==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'}).end('ok');return false;}
 let credential='';try{if(req.headers.authorization?.startsWith('Basic '))credential=Buffer.from(req.headers.authorization.slice(6),'base64').toString();}catch{}
 if(timingSafeEqual(digest(credential),digest('preview:'+password))){req.mjPreviewAuthorized=true;return true;}
 res.writeHead(401,{'WWW-Authenticate':'Basic realm="MJ Play private trial", charset="UTF-8"','Cache-Control':'no-store'}).end('Private MJ Play trial. Sign in with the preview credentials.');return false;
}
export function mediaRequestAllowed(req){
 if(req.mjTVLiveAuthorized===true)return true;
 const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
 if(!local&&!(process.env.NODE_ENV==='production'&&req.mjPreviewAuthorized))return false;
 if(!req.headers.origin)return true;
 const allowed=process.env.RENDER_EXTERNAL_URL||process.env.MJ_PUBLIC_ORIGIN||(local?'http://'+req.headers.host:'');
 try{return new URL(req.headers.origin).origin===new URL(allowed).origin;}catch{return false;}
}

