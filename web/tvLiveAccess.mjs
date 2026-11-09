import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
export function createTVLiveAccess({secret,origin,service,now=Date.now}={}){
 const sign=body=>createHmac('sha256',secret).update('tv-live:'+body).digest('base64url');
 const ready=()=>typeof secret==='string'&&secret.length>=20;
 function issue(){if(!ready())throw Error('TV access unavailable');const expires=now()+30*24*60*60*1000,body=Buffer.from(JSON.stringify({expires,nonce:randomBytes(18).toString('hex')})).toString('base64url');return {base:origin+'/api/tv-live/'+body+'.'+sign(body),expires};}
 function valid(token){try{if(!ready()||token.length>512)return false;const [body,sig,...extra]=token.split('.'),expected=sign(body);if(extra.length||!sig||sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return false;const data=JSON.parse(Buffer.from(body,'base64url'));return Number.isSafeInteger(data.expires)&&data.expires>now()&&data.expires<=now()+31*24*60*60*1000&&/^[a-f0-9]{36}$/.test(data.nonce);}catch{return false;}}
 async function serve(req,res){const u=new URL(req.url,'http://localhost');const refresh=u.pathname.match(/^\/api\/tv-live\/([^/]+)\/session$/);if(refresh&&req.method==='GET'&&valid(refresh[1])){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}).end(JSON.stringify(issue()));return;}const m=u.pathname.match(/^\/api\/tv-live\/([^/]+)\/([1-9]\d{0,5})(\/media\/[a-f0-9]{48})?$/);if(!m||!valid(m[1])){res.writeHead(403,{'Cache-Control':'no-store'}).end();return;}
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Methods':'GET, OPTIONS'}).end();return;}if(req.method!=='GET'){res.writeHead(405).end();return;}
  const channel=Number(m[2]),base=origin+'/api/tv-live/'+m[1];req.mjTVLiveAuthorized=true;
  let status=200,headers={};const adapter={writeHead(code,h={}){status=code;headers=h;return this;},end(body){if(typeof body==='string'){body=body.replaceAll('/api/live/'+channel,base+'/'+channel);delete headers['Content-Length'];}res.writeHead(status,headers).end(body);}};
  return service(channel).serve(req,adapter,m[3]||'');
 }
 return {issue,valid,serve};
}
