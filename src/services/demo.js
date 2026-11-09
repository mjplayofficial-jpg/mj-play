const titles = ['Interstellar','Dune: Part Two','The Dark Knight','Arrival','The Martian','Inception','Severance','The Last of Us','Planet Earth','Breaking Bad'];
const ids = [157336,693134,155,329865,286217,27205,95396,100088,1044,1396];
const years = ['2014','2024','2008','2016','2015','2010','2022','2023','2006','2008'];
const posters = ['/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg','/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg','/qJ2tW6WMUDux911r6m7haRef0WH.jpg','/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',null,'/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg'];
export const demoItems = titles.map((title,i)=>({id:ids[i],tmdbId:ids[i],type:i<6?'movie':'tv',title,year:years[i],rating:'8.5',poster:posters[i]||null,backdrop:i===0?'/xJHokMbljvjADYdit5fK5VQsXEG.jpg':null,overview:i===0?'A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.':'Explore this title in the MJ Play demo catalogue. Connect TMDB for live details, cast and seasons.',genres:['Drama','Adventure'],imdbId:null,runtime:i===0?169:null,cast:[],seasons:[]}));


