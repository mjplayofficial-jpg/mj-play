import {readFile,readdir,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const manifest=JSON.parse(await readFile('appinfo.json','utf8'));
for(const key of ['id','version','vendor','type','main','title','icon'])if(!manifest[key])throw new Error('Missing manifest field: '+key);
for(const key of ['main','icon','largeIcon'])await access(manifest[key]);
async function check(dir){for(const file of await readdir(dir,{withFileTypes:true})){const name=path.join(dir,file.name);if(file.isDirectory())await check(name);else if(name.endsWith('.js')||name.endsWith('.mjs')){const result=spawnSync(process.execPath,['--check',name],{encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr);}}}
await check('src');await check('tools');console.log('Manifest assets and all JavaScript syntax validated.');
