fetch('/downloads/android.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(r=>{
 const url=new URL(r.url,location.origin);if(url.origin!==location.origin||!url.pathname.startsWith('/downloads/'))throw Error();
 document.querySelector('#download').href=url.href;document.querySelector('#download').setAttribute('download','');
 document.querySelector('#release').textContent='Version '+r.versionName+' · '+(r.size/1048576).toFixed(1)+' MB · Android 8.0+';
 document.querySelector('#version').textContent='MJ Play '+r.versionName;document.querySelector('#notes').textContent=r.notes;document.querySelector('#hash').textContent=r.sha256;
}).catch(()=>{document.querySelector('#release').textContent='The signed release is being prepared. Please check back shortly.'});
