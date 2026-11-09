export class PlaybackProvider {
  constructor(capabilities={}) { this.capabilities=Object.freeze({name:'Playback provider',supportsMovies:false,supportsTv:false,supportsImdb:false,supportsTmdb:false,supportsIframe:false,playerType:'video',supportsPlayPause:false,supportsSeek:false,supportsProgress:false,supportsRemoteControls:false,...capabilities}); }
  // Optional per-player adapter, implemented only against a documented control API.
  // May expose play(), pause(), seekBy(seconds), seekTo(seconds),
  // getCurrentTime(), getDuration(), and dispose(). Missing methods are unsupported.
  // The caller must check both the capability and method before invoking controls.
  // media is the mounted element; source is its validated provider descriptor.
  createControls({media,source}={}) { return null; }
  async getMovieUrl({imdbId, tmdbId}) { throw new Error('Movie provider is not configured'); }
  async getEpisodeUrl({imdbId, tmdbId, season, episode}) { throw new Error('Episode provider is not configured'); }
}
