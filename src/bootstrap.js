import {syncAppClock,mountClockNotice} from './services/appClock.js';
if(location.protocol==='file:'){mountClockNotice();void syncAppClock();setInterval(syncAppClock,1800000);}
import {initializeProtectedStorage} from './storage/protectedStorage.js';
import {initializeProfiles} from './storage/profiles.js';
initializeProtectedStorage().finally(()=>{try{initializeProfiles();}catch{console.warn('Profile storage is unavailable; existing library remains accessible.');}return import('./app.js');});
