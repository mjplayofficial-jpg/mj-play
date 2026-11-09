import {readFile,copyFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='android/MJPlay/app/build/outputs/apk/release/';
const info=JSON.parse(await readFile(base+'output-metadata.json','utf8'));
if(info.applicationId!=='com.mjentertainment.mjplay.android'||info.elements.length!==1)throw Error('Only the public release may be published.');
const release=info.elements[0];if(release.outputFile!=='app-release.apk')throw Error('A signed release APK is required.');
const bytes=await readFile(base+release.outputFile),sha256=createHash('sha256').update(bytes).digest('hex');
const out='web/public/downloads';await mkdir(out,{recursive:true});
await copyFile(base+release.outputFile,`${out}/mjplay-${release.versionCode}.apk`);
const data={packageName:info.applicationId,versionCode:release.versionCode,versionName:release.versionName,url:`/downloads/mjplay-${release.versionCode}.apk`,size:bytes.length,sha256,minVersionCode:0,notes:'Improved title compatibility, a cleaner player, and episode browsing while watching.'};
await writeFile(out+'/android.json',JSON.stringify(data,null,2));console.log(`Prepared signed Android ${release.versionName} (${release.versionCode}), ${(bytes.length/1048576).toFixed(1)} MB.`);









