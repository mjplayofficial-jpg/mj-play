import {mkdir,cp,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
await mkdir('dist/app',{recursive:true});
for(const name of ['appinfo.json','index.html'])await copyFile(name,'dist/app/'+name);
for(const name of ['assets','src','styles'])await cp(name,'dist/app/'+name,{recursive:true,filter:source=>!source.includes('brand-kit')});
const result=spawnSync(process.platform==='win32'?'ares-package.cmd':'ares-package',['dist/app','-o','dist','--no-minify'],{stdio:'inherit',shell:process.platform==='win32'});
process.exit(result.status??1);
