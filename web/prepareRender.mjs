import {mkdir,copyFile,cp,writeFile} from 'node:fs/promises';import path from 'node:path';
const root=path.resolve('deployment/render-trial');await mkdir(root,{recursive:true});
const files=['bandwidthBudget.mjs','server.mjs','previewAccess.mjs','localRelay.mjs','liveRelay.mjs','tvLiveAccess.mjs','liveSourceConfig.mjs','firebaseConfig.json','liveDecode.mjs','mediaSources.mjs','sourceResolver.mjs','relayResolver.mjs','subtitleService.mjs','sportsCatalogue.mjs'];
await mkdir(path.join(root,'web'),{recursive:true});for(const file of files)await copyFile('web/'+file,path.join(root,'web',file));
for(const file of ['services/appClock.js','services/sports.js','services/sportsCipher.js','services/englishSubtitles.js','storage/protectedStorage.js','storage/profileState.js']){const target=path.join(root,'src',file);await mkdir(path.dirname(target),{recursive:true});await copyFile('src/'+file,target);}
await cp('web/public',path.join(root,'web/public'),{recursive:true});
await writeFile(path.join(root,'package.json'),JSON.stringify({name:'mjplay-private-trial',version:'0.1.0',private:true,type:'module',engines:{node:'22.x'},scripts:{start:'node web/server.mjs'}},null,2));
await writeFile(path.join(root,'.gitignore'),'.env\n*.local.*\nnode_modules/\n');
await writeFile(path.join(root,'render.yaml'),`services:
  - type: web
    name: mjplay-private-trial
    runtime: node
    plan: free
    buildCommand: node --check web/server.mjs
    startCommand: npm start
    healthCheckPath: /healthz
    envVars:
      - key: NODE_ENV
        value: production
      - key: HOST
        value: 0.0.0.0
      - key: MJ_RELAY_TRIAL
        value: "1"
      - key: MJ_PREVIEW_PASSWORD
        generateValue: true
      - key: TMDB_READ_TOKEN
        sync: false
      - key: MJ_SUBTITLE_KEY
        sync: false
      - key: MJ_SPORTS_CIPHER_KEY
        sync: false
`);
console.log('Allowlisted Render package prepared without private configuration, TV packages or capture logs.');
