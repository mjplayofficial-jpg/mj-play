import { PlaybackProvider } from './PlaybackProvider.js';
export class DemoProvider extends PlaybackProvider {
  constructor(){super({name:'Demo · Big Buck Bunny',isDemo:true,supportsMovies:true,supportsTv:true,playerType:'video'});}
  // Public Blender sample, unrelated to the selected catalogue title.
  async getMovieUrl() { return { kind: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', label: 'Demo playback · Big Buck Bunny' }; }
  async getEpisodeUrl() { return this.getMovieUrl(); }
}
