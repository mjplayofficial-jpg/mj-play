const theme=(key,label,movie,tv,keyword)=>({key,label,movie,tv,keyword});
const themes={
 drama:[theme('crime','Crime Dramas',80,80),theme('courtroom','Courtroom Stories',null,null,'courtroom'),theme('family','Family Dramas',10751,10751),theme('history','Historical Dramas',36,null,'historical')],
 action:[theme('thrillers','Action Thrillers',53,null,'thriller'),theme('heists','Crime & Heists',80,80),theme('scifi','Sci-Fi Action',878,10765),theme('adventure','Action Adventures',12,10759)],
 comedy:[theme('romance','Romantic Comedies',10749,null,'romantic comedy'),theme('family','Family Comedies',10751,10751),theme('crime','Crime Comedies',80,80),theme('animation','Animated Comedy',16,16)],
 thriller:[theme('mystery','Mystery Thrillers',9648,9648),theme('crime','Crime Thrillers',80,80),theme('psychological','Psychological Thrillers',null,null,'psychological thriller'),theme('action','Action Thrillers',28,10759)],
 crime:[theme('mystery','Crime & Mystery',9648,9648),theme('drama','Crime Dramas',18,18),theme('heists','Heist Stories',null,null,'heist'),theme('comedy','Crime Comedies',35,35)],
 adventure:[theme('fantasy','Fantasy Adventures',14,10765),theme('action','Action Adventures',28,10759),theme('family','Family Adventures',10751,10751),theme('animation','Animated Adventures',16,16)],
 scifi:[theme('action','Action & Other Worlds',28,10759),theme('mystery','Sci-Fi Mysteries',9648,9648),theme('animation','Animated Worlds',16,16),theme('family','Family Fantasy',10751,10751)],
 horror:[theme('mystery','Mystery & Horror',9648,9648),theme('supernatural','Supernatural Horror',null,null,'supernatural'),theme('scifi','Sci-Fi Horror',878,10765),theme('comedy','Horror Comedy',35,35)],
 animation:[theme('adventure','Animated Adventures',12,10759),theme('comedy','Animated Comedy',35,35),theme('family','Family Animation',10751,10751),theme('fantasy','Fantasy Animation',14,10765)],
 documentary:[theme('crime','True Crime',null,null,'true crime'),theme('nature','Nature & Wildlife',null,null,'nature'),theme('music','Music Stories',10402,null,'music'),theme('history','History & Discovery',36,null,'history')]
};
export function shelfDefinitions(genre,type){if(genre.slug==='superheroes')return [
 {key:'popular',label:'Popular Superheroes',sort:'popular',preferredType:'movie'},
 {key:'series',label:'Superhero Favourites',sort:'popular',preferredType:'tv'},
 {key:'marvel',label:'Marvel Heroes',sort:'popular',company:'Marvel Studios',preferredType:'movie'},
 {key:'dc',label:'DC Heroes',sort:'popular',company:'DC Entertainment',preferredType:'movie'},
 {key:'animated',label:'Animated Heroes',sort:'popular',extraGenres:16,preferredType:'tv'},
 {key:'rated',label:'Critically Acclaimed',sort:'rated',preferredType:'movie'},
 {key:'new',label:'New Discoveries',sort:'new',preferredType:'tv'}
 ];return [...(themes[genre.slug]||[]).map(value=>({...value,sort:'popular',extraGenres:value[type],keyword:value[type]?undefined:value.keyword})),{key:'rated',label:'Critically Acclaimed',sort:'rated'},{key:'new',label:'New Discoveries',sort:'new'}];}
export function shelfDefinition(genre,type,key){return shelfDefinitions(genre,type).find(s=>s.key===key)||(['popular'].includes(key)?{key,label:'Popular',sort:key}:null);}
export function uniqueShelfItems(items,seen,limit=10){const result=[];for(const item of items){const key=item.type+'/'+item.id;if(seen.has(key))continue;seen.add(key);result.push(item);if(result.length===limit)break;}return result;}

