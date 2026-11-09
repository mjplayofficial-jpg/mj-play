(() => {
  // web/experimentalEmbedPolicy.js
  function embedIdentity(item, season, episode) {
    const id2 = Number(item?.tmdbId ?? item?.id);
    if (!Number.isSafeInteger(id2) || id2 < 1 || !["movie", "tv"].includes(item?.type)) throw Error("This title has no valid TMDB identity.");
    if (item.type === "tv" && (!Number.isSafeInteger(season) || season < 1 || !Number.isSafeInteger(episode) || episode < 1)) throw Error("Choose a valid episode.");
    return { id: id2, type: item.type, season: item.type === "tv" ? season : null, episode: item.type === "tv" ? episode : null };
  }
  function matchesEmbedMessage(event, frameWindow, identity2) {
    if (event.source !== frameWindow || event.origin !== "https://embed.vidrift.net" || !event.data || typeof event.data !== "object") return false;
    const d = event.data;
    if (typeof d.type !== "string" || !d.type.startsWith("vidrift:")) return false;
    const media = ["vidrift:state", "vidrift:progress", "vidrift:paused", "vidrift:unpaused", "vidrift:ended"].includes(d.type);
    if (media && String(d.tmdbId) !== String(identity2.id)) return false;
    if (d.tmdbId != null && String(d.tmdbId) !== String(identity2.id)) return false;
    if (d.mediaType != null && d.mediaType !== identity2.type) return false;
    if (identity2.type === "tv" && (media && (d.season == null || d.episode == null) || d.season != null && Number(d.season) !== identity2.season || d.episode != null && Number(d.episode) !== identity2.episode)) return false;
    return true;
  }
  function validEmbedProgress(state2) {
    return Number.isFinite(state2.currentTime) && Number.isFinite(state2.duration) && state2.currentTime >= 0 && state2.duration > 0 && state2.duration <= 604800 && state2.currentTime <= state2.duration + 0.5;
  }
  function embedPlaybackStarted(event, state2) {
    return event.type === "vidrift:unpaused" || ["vidrift:state", "vidrift:progress"].includes(event.type) && state2.paused === false && validEmbedProgress(state2);
  }
  function embedUrl(identity2) {
    const route = identity2.type === "tv" ? `tv/${identity2.id}/${identity2.season}/${identity2.episode}` : `movie/${identity2.id}`;
    return "https://embed.vidrift.net/embed/" + route + "?brand=MJ%20Play&brandColor=b58bff&fs=parent&hide=progress,play,volume,skip,time,title,server,next,episodes,subtitles,settings,lock,pip,cast,fullscreen,gradient,pausecard";
  }

  // src/components/actorResults.js
  var words = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]+/g) || [];
  function rankActors(people, query) {
    const tokens = words(query), exact = tokens.join(" ");
    return people.filter((p) => !p.adult && p.known_for_department === "Acting" && tokens.every((t) => words(p.name).some((w) => w === t || w.startsWith(t)))).sort((a, b) => {
      const score = (p) => (words(p.name).join(" ") === exact ? 1e5 : 0) + (p.known_for?.length ? 1e3 : 0) + (p.popularity || 0);
      return score(b) - score(a);
    }).slice(0, 12);
  }
  function actorAppearance(credit) {
    return credit.media_type === "tv" && ((credit.genre_ids || []).some((id2) => [10767, 10763, 10764].includes(id2)) || /^(self|himself|herself)(?:\b|$)/i.test(credit.character || ""));
  }

  // src/services/demo.js
  var titles = ["Interstellar", "Dune: Part Two", "The Dark Knight", "Arrival", "The Martian", "Inception", "Severance", "The Last of Us", "Planet Earth", "Breaking Bad"];
  var ids = [157336, 693134, 155, 329865, 286217, 27205, 95396, 100088, 1044, 1396];
  var years = ["2014", "2024", "2008", "2016", "2015", "2010", "2022", "2023", "2006", "2008"];
  var posters = ["/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg", null, "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"];
  var demoItems = titles.map((title, i) => ({ id: ids[i], tmdbId: ids[i], type: i < 6 ? "movie" : "tv", title, year: years[i], rating: "8.5", poster: posters[i] || null, backdrop: i === 0 ? "/xJHokMbljvjADYdit5fK5VQsXEG.jpg" : null, overview: i === 0 ? "A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars." : "Explore this title in the MJ Play demo catalogue. Connect TMDB for live details, cast and seasons.", genres: ["Drama", "Adventure"], imdbId: null, runtime: i === 0 ? 169 : null, cast: [], seasons: [] }));

  // src/services/tmdb.js
  function normalize(item, type) {
    return { id: item.id, tmdbId: item.id, imdbId: item.external_ids?.imdb_id || item.imdb_id || null, type: type || item.media_type || "movie", title: item.title || item.name || "Untitled", year: (item.release_date || item.first_air_date || "").slice(0, 4), rating: item.vote_average ? item.vote_average.toFixed(1) : "\u2014", poster: item.poster_path, backdrop: item.backdrop_path, releaseDate: item.release_date || item.first_air_date || "", overview: item.overview || "No description available.", genres: (item.genres || []).map((g) => g.name), runtime: item.runtime || item.episode_run_time?.[0], cast: (item.credits?.cast || []).slice(0, 8), collection: item.belongs_to_collection || null, seasons: item.seasons || [] };
  }
  var TmdbService = class {
    constructor(config = {}) {
      this.config = config;
      this.cache = /* @__PURE__ */ new Map();
      this.pending = /* @__PURE__ */ new Map();
      this.demo = !config.tmdbApiKey && !config.tmdbReadToken;
    }
    async request(path, params2 = {}) {
      const key3 = path + JSON.stringify(Object.entries(params2).sort(([a], [b]) => a.localeCompare(b)));
      if (this.pending.has(key3)) return this.pending.get(key3);
      const request = this.fetchRequest(path, params2);
      this.pending.set(key3, request);
      try {
        return await request;
      } finally {
        this.pending.delete(key3);
      }
    }
    async fetchRequest(path, params2 = {}) {
      const query = new URLSearchParams({ ...params2, language: this.config.language || "en-US" });
      if (this.config.tmdbApiKey) query.set("api_key", this.config.tmdbApiKey);
      const key3 = path + query.toString();
      const cached = this.cache.get(key3);
      if (cached && cached.expires > Date.now()) {
        this.cache.delete(key3);
        this.cache.set(key3, cached);
        return cached.value;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12e3);
      try {
        const response = await fetch("https://api.themoviedb.org/3/" + path + "?" + query, { signal: controller.signal, headers: this.config.tmdbReadToken ? { Authorization: "Bearer " + this.config.tmdbReadToken } : {} });
        if (!response.ok) throw new Error("Catalogue request failed (" + response.status + ")");
        const value = await response.json();
        this.cache.delete(key3);
        if (this.cache.size >= 100) this.cache.delete(this.cache.keys().next().value);
        this.cache.set(key3, { value, expires: Date.now() + 3e5 });
        return value;
      } finally {
        clearTimeout(timeout);
      }
    }
    async list(kind, type = "movie") {
      if (this.demo) return demoItems.filter((x) => x.type === type);
      const path = kind === "trending" ? `trending/${type}/week` : `${type}/${kind}`;
      return (await this.request(path)).results.map((x) => normalize(x, type));
    }
    async discoverGenre(type, genreId, name, options = {}) {
      return (await this.genreShelf(type, genreId, name, options)).items;
    }
    async genreShelf(type, genreId, name, { sort = "popular", page = 1, extraGenres, keyword, company } = {}) {
      const superheroes = genreId === "superheroes";
      if (!["movie", "tv"].includes(type) || !superheroes && !/^\d+(\|\d+)*$/.test(String(genreId)) || !["popular", "rated", "new"].includes(sort) || !Number.isInteger(page) || page < 1 || page > 500) throw new Error("Invalid genre");
      if (this.demo) return { items: page === 1 ? demoItems.filter((item) => item.type === type && item.genres.some((genre) => name.toLowerCase().includes(genre.toLowerCase()))) : [], hasMore: false };
      const params2 = { with_genres: String(genreId), sort_by: sort === "rated" ? "vote_average.desc" : "popularity.desc", include_adult: false, page };
      if (superheroes) delete params2.with_genres;
      if (extraGenres) {
        if (!/^\d+$/.test(String(extraGenres))) throw new Error("Invalid extra genre");
        params2.with_genres = superheroes ? String(extraGenres) : String(genreId) + "," + extraGenres;
      }
      const keywords = [...superheroes ? ["superhero"] : [], ...keyword ? [keyword] : []], keywordIds = [];
      for (const word of keywords) {
        const matches = (await this.request("search/keyword", { query: word })).results || [];
        const match = matches.find((x) => x.name.toLowerCase() === word.toLowerCase());
        if (!match) return { items: [], hasMore: false };
        keywordIds.push(match.id);
      }
      if (keywordIds.length) params2.with_keywords = keywordIds.length === 1 ? keywordIds[0] : [...new Set(keywordIds)].join(",");
      if (company) {
        const matches = (await this.request("search/company", { query: company })).results || [];
        const match = matches.find((x) => x.name.toLowerCase() === company.toLowerCase());
        if (!match) return { items: [], hasMore: false };
        params2.with_companies = match.id;
      }
      if (sort === "rated") params2["vote_count.gte"] = 100;
      if (sort === "new") {
        const today = /* @__PURE__ */ new Date(), since = new Date(today);
        since.setUTCMonth(since.getUTCMonth() - 6);
        const field = type === "movie" ? "primary_release_date" : "first_air_date";
        params2[field + ".gte"] = since.toISOString().slice(0, 10);
        params2[field + ".lte"] = today.toISOString().slice(0, 10);
        params2.sort_by = field + ".desc";
        params2["vote_count.gte"] = 10;
      }
      const result = await this.request(`discover/${type}`, params2);
      return { items: result.results.map((item) => normalize(item, type)), hasMore: page < Math.min(result.total_pages || 1, 500) };
    }
    trendingMovies() {
      return this.list("trending", "movie");
    }
    trendingTv() {
      return this.list("trending", "tv");
    }
    popularMovies() {
      return this.list("popular", "movie");
    }
    popularTv() {
      return this.list("popular", "tv");
    }
    topRatedMovies() {
      return this.list("top_rated", "movie");
    }
    topRatedTv() {
      return this.list("top_rated", "tv");
    }
    nowPlayingMovies() {
      return this.list("now_playing", "movie");
    }
    async details(type, id2) {
      if (!["movie", "tv"].includes(type) || !/^\d+$/.test(String(id2))) throw new Error("Invalid title");
      if (this.demo) {
        const item = demoItems.find((x) => x.type === type && x.id === Number(id2));
        if (!item) throw new Error("Title unavailable");
        return item;
      }
      return normalize(await this.request(`${type}/${id2}`, { append_to_response: "credits,external_ids" }), type);
    }
    async collection(id2) {
      if (!/^\d+$/.test(String(id2))) throw new Error("Invalid collection");
      const data = await this.request("collection/" + id2);
      return { name: data.name, items: (data.parts || []).filter((p) => p.id && p.adult !== true).sort((a, b) => (a.release_date || "9999").localeCompare(b.release_date || "9999") || a.id - b.id).map((p) => normalize(p, "movie")) };
    }
    movieDetails(id2) {
      return this.details("movie", id2);
    }
    tvDetails(id2) {
      return this.details("tv", id2);
    }
    async seasonDetails(id2, season) {
      if (this.demo) return { episodes: [] };
      return this.request(`tv/${id2}/season/${season}`);
    }
    async multiSearch(query, page = 1) {
      if (this.demo) return page === 1 ? demoItems.filter((x) => x.title.toLowerCase().includes(query.toLowerCase())) : [];
      const data = await this.request("search/multi", { query, page, include_adult: false });
      const items = data.results.filter((x) => ["movie", "tv"].includes(x.media_type)).map((x) => normalize(x));
      Object.defineProperty(items, "hasMore", { value: page < Math.min(data.total_pages || 1, 500) });
      return items;
    }
    async searchActors(query) {
      if (this.demo) return [];
      const data = await this.request("search/person", { query, include_adult: false });
      return rankActors(data.results || [], query).map((p) => ({ id: p.id, name: p.name, photo: p.profile_path, knownFor: (p.known_for || []).map((x) => x.title || x.name).filter(Boolean).slice(0, 2).join(" \xB7 ") }));
    }
    async actorCredits(id2) {
      if (!/^\d+$/.test(String(id2))) throw Error("Invalid actor");
      const data = await this.request("person/" + id2, { append_to_response: "combined_credits" }), seen = /* @__PURE__ */ new Set();
      const items = (data.combined_credits?.cast || []).filter((x) => {
        const key3 = x.media_type + "/" + x.id;
        if (x.adult || !["movie", "tv"].includes(x.media_type) || seen.has(key3)) return false;
        seen.add(key3);
        return true;
      }).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).map((x) => ({ ...normalize(x, x.media_type), popularity: x.popularity || 0, creditDate: x.release_date || x.first_air_date || "", appearance: actorAppearance(x) }));
      return { name: data.name, photo: data.profile_path, items };
    }
    async titleLogo(type, id2) {
      if (!["movie", "tv"].includes(type) || !/^\d+$/.test(String(id2))) throw new Error("Invalid title");
      if (this.demo) return null;
      const language = (this.config.language || "en-US").split("-")[0];
      const data = await this.request(`${type}/${id2}/images`, { include_image_language: language + ",en,null" });
      const logos = (data.logos || []).filter((image) => /^\/[\w-]+\.png$/.test(image.file_path));
      logos.sort((a, b) => (b.iso_639_1 === language) - (a.iso_639_1 === language) || (b.vote_average || 0) - (a.vote_average || 0));
      return logos[0]?.file_path || null;
    }
    async trailer(type, id2) {
      if (!["movie", "tv"].includes(type) || !/^\d+$/.test(String(id2))) throw new Error("Invalid title");
      if (this.demo) return null;
      const data = await this.request(`${type}/${id2}/videos`);
      const videos = (data.results || []).filter((video) => video.site === "YouTube" && video.type === "Trailer" && /^[-\w]{11}$/.test(video.key));
      videos.sort((a, b) => Number(b.official) - Number(a.official) || String(b.published_at || "").localeCompare(String(a.published_at || "")));
      return videos[0] || null;
    }
    async recommendations(type, id2) {
      if (!["movie", "tv"].includes(type) || !/^\d+$/.test(String(id2))) throw new Error("Invalid title");
      if (this.demo) return demoItems.filter((item) => item.type === type && item.id !== Number(id2)).slice(0, 20);
      let firstError;
      let results = [];
      try {
        results = (await this.request(`${type}/${id2}/recommendations`)).results || [];
      } catch (error) {
        firstError = error;
      }
      if (!results.length) {
        try {
          results = (await this.request(`${type}/${id2}/similar`)).results || [];
        } catch (error) {
          throw firstError || error;
        }
      }
      const seen = /* @__PURE__ */ new Set([Number(id2)]);
      return results.filter((item) => !item.adult && !seen.has(item.id) && seen.add(item.id)).slice(0, 20).map((item) => normalize(item, type));
    }
    credits(type, id2) {
      return this.request(`${type}/${id2}/credits`);
    }
    externalIds(type, id2) {
      return this.request(`${type}/${id2}/external_ids`);
    }
  };
  var tmdb = new TmdbService(window.MJ_CONFIG || {});

  // src/services/appClock.js
  var anchor = 0;
  var monotonic = 0;
  var appNow = () => anchor ? anchor + (performance.now() - monotonic) : Date.now();

  // src/components/progressState.js
  function playbackState(value, type) {
    if (!value || !Number.isFinite(value.duration) || value.duration <= 0) return { watched: false, resumable: false, percent: 0, remaining: 0 };
    const remaining = Math.max(0, value.duration - value.position), movie = type === "movie" || !type && value.key?.includes("/movie/");
    const watched = !!value.completed || !(value.restarted && value.position < 10) && (remaining <= 15 || movie && value.duration >= 3600 && remaining <= Math.min(300, value.duration * 0.05));
    return { watched, resumable: !watched && value.position >= 10, percent: watched ? 100 : Math.max(0, Math.min(100, value.position / value.duration * 100)), remaining };
  }

  // src/storage/profileState.js
  var profileState = { enabled: false, id: "me" };
  var profileKeys = ["mjplay.video.quality.v1", "mjplay.recent.v1", "mjplay.favorites.v1", "mjplay.progress.v1", "mjplay.taste.v1", "mj-subtitle-language", "mj-subtitle-size", "mj-autoplay-next", "mj-live-favourites", "mjplay.search.history.v1"];
  var isProfileKey = (key3) => profileKeys.includes(key3) || key3.startsWith("mjplay.subtitle.offset.v2/");
  var resolveProfileKey = (key3) => profileState.enabled && isProfileKey(key3) ? "mjplay.profile." + profileState.id + "/" + key3 : key3;

  // src/storage/protectedStorage.js
  var keys = /* @__PURE__ */ new Set(["mjplay.video.quality.v1", "mjplay.recent.v1", "mjplay.favorites.v1", "mjplay.progress.v1", "mjplay.opensubtitles.key.v1", "mj-subtitle-language", "mj-subtitle-size", "mj-autoplay-next", "mj-live-favourites", "mjplay.profiles.v1", "mjplay.cloud.auth.v1", "mjplay.cloud.last.v1", "mjplay.search.history.v1"]);
  var protectedKey = (key3) => keys.has(key3) || key3.startsWith("mjplay.profile.") || key3.startsWith("mjplay.subtitle.offset.v2/");
  var caches = ["mjplay.subtitles.cache.v1", "mjplay.subtitles.cache.v2", "mjplay.cloud-guides.v1", "mjplay.playback-diagnostics.v1"];
  function createProtectedStorage(storage2, persist2 = () => false, resolve = (key3) => key3) {
    const memory = /* @__PURE__ */ new Map(), target = () => typeof storage2 === "function" ? storage2() : storage2;
    return {
      getItem(key3) {
        key3 = resolve(key3);
        if (memory.has(key3)) return memory.get(key3);
        if (key3.startsWith("mjplay.profile.guest/")) return null;
        try {
          const value = target()?.getItem(key3);
          if (value !== null && value !== void 0) return value;
        } catch {
        }
        return null;
      },
      setItem(key3, value) {
        key3 = resolve(key3);
        value = String(value);
        if (key3.startsWith("mjplay.profile.guest/")) {
          memory.set(key3, value);
          return;
        }
        let saved = false;
        try {
          target()?.setItem(key3, value);
          saved = !!target();
        } catch {
          if (protectedKey(key3)) {
            for (const cache3 of caches) try {
              target().removeItem(cache3);
            } catch {
            }
            try {
              target().setItem(key3, value);
              saved = true;
            } catch {
            }
          }
        }
        if (protectedKey(key3)) {
          memory.set(key3, value);
          const backed = persist2(key3, value);
          if (!saved && !backed) throw Error("History storage unavailable");
          return;
        }
        if (!saved) throw Error("Storage unavailable");
      },
      hydrate(entries) {
        for (const [key3, value] of entries) {
          if (!protectedKey(key3) || key3.startsWith("mjplay.profile.guest/") || typeof value !== "string") continue;
          let current;
          try {
            current = target()?.getItem(key3);
          } catch {
          }
          if (current === null || current === void 0) {
            memory.set(key3, value);
            try {
              target()?.setItem(key3, value);
            } catch {
            }
          }
        }
      },
      clearGuest() {
        for (const key3 of memory.keys()) if (key3.startsWith("mjplay.profile.guest/")) memory.delete(key3);
      },
      entries() {
        const all = /* @__PURE__ */ new Map();
        try {
          for (let i = 0; i < target().length; i++) {
            const key3 = target().key(i);
            if (protectedKey(key3)) all.set(key3, target().getItem(key3));
          }
        } catch {
        }
        for (const [key3, value] of memory) all.set(key3, value);
        return [...all].filter(([key3]) => !key3.startsWith("mjplay.profile.guest/"));
      },
      snapshot() {
        for (const [key3, value] of this.entries()) persist2(key3, value);
      }
    };
  }
  var db;
  var persist = (key3, value) => {
    if (!db) return false;
    try {
      const tx = db.transaction("values", "readwrite");
      tx.objectStore("values").put(value, key3);
      return true;
    } catch {
      return false;
    }
  };
  var protectedStorage = createProtectedStorage(() => globalThis.localStorage, persist, resolveProfileKey);

  // src/storage/progress.js
  var key = "mjplay.progress.v1";
  function identity(provider2, item, season, episode) {
    return `${provider2}/${item.type}/${item.tmdbId ?? item.id}${item.type === "tv" ? `/${season}/${episode}` : ""}`;
  }
  var ProgressStore = class {
    constructor(storage2) {
      this.storage = storage2;
    }
    rows() {
      try {
        const rows = JSON.parse(this.storage?.getItem(key) || "[]");
        return Array.isArray(rows) ? rows.filter((row) => typeof row.key === "string" && row.key.length < 200 && Number.isFinite(row.position) && Number.isFinite(row.duration) && row.position >= 0 && row.duration > 0 && row.duration <= 604800 && row.position <= row.duration && Number.isFinite(row.updatedAt)).slice(0, 200) : [];
      } catch {
        return [];
      }
    }
    get(provider2, item, season, episode) {
      return this.rows().find((row) => row.key === identity(provider2, item, season, episode));
    }
    latest(provider2, item, season, episode) {
      if (/demo/i.test(provider2)) return this.get(provider2, item, season, episode);
      const suffix = identity("", item, season, episode);
      const rows = this.rows().filter((row) => row.key.endsWith(suffix) && !/demo/i.test(row.key.split("/")[0])).sort((a, b) => b.updatedAt - a.updatedAt);
      const newest = rows[0];
      if (newest && !newest.completed && !newest.restarted && newest.position < 10) return rows.find((row) => row.completed || row.position >= 10 && row.duration - row.position > 15) || newest;
      return newest;
    }
    save(provider2, item, season, episode, value) {
      if (!["movie", "tv"].includes(item.type) || !Number.isSafeInteger(Number(item.tmdbId ?? item.id)) || Number(item.tmdbId ?? item.id) <= 0) return false;
      if (item.type === "tv" && (!Number.isSafeInteger(season) || season < 1 || !Number.isSafeInteger(episode) || episode < 1)) return false;
      if (!Number.isFinite(value.position) || !Number.isFinite(value.duration) || value.position < 0 || value.duration <= 0 || value.duration > 604800 || value.position > value.duration) return false;
      const id2 = identity(provider2, item, season, episode);
      const prior = this.get(provider2, item, season, episode);
      if (value.position < 10 && !value.restarted && !value.completed && prior?.position >= 10 && !prior.completed) return true;
      try {
        if (!this.storage) return false;
        this.storage.setItem(key, JSON.stringify([{ key: id2, position: value.position, duration: value.duration, completed: value.completed === true, restarted: value.restarted === true || value.position < 10 && this.get(provider2, item, season, episode)?.restarted === true, updatedAt: appNow() }, ...this.rows().filter((row) => row.key !== id2)].slice(0, 200)));
        return true;
      } catch {
        return false;
      }
    }
    clearItem(type, id2) {
      try {
        this.storage?.setItem(key, JSON.stringify(this.rows().filter((row) => !row.key.includes(`/${type}/${Number(id2)}/`) && !row.key.endsWith(`/${type}/${Number(id2)}`))));
      } catch {
      }
    }
  };
  var storage;
  try {
    storage = globalThis.localStorage;
  } catch {
  }
  var progressStore = new ProgressStore(protectedStorage);

  // src/storage/library.js
  var KEYS = { favorites: "mjplay.favorites.v1", recent: "mjplay.recent.v1" };
  function metadata(item) {
    const id2 = Number(item?.tmdbId ?? item?.id);
    if (!["movie", "tv"].includes(item?.type) || !Number.isSafeInteger(id2) || id2 <= 0) return null;
    const text = (value) => typeof value === "string" ? value.slice(0, 500) : "";
    const art = (value) => typeof value === "string" && /^\/[\w./-]+$/.test(value) ? value : null;
    return { id: id2, tmdbId: id2, type: item.type, title: text(item.title) || "Untitled", year: text(item.year), poster: art(item.poster), backdrop: art(item.backdrop), imdbId: /^tt\d+$/.test(item.imdbId) ? item.imdbId : null };
  }
  var Library = class {
    constructor(storage2) {
      this.storage = storage2;
    }
    read(kind) {
      try {
        const rows = JSON.parse(this.storage?.getItem(KEYS[kind]) || "[]");
        if (!Array.isArray(rows)) return [];
        const seen = /* @__PURE__ */ new Set();
        return rows.flatMap((row) => {
          const item = metadata(row);
          if (!item) return [];
          const key3 = item.type + "/" + item.id;
          if (seen.has(key3)) return [];
          seen.add(key3);
          if (kind === "recent") {
            if (!Number.isFinite(row.openedAt) || row.openedAt <= 0) return [];
            if (item.type === "tv" && (!Number.isSafeInteger(row.season) || row.season < 1 || !Number.isSafeInteger(row.episode) || row.episode < 1)) return [];
            Object.assign(item, { openedAt: row.openedAt, season: row.season, episode: row.episode, upNext: row.upNext === true });
          }
          return [item];
        }).slice(0, kind === "recent" ? 40 : 200);
      } catch {
        return [];
      }
    }
    write(kind, rows) {
      try {
        if (!this.storage) return false;
        this.storage.setItem(KEYS[kind], JSON.stringify(rows));
        return true;
      } catch {
        return false;
      }
    }
    favorites() {
      return this.read("favorites");
    }
    recent() {
      return this.read("recent");
    }
    has(type, id2) {
      return this.favorites().some((x) => x.type === type && x.id === Number(id2));
    }
    last(type, id2) {
      return this.recent().find((x) => x.type === type && x.id === Number(id2));
    }
    toggle(item) {
      const value = metadata(item);
      if (!value) return false;
      const rows = this.favorites(), found = rows.some((x) => x.type === value.type && x.id === value.id);
      return this.write("favorites", found ? rows.filter((x) => x.type !== value.type || x.id !== value.id) : [value, ...rows].slice(0, 200));
    }
    record(item, season, episode) {
      const value = metadata(item);
      if (!value) return false;
      if (value.type === "tv" && (!Number.isSafeInteger(season) || season < 1 || !Number.isSafeInteger(episode) || episode < 1)) return false;
      return this.write("recent", [{ ...value, season: value.type === "tv" ? season : void 0, episode: value.type === "tv" ? episode : void 0, openedAt: appNow() }, ...this.recent().filter((x) => x.type !== value.type || x.id !== value.id)].slice(0, 40));
    }
    removeRecent(type, id2) {
      return this.write("recent", this.recent().filter((x) => x.type !== type || x.id !== Number(id2)));
    }
    advance(item, season, episode, next) {
      if (item.type !== "tv" || !Number.isSafeInteger(next?.season) || next.season < 1 || !Number.isSafeInteger(next?.episode) || next.episode < 1) return false;
      const rows = this.recent(), current = rows.find((x) => x.type === "tv" && x.id === Number(item.tmdbId ?? item.id));
      if (!current || current.season !== season || current.episode !== episode) return false;
      return this.write("recent", rows.map((x) => x === current ? { ...x, season: next.season, episode: next.episode, upNext: true } : x));
    }
  };
  var library = new Library(protectedStorage);

  // src/storage/profiles.js
  var key2 = "mjplay.profiles.v1";
  function profiles() {
    try {
      const rows = JSON.parse(protectedStorage.getItem(key2) || "[]");
      if (Array.isArray(rows) && rows.some((p) => p.id === "me")) return rows.filter((p) => ["me", "wife", "guest"].includes(p.id)).map((p) => ({ id: p.id, name: String(p.name || p.id).slice(0, 30) }));
    } catch {
    }
    return [{ id: "me", name: "Husbae" }, { id: "wife", name: "Wifey" }, { id: "guest", name: "Leech" }];
  }
  var activeProfile = () => profiles().find((p) => p.id === profileState.id) || profiles()[0];

  // src/components/continueSeries.js
  var finishedProgress = (value) => playbackState(value, "tv").watched;
  var finishedMovieProgress = (value) => playbackState(value, "movie").watched;
  async function advanceContinueWatching(item, season, episode, prepare, { history = library, progress = progressStore } = {}) {
    const profile = activeProfile().id;
    if (item.type !== "tv" || !finishedProgress(progress.latest("Direct", item, season, episode))) return false;
    const next = await prepare();
    if (history === library && activeProfile().id !== profile || !next || !finishedProgress(progress.latest("Direct", item, season, episode))) return false;
    return history.advance(item, season, episode, next);
  }

  // src/providers/PlaybackProvider.js
  var PlaybackProvider = class {
    constructor(capabilities = {}) {
      this.capabilities = Object.freeze({ name: "Playback provider", supportsMovies: false, supportsTv: false, supportsImdb: false, supportsTmdb: false, supportsIframe: false, playerType: "video", supportsPlayPause: false, supportsSeek: false, supportsProgress: false, supportsRemoteControls: false, ...capabilities });
    }
    // Optional per-player adapter, implemented only against a documented control API.
    // May expose play(), pause(), seekBy(seconds), seekTo(seconds),
    // getCurrentTime(), getDuration(), and dispose(). Missing methods are unsupported.
    // The caller must check both the capability and method before invoking controls.
    // media is the mounted element; source is its validated provider descriptor.
    createControls({ media, source } = {}) {
      return null;
    }
    async getMovieUrl({ imdbId, tmdbId }) {
      throw new Error("Movie provider is not configured");
    }
    async getEpisodeUrl({ imdbId, tmdbId, season, episode }) {
      throw new Error("Episode provider is not configured");
    }
  };

  // src/providers/DemoProvider.js
  var DemoProvider = class extends PlaybackProvider {
    constructor() {
      super({ name: "Demo \xB7 Big Buck Bunny", isDemo: true, supportsMovies: true, supportsTv: true, playerType: "video" });
    }
    // Public Blender sample, unrelated to the selected catalogue title.
    async getMovieUrl() {
      return { kind: "video", url: "https://www.w3schools.com/html/mov_bbb.mp4", label: "Demo playback \xB7 Big Buck Bunny" };
    }
    async getEpisodeUrl() {
      return this.getMovieUrl();
    }
  };

  // src/components/videoQuality.js
  var qualityKey = "mjplay.video.quality.v1";
  var qualityPreference = () => protectedStorage.getItem(qualityKey) || "1080";
  function qualitySource(entry, preference = qualityPreference()) {
    const variants = [...entry.variants || []].sort((a, b) => b.height - a.height || b.bandwidth - a.bandwidth);
    if (preference === "auto") return entry.adaptive ? entry.masterUrl || entry.url : entry.url;
    if (!variants.length) return entry.url;
    if (preference === "highest") return variants[0].url;
    return (variants.find((v) => v.height <= Number(preference)) || variants[variants.length - 1]).url;
  }

  // src/providers/DirectTrialProvider.js
  function directTrialKey(type, values) {
    const id2 = values.imdbId || values.tmdbId || values.id;
    if (!/^tt\d+$/.test(String(id2)) && !/^[1-9]\d*$/.test(String(id2))) throw Error("Invalid title identifier");
    if (type === "movie") return `movie:${id2}`;
    if (type !== "tv" || ![values.season, values.episode].every((n) => Number.isSafeInteger(n) && n > 0)) throw Error("Invalid episode");
    return `tv:${id2}:${values.season}:${values.episode}`;
  }
  var DirectTrialProvider = class extends PlaybackProvider {
    constructor({ name = "Direct \xB7 Experimental", sourceProvider = "primary" } = {}) {
      super({ name, supportsMovies: true, supportsTv: true, supportsProgress: true, playerType: "video" });
      this.sourceProvider = sourceProvider;
    }
    async getMovieUrl(values) {
      return this.source("movie", values);
    }
    async getEpisodeUrl(values) {
      return this.source("tv", values);
    }
    source(type, values) {
      const entry = globalThis.__mjDirectTrialSources?.[directTrialKey(type, values)];
      if (!entry || (entry.sourceProvider || "primary") !== this.sourceProvider || !Number.isFinite(entry.expiresAt) || entry.expiresAt <= Date.now()) throw Error("No captured stream for this title. Play it on VidSrc first, then capture its stream for this experimental server.");
      const url = new URL(qualitySource(entry));
      if (url.protocol !== "https:" || url.username || url.password) throw Error("Invalid direct stream");
      return { kind: "video", url: url.href, label: this.capabilities.name };
    }
  };

  // src/providers/EmbedProvider.js
  var allowedFields = ["imdbId", "tmdbId", "season", "episode", "episode2d"];
  function buildEmbedUrl(template, values = {}) {
    if (typeof template !== "string" || !template.trim()) throw new Error("Playback provider not configured");
    const urlText = template.replace(/\{([^{}]+)\}/g, (_, field) => {
      if (!allowedFields.includes(field)) throw new Error("Unsupported provider field");
      const value = values[field === "episode2d" ? "episode" : field];
      if (field === "imdbId") {
        if (typeof value !== "string" || !/^tt\d+$/.test(value)) throw new Error("Missing or invalid IMDb ID");
      } else if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw new Error("Missing or invalid content identifier");
      return encodeURIComponent(field === "episode2d" ? String(value).padStart(2, "0") : String(value));
    });
    if (/[{}]/.test(urlText)) throw new Error("Malformed provider template");
    const url = new URL(urlText);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("Provider must use HTTPS without embedded credentials");
    const authority = template.match(/^https:\/\/([^/?#]+)/i)?.[1];
    if (!authority || /[{}]/.test(authority)) throw new Error("Provider host must be fixed");
    if (url.hash) throw new Error("Provider template fragments are unsupported");
    return url.href;
  }
  var EmbedProvider = class extends PlaybackProvider {
    constructor(config = {}) {
      const templates = (config.movieTemplate || "") + (config.episodeTemplate || "");
      super({ name: config.name || "Configured player", supportsMovies: Boolean(config.movieTemplate), supportsTv: Boolean(config.episodeTemplate), supportsImdb: templates.includes("{imdbId}"), supportsTmdb: templates.includes("{tmdbId}"), supportsIframe: true, playerType: "iframe", supportsProgress: config.progressEvents === true });
      if (config.useSandbox !== void 0 && typeof config.useSandbox !== "boolean") throw new Error("useSandbox must be boolean");
      if (config.iframeSandbox !== void 0 && config.iframeSandbox !== null && typeof config.iframeSandbox !== "string") throw new Error("Invalid iframe sandbox configuration");
      const useSandbox = config.useSandbox ?? config.iframeSandbox !== null;
      this.config = { ...config, useSandbox, iframeSandbox: useSandbox ? config.iframeSandbox ?? "allow-scripts allow-same-origin allow-forms allow-presentation" : null };
    }
    async getMovieUrl(values) {
      return this.source(this.resumeUrl(buildEmbedUrl(this.config.movieTemplate, values), values.startAt));
    }
    async getEpisodeUrl(values) {
      let url = this.resumeUrl(buildEmbedUrl(this.config.episodeTemplate, values), values.startAt);
      const autoNext = this.config.autoNext === true;
      if (autoNext) {
        const target = new URL(url);
        target.searchParams.set("autonext", "1");
        url = target.href;
      }
      return { ...this.source(url), autoNext };
    }
    resumeUrl(url, startAt) {
      if (!this.capabilities.supportsProgress || startAt === void 0) return url;
      if (!Number.isFinite(startAt) || startAt < 0 || startAt > 604800) throw new Error("Invalid resume time");
      const target = new URL(url);
      target.searchParams.set("startAt", String(Math.floor(startAt)));
      return target.href;
    }
    source(url) {
      if (this.config.autoplay) {
        const target = new URL(url);
        target.searchParams.set("autoplay", this.config.autoplay);
        url = target.href;
      }
      return { kind: "iframe", playerType: "iframe", url, label: this.capabilities.name, useSandbox: this.config.useSandbox, sandbox: this.config.iframeSandbox };
    }
  };

  // src/config/testProviders.js
  var testProviders = Object.freeze({});
  var providerOptions = Object.freeze([["direct-trial", "Direct"], ["primary", "VidSrc"], ["vsembed", "VSEmbed"], ["vsembed-embed", "VSEmbed \xB7 Original player"], ["demo", "Demo \xB7 Big Buck Bunny"]]);

  // src/config/playback.js
  var playbackConfig = { provider: "primary", providers: { embed: { name: "Configured player", movieTemplate: "", episodeTemplate: "" }, primary: { name: "VidSrc", playerType: "iframe", useSandbox: false, progressEvents: true, autoNext: true, autoplay: "1", movieTemplate: "https://vidsrc.sh/embed/movie/{imdbId}", episodeTemplate: "https://vidsrc.sh/embed/tv/{imdbId}/{season}/{episode}" } } };
  function createPlaybackProvider(config = playbackConfig) {
    if (config.provider === "vsembed") return new DirectTrialProvider({ name: "VSEmbed", sourceProvider: "vsembed-embed" });
    if (config.provider === "vsembed-embed") return new EmbedProvider({ name: "VSEmbed", useSandbox: false, progressEvents: true, autoNext: false, autoplay: "1", movieTemplate: "https://vsembed.ru/embed/movie/{imdbId}", episodeTemplate: "https://vsembed.ru/embed/tv/{imdbId}/{season}/{episode}" });
    if (config.provider === "direct-trial") return new DirectTrialProvider();
    if (config.provider === "demo") return new DemoProvider();
    if (config.provider === "primary") return new EmbedProvider(config.providers?.primary || {});
    if (config.provider === "embed") {
      const embed = config.providers?.embed || {};
      return embed.movieTemplate || embed.episodeTemplate ? new EmbedProvider(embed) : new DemoProvider();
    }
    throw new Error("Unknown playback provider");
  }
  var selectionKey = "mjplay.provider.v1";
  function selectedPlaybackProvider() {
    try {
      const value = globalThis.localStorage?.getItem(selectionKey);
      return providerOptions.some(([id2]) => id2 === value) ? value : value ? "direct-trial" : playbackConfig.provider;
    } catch {
      return playbackConfig.provider;
    }
  }
  var playbackProvider = createPlaybackProvider({ ...playbackConfig, provider: selectedPlaybackProvider() });

  // src/components/ui.js
  var escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function artwork(path, size = "w500") {
    return path ? "https://image.tmdb.org/t/p/" + size + path : "assets/placeholders/poster.svg";
  }

  // src/components/TVPlayerMenus.js
  function mountTVPlayerMenus(panel, { item, season, episode }) {
    const doc = panel.ownerDocument, row = panel.querySelector(".cinema-bottom-actions");
    let disposed = false, request = 0;
    const make = (label, key3, path) => {
      const b = doc.createElement("button");
      b.dataset.focus = key3;
      b.setAttribute("aria-label", label);
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"/></svg><span>' + label + "</span>";
      return b;
    };
    const settings = make("Settings", "tv-player-settings", "M4 7h16M4 17h16M9 4v6M15 14v6");
    row.append(settings);
    const sheet = doc.createElement("div");
    sheet.className = "tv-player-menu";
    sheet.hidden = true;
    const heading = doc.createElement("h3");
    heading.textContent = "Player settings";
    sheet.append(heading);
    const extras = panel.querySelector(".cinema-extra-actions"), popup = panel.querySelector(".cinema-subtitles"), options = panel.querySelector('[data-focus="direct-options"]');
    if (extras) sheet.append(extras);
    if (popup) sheet.append(popup);
    if (options) sheet.append(options);
    const observer = popup ? new MutationObserver(() => sheet.classList.toggle("tv-subtitle-open", !popup.hidden)) : null;
    if (popup) observer.observe(popup, { attributes: true, attributeFilter: ["hidden"] });
    const done = make("Done", "tv-settings-close", "m5 12 4 4L19 6");
    sheet.append(done);
    panel.append(sheet);
    const closeSettings = () => {
      sheet.hidden = true;
      sheet.removeAttribute("data-modal");
      panel.hidden = false;
      settings.focus();
    };
    settings.onclick = () => {
      panel.hidden = false;
      sheet.hidden = false;
      sheet.setAttribute("data-modal", "");
      sheet.querySelector("[data-focus]")?.focus();
    };
    done.onclick = closeSettings;
    for (const key3 of ["direct-quality", "direct-options"]) {
      const b = sheet.querySelector('[data-focus="' + key3 + '"]');
      if (b) {
        const action = b.onclick;
        b.onclick = (e) => {
          closeSettings();
          action?.(e);
        };
      }
    }
    let drawer = null, episodesButton = null;
    if (item.type === "tv") {
      episodesButton = make("Episodes", "tv-player-episodes", "M3 4h18v4H3ZM3 11h18v4H3ZM3 18h18v3H3Z");
      row.insertBefore(episodesButton, settings);
      drawer = doc.createElement("div");
      drawer.className = "tv-episode-drawer";
      drawer.hidden = true;
      panel.append(drawer);
      const close = () => {
        request++;
        drawer.hidden = true;
        drawer.removeAttribute("data-modal");
        episodesButton.focus();
      };
      const load = async (selected) => {
        const serial = ++request;
        drawer.innerHTML = '<div class="tv-drawer-heading"><h3>Episodes</h3><button data-focus="tv-episodes-close">Close</button></div><p role="status">Loading episodes\u2026</p>';
        drawer.querySelector("button").onclick = close;
        try {
          const data = await tmdb.seasonDetails(item.tmdbId ?? item.id, selected);
          if (disposed || serial !== request) return;
          drawer.innerHTML = '<div class="tv-drawer-heading"><h3>' + escapeHtml(item.title) + '</h3><button data-focus="tv-episodes-close">Close</button></div><details class="season-picker tv-drawer-seasons"><summary data-focus="tv-drawer-season">Season ' + selected + '</summary><div class="season-picker-options">' + (item.seasons || [{ season_number: season }]).filter((s) => s.season_number > 0).map((s) => '<button data-focus="tv-drawer-season-' + s.season_number + '" data-tv-season="' + s.season_number + '">' + escapeHtml(s.name || "Season " + s.season_number) + "</button>").join("") + '</div></details><div class="tv-drawer-episodes">' + (data.episodes || []).map((ep) => '<button data-focus="tv-drawer-episode-' + ep.episode_number + '" data-play="tv/' + (item.tmdbId ?? item.id) + '" data-season="' + selected + '" data-episode="' + ep.episode_number + '" ' + (selected === season && ep.episode_number === episode ? 'aria-current="true"' : "") + '><img src="' + artwork(ep.still_path, "w300") + '" alt="" loading="lazy"><span><strong>' + ep.episode_number + ". " + escapeHtml(ep.name) + "</strong><small>" + (selected === season && ep.episode_number === episode ? "Now playing \xB7 " : "") + (ep.runtime ? ep.runtime + " min" : "") + "</small></span></button>").join("") + "</div>";
          drawer.querySelector('[data-focus="tv-episodes-close"]').onclick = close;
          for (const button of drawer.querySelectorAll("[data-tv-season]")) button.onclick = () => {
            void load(Number(button.dataset.tvSeason));
          };
          (drawer.querySelector("[aria-current]") || drawer.querySelector(".tv-drawer-episodes button") || drawer.querySelector("summary")).focus();
        } catch {
          if (!disposed && serial === request) {
            drawer.querySelector('[role="status"]').textContent = "Episodes could not load. Close and try again.";
            drawer.querySelector("button").focus();
          }
        }
      };
      episodesButton.onclick = () => {
        sheet.hidden = true;
        sheet.removeAttribute("data-modal");
        panel.hidden = false;
        drawer.hidden = false;
        drawer.setAttribute("data-modal", "");
        void load(Number(season) || 1);
      };
    }
    const back = (e) => {
      if (!["Escape", "Backspace"].includes(e.key) && e.keyCode !== 461) return;
      if (popup && !popup.hidden) return;
      const openSeason = drawer?.querySelector(".season-picker[open]");
      if (openSeason) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openSeason.open = false;
        openSeason.querySelector("summary").focus();
        return;
      }
      if (drawer && !drawer.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        request++;
        drawer.hidden = true;
        drawer.removeAttribute("data-modal");
        episodesButton.focus();
      } else if (!sheet.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeSettings();
      }
    };
    doc.addEventListener("keydown", back, true);
    return { isOpen: () => !sheet.hidden || !!drawer && !drawer.hidden, dispose() {
      disposed = true;
      request++;
      observer?.disconnect();
      doc.removeEventListener("keydown", back, true);
      drawer?.remove();
      episodesButton?.remove();
      sheet.remove();
      settings.remove();
    } };
  }

  // src/services/credits.js
  var cache = /* @__PURE__ */ new Map();
  function validateCredits(data, item, duration, source, season, episode) {
    if (!Number.isFinite(duration) || duration < 300) return null;
    if (source === "IntroDB") {
      if (data.imdb_id !== item.imdbId || data.media_type !== item.type) return null;
    } else if (Number(data.tmdb_id) !== Number(item.tmdbId ?? item.id) || data.type !== item.type) return null;
    if (item.type === "tv" && (Number(data.season) !== Number(season) || Number(data.episode) !== Number(episode))) return null;
    const segments = source === "IntroDB" ? [data.outro] : data.credits;
    if (!Array.isArray(segments)) return null;
    const post = data.post_credits;
    const hasPostCredits = !!post || source === "TheIntroDB" && segments.length > 1;
    for (const segment of segments.filter(Boolean).sort((a, b) => a.start_ms - b.start_ms)) {
      const start = segment.start_ms / 1e3, end = segment.end_ms == null ? null : segment.end_ms / 1e3;
      if (!Number.isFinite(start) || start < duration * 0.75 || start >= duration - 5 || duration - start > (item.type === "tv" ? 240 : 1200)) continue;
      if (end !== null && (!Number.isFinite(end) || end <= start || end > duration + 20)) continue;
      const finalEnd = post ? post.end_ms / 1e3 : end;
      if (finalEnd !== null && (!Number.isFinite(finalEnd) || Math.abs(finalEnd - duration) > 20)) continue;
      if (source === "IntroDB" && (!Number.isFinite(segment.confidence) || segment.confidence < 0.8)) continue;
      const result = { start, source, hasPostCredits };
      if (post) result.postCreditsEnd = post.end_ms / 1e3;
      else if (hasPostCredits) {
        const last = segments[segments.length - 1], after = last?.start_ms / 1e3;
        if (Number.isFinite(after) && after > start && after < duration) result.postCreditsEnd = after;
      }
      return result;
    }
    return null;
  }
  async function fetchCredits(item, season, episode, duration, { signal, fetcher = fetch } = {}) {
    if (!["movie", "tv"].includes(item?.type) || !Number.isFinite(duration) || duration < 300) return null;
    const id2 = Number(item.tmdbId ?? item.id);
    if (!Number.isSafeInteger(id2) || id2 <= 0) return null;
    if (item.type === "tv" && (!Number.isSafeInteger(season) || season < 1 || !Number.isSafeInteger(episode) || episode < 1)) return null;
    const key3 = [item.type, id2, item.imdbId, season, episode, Math.round(duration)].join("/"), cached = cache.get(key3);
    if (cached && cached.expires > Date.now()) return cached.value;
    const params2 = new URLSearchParams(item.type === "tv" ? { season, episode } : {});
    const sources = [];
    if (/^tt\d+$/.test(item.imdbId || "")) {
      const p2 = new URLSearchParams(params2);
      p2.set("imdb_id", item.imdbId);
      if (item.type === "movie") p2.set("is_movie", "true");
      sources.push(["IntroDB", "https://api.introdb.app/segments?" + p2]);
    }
    const p = new URLSearchParams(params2);
    p.set("tmdb_id", id2);
    p.set("duration_ms", Math.round(duration * 1e3));
    sources.push(["TheIntroDB", "https://api.theintrodb.org/v3/media?" + p]);
    let value = null;
    for (const [source, url] of sources) {
      if (signal?.aborted) return null;
      const controller = new AbortController(), abort = () => controller.abort();
      signal?.addEventListener("abort", abort, { once: true });
      const timer = setTimeout(abort, 5e3);
      try {
        const response = await fetcher(url, { signal: controller.signal });
        if (response.ok) {
          value = validateCredits(await response.json(), item, duration, source, season, episode);
          if (value) break;
        }
      } catch {
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
      }
    }
    if (value && !signal?.aborted) {
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(key3, { value, expires: Date.now() + 864e5 });
    }
    return value;
  }

  // src/components/creditsController.js
  function mountCreditsController(video, item, season, episode, { onChange = () => {
  }, lookup = fetchCredits, scheduler = globalThis } = {}) {
    let disposed = false, marker = null, duration = 0, attempts = 0, busy = false, timer;
    const controller = new AbortController();
    const request = async () => {
      if (disposed || !Number.isFinite(video.duration) || video.duration < 300) return;
      if (Math.abs(duration - video.duration) >= 1) {
        duration = video.duration;
        marker = null;
        attempts = 0;
      }
      if (busy || marker || attempts >= 3) return;
      busy = true;
      attempts++;
      const expected = duration;
      try {
        const result = await lookup(item, season, episode, expected, { signal: controller.signal });
        if (!disposed && Math.abs(video.duration - expected) < 1) {
          marker = result;
          onChange(marker);
        }
      } catch {
      } finally {
        busy = false;
        if (!disposed && !marker && attempts < 3) {
          scheduler.clearTimeout(timer);
          timer = scheduler.setTimeout(request, 1e4);
        }
      }
    };
    const schedule = () => {
      scheduler.clearTimeout(timer);
      timer = scheduler.setTimeout(request, 1e3);
    };
    video.addEventListener("loadedmetadata", schedule);
    video.addEventListener("durationchange", schedule);
    video.addEventListener("playing", schedule);
    schedule();
    return { get marker() {
      return marker;
    }, dispose() {
      disposed = true;
      controller.abort();
      scheduler.clearTimeout(timer);
      video.removeEventListener("loadedmetadata", schedule);
      video.removeEventListener("durationchange", schedule);
      video.removeEventListener("playing", schedule);
    } };
  }

  // src/services/intros.js
  var cache2 = /* @__PURE__ */ new Map();
  function validateIntro(data, item, season, episode, duration, source = "IntroDB") {
    if (item?.type !== "tv" || !data || Number(data.season) !== Number(season) || Number(data.episode) !== Number(episode) || !Number.isFinite(duration)) return null;
    if (source === "IntroDB" && (data.media_type !== "tv" || data.imdb_id !== item.imdbId)) return null;
    if (source === "TheIntroDB" && (data.type !== "tv" || Number(data.tmdb_id) !== Number(item.tmdbId ?? item.id))) return null;
    const intro = source === "TheIntroDB" ? data.intro?.[0] : data.intro;
    if (!intro) return null;
    if (source === "IntroDB" && (intro.confidence < 0.8 || !Number.isFinite(intro.confidence))) return null;
    const start = intro.start_ms / 1e3, end = intro.end_ms / 1e3, editionEnd = (data.post_credits?.end_ms ?? data.outro?.end_ms ?? data.duration_ms) / 1e3;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end - start < 5 || end - start > 240 || start > Math.min(900, duration * 0.35) || end > duration * 0.5) return null;
    if (source === "IntroDB" && (!Number.isFinite(editionEnd) || Math.abs(editionEnd - duration) > 20)) return null;
    if (source === "TheIntroDB" && Number.isFinite(data.video_duration_ms) && Math.abs(data.video_duration_ms / 1e3 - duration) > 20) return null;
    return { start, end, source };
  }
  async function fetchIntro(item, season, episode, duration, { signal, fetcher = fetch } = {}) {
    if (item?.type !== "tv" || !/^tt\d+$/.test(item.imdbId || "") || !Number.isSafeInteger(season) || season < 1 || !Number.isSafeInteger(episode) || episode < 1 || !Number.isFinite(duration) || duration < 300) return null;
    const key3 = [item.imdbId, season, episode, Math.round(duration)].join("/");
    if (cache2.has(key3)) return cache2.get(key3);
    const sources = [["IntroDB", "https://api.introdb.app/segments?" + new URLSearchParams({ imdb_id: item.imdbId, season, episode })]];
    const tmdb2 = Number(item.tmdbId ?? item.id);
    if (Number.isSafeInteger(tmdb2) && tmdb2 > 0) sources.push(["TheIntroDB", "https://api.theintrodb.org/v3/media?" + new URLSearchParams({ tmdb_id: tmdb2, season, episode, duration_ms: Math.round(duration * 1e3) })]);
    for (const [source, url] of sources) {
      if (signal?.aborted) return null;
      const controller = new AbortController(), abort = () => controller.abort(), timer = setTimeout(abort, 5e3);
      signal?.addEventListener("abort", abort, { once: true });
      try {
        const r = await fetcher(url, { signal: controller.signal });
        if (!r.ok) continue;
        const marker = validateIntro(await r.json(), item, season, episode, duration, source);
        if (marker) {
          if (cache2.size >= 100) cache2.delete(cache2.keys().next().value);
          cache2.set(key3, marker);
          return marker;
        }
      } catch {
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
      }
    }
    return null;
  }

  // src/components/playbackPrompt.js
  function focusPlaybackPrompt(button, panel, blocked = false) {
    if (blocked || !panel.hidden || !button?.focus) return false;
    const active = panel.ownerDocument?.activeElement;
    if (active?.closest?.("[data-modal]") || active?.closest?.("[data-playback-prompt]:not([hidden])")) return false;
    button.focus({ preventScroll: true });
    return true;
  }
  function releasePlaybackPrompt(element, video) {
    if (element.contains?.(video.ownerDocument.activeElement)) {
      video.tabIndex = -1;
      video.focus?.({ preventScroll: true });
    }
  }

  // src/components/IntroPrompt.js
  function mountIntroPrompt(video, panel, { item, season, episode, isBlocked = () => false, onSeek = () => {
  }, lookup = fetchIntro } = {}) {
    if (item?.type !== "tv") return { dispose() {
    } };
    const doc = video.ownerDocument, prompt = doc.createElement("div");
    prompt.className = "cinema-skip-intro";
    prompt.setAttribute("data-playback-prompt", "");
    prompt.hidden = true;
    prompt.innerHTML = '<button data-focus="skip-intro">Skip intro <span aria-hidden="true">\u2192</span></button>';
    panel.parentElement.append(prompt);
    const button = prompt.querySelector("button");
    let marker = null, disposed = false, dismissed = false, busy = false, expected = 0, attempts = 0, timer;
    const controller = new AbortController();
    const hide = () => {
      releasePlaybackPrompt(prompt, video);
      prompt.hidden = true;
    };
    const update = () => {
      if (disposed) return;
      const active = marker && !dismissed && video.currentTime >= marker.start && video.currentTime < marker.end && !video.seeking && !video.paused && !isBlocked();
      if (!active) {
        hide();
        return;
      }
      prompt.hidden = false;
      focusPlaybackPrompt(button, panel, isBlocked());
    };
    const request = async () => {
      if (disposed || busy || !Number.isFinite(video.duration) || video.duration < 300) return;
      if (Math.abs(expected - video.duration) > 1) {
        expected = video.duration;
        marker = null;
        attempts = 0;
      }
      if (marker || attempts >= 3) return;
      busy = true;
      attempts++;
      video.dataset && (video.dataset.introStatus = "loading");
      const duration = video.duration;
      try {
        const value = await lookup(item, season, episode, duration, { signal: controller.signal });
        if (!disposed && Math.abs(duration - video.duration) < 1) {
          marker = value;
          if (video.dataset) {
            video.dataset.introStatus = value ? "ready" : "unavailable";
            video.dataset.introStart = value ? String(value.start) : "";
            video.dataset.introEnd = value ? String(value.end) : "";
            video.dataset.introSource = value?.source || "";
          }
          update();
        }
      } catch {
      } finally {
        busy = false;
        if (!disposed && !marker && attempts < 3) {
          clearTimeout(timer);
          timer = setTimeout(request, 1500);
        }
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(request, 200);
    };
    button.onclick = () => {
      if (!marker) return;
      onSeek();
      dismissed = true;
      video.currentTime = marker.end;
      hide();
    };
    const key3 = (e) => {
      if (prompt.hidden || isBlocked()) return;
      const back = e.keyCode === 461 || e.key === "Escape" || e.key === "Backspace", ok = e.keyCode === 13 || e.key === "Enter";
      if (back) {
        e.preventDefault();
        e.stopImmediatePropagation();
        dismissed = true;
        hide();
      } else if (ok && doc.activeElement === button) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) button.click();
      }
    };
    doc.addEventListener("keydown", key3, true);
    const events = ["timeupdate", "seeked", "play", "pause"];
    for (const name of events) video.addEventListener(name, update);
    for (const name of ["loadedmetadata", "durationchange", "playing"]) video.addEventListener(name, schedule);
    void request();
    return { dispose() {
      disposed = true;
      controller.abort();
      clearTimeout(timer);
      doc.removeEventListener("keydown", key3, true);
      for (const name of events) video.removeEventListener(name, update);
      for (const name of ["loadedmetadata", "durationchange", "playing"]) video.removeEventListener(name, schedule);
      prompt.remove();
    } };
  }

  // src/components/playbackLifecycle.js
  function mountPlaybackLifecycle(video, save) {
    const doc = video.ownerDocument, win = doc.defaultView;
    const hide = () => {
      save();
      if (!video.paused) video.pause();
    };
    const visibility = () => {
      if (doc.hidden) hide();
    };
    doc.addEventListener("visibilitychange", visibility);
    win?.addEventListener("pagehide", hide);
    return () => {
      doc.removeEventListener("visibilitychange", visibility);
      win?.removeEventListener("pagehide", hide);
    };
  }

  // src/components/resumePosition.js
  function resumePosition(video, startAt, { now = () => Date.now(), confirmationMs = 1e3 } = {}) {
    let pending2 = Number.isFinite(startAt) && startAt > 0, confirmedAt = null;
    return {
      apply() {
        if (!pending2) return true;
        if (!Number.isFinite(video.duration) || video.duration <= 0) return false;
        const target = Math.min(startAt, Math.max(0, video.duration - 1));
        if (!video.seeking && video.readyState >= 3 && video.currentTime >= target - 2 && video.currentTime <= target + 10) {
          if (confirmedAt === null) confirmedAt = now();
          if (now() - confirmedAt >= confirmationMs) {
            pending2 = false;
            return true;
          }
          return false;
        }
        confirmedAt = null;
        if (!video.seeking && Math.abs(video.currentTime - target) >= 2) {
          try {
            video.currentTime = target;
          } catch {
          }
        }
        return false;
      },
      reset() {
        pending2 = false;
        confirmedAt = null;
      },
      get pending() {
        return pending2;
      }
    };
  }

  // src/components/seekPreview.js
  function seekPreview(video, { onPreview = () => {
  }, onCommit = () => {
  }, scheduler = globalThis } = {}) {
    let target = null, timer;
    const cancel = () => {
      scheduler.clearTimeout(timer);
      target = null;
    };
    const commit = () => {
      if (target === null) return;
      scheduler.clearTimeout(timer);
      const position = target;
      target = null;
      onCommit();
      video.currentTime = position;
      onPreview();
    };
    return { get position() {
      return target;
    }, step(delta) {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      target = Math.max(0, Math.min(video.duration - 0.1, (target ?? video.currentTime ?? 0) + delta));
      scheduler.clearTimeout(timer);
      timer = scheduler.setTimeout(commit, 700);
      onPreview();
    }, commit, cancel };
  }

  // src/components/playerRemoteOk.js
  function mountPlayerRemoteOk(doc, panel, toggle, { isMenuOpen = () => false, onToggle }) {
    let captured = false;
    const isOk = (e) => e.key === "Enter" || e.keyCode === 13;
    const down = (e) => {
      if (!isOk(e)) return;
      if (captured) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (isMenuOpen() || !panel.hidden || doc.activeElement?.closest?.("[data-playback-prompt]:not([hidden])")) return;
      captured = true;
      e.preventDefault();
      e.stopImmediatePropagation();
      panel.hidden = false;
      toggle.focus();
      onToggle();
    };
    const up = (e) => {
      if (!isOk(e) || !captured) return;
      captured = false;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    doc.addEventListener("keydown", down, true);
    doc.addEventListener("keyup", up, true);
    return () => {
      doc.removeEventListener("keydown", down, true);
      doc.removeEventListener("keyup", up, true);
    };
  }

  // src/components/creditsCountdown.js
  function createCreditsCountdown({ now = () => performance.now() } = {}) {
    let elapsed = 0, lastNow = null, lastPosition = null, running = false;
    const reset = () => {
      elapsed = 0;
      lastNow = null;
      lastPosition = null;
      running = false;
    };
    return { reset, update({ position, marker, playing }) {
      const clock = now(), inCredits = !!marker && position >= marker.start;
      const protectedScene = inCredits && marker.hasPostCredits && (!Number.isFinite(marker.postCreditsEnd) || position < marker.postCreditsEnd);
      if (!inCredits || protectedScene) {
        reset();
        return { active: false, protectedScene, seconds: 10, due: false };
      }
      if (running && playing && lastNow !== null && lastPosition !== null) {
        const movement = position - lastPosition;
        if (movement === 0) return { active: true, protectedScene: false, seconds: Math.max(0, 10 - elapsed), due: elapsed >= 10 };
        if (movement > 0 && movement < 2) elapsed += Math.max(0, Math.min(1, (clock - lastNow) / 1e3));
      }
      lastNow = clock;
      lastPosition = position;
      running = !!playing;
      return { active: true, protectedScene: false, seconds: Math.max(0, 10 - elapsed), due: elapsed >= 10 };
    } };
  }

  // src/services/englishSubtitles.js
  var endpoint = "https://api.opensubtitles.com/api/v1/";
  var subtitleKey = "mjplay.opensubtitles.key.v1";
  function subtitleIdentity(item, season, episode) {
    return `${item.type}/${item.tmdbId ?? item.id}${item.type === "tv" ? `/${season}/${episode}` : ""}`;
  }
  function subtitleEdition(item, season, episode, duration) {
    return subtitleIdentity(item, season, episode) + "/" + (Number.isFinite(duration) ? Math.round(duration) : "unknown");
  }
  function releaseKind(release) {
    return /web[ ._-]?(dl|rip)?|webrip/i.test(release || "") ? "WEB" : /blu[ ._-]?ray|bdrip/i.test(release || "") ? "Blu-ray" : /dvd/i.test(release || "") ? "DVD" : "Other";
  }
  var releaseScore = (a) => ({ WEB: 3, Other: 2, "Blu-ray": 1, DVD: 0 })[releaseKind(a.release)];
  function subtitleSearch(item, season, episode) {
    const query = new URLSearchParams({ languages: "en" }), imdb = String(item.imdbId || "").replace(/^tt/, "");
    const id2 = Number(item.tmdbId ?? item.id);
    if (item.type === "tv") {
      if (![season, episode].every((n) => Number.isSafeInteger(n) && n > 0)) throw Error("Invalid subtitle episode.");
      query.set("season_number", season);
      query.set("episode_number", episode);
      if (/^\d+$/.test(imdb)) query.set("parent_imdb_id", imdb);
      else if (Number.isSafeInteger(id2) && id2 > 0) query.set("parent_tmdb_id", id2);
      else throw Error("Title identifier missing.");
    } else if (item.type === "movie") {
      if (/^\d+$/.test(imdb)) query.set("imdb_id", imdb);
      else if (Number.isSafeInteger(id2) && id2 > 0) query.set("tmdb_id", id2);
      else throw Error("Title identifier missing.");
    } else throw Error("Unsupported subtitle title.");
    query.sort();
    return query.toString();
  }
  function rankEnglish(rows, item, season, episode) {
    return rows.map((r) => r.attributes).filter((a) => {
      if (!a || a.language !== "en" || a.foreign_parts_only || a.machine_translated || a.ai_translated || !a.files?.[0]?.file_id) return false;
      const f = a.feature_details || {};
      if (item.type === "tv") return Number(f.season_number) === season && Number(f.episode_number) === episode && (item.imdbId ? String(f.parent_imdb_id) === item.imdbId.replace(/^tt/, "") : Number(f.parent_tmdb_id) === Number(item.tmdbId ?? item.id));
      return f.feature_type === "Movie" && (item.imdbId ? String(f.imdb_id) === item.imdbId.replace(/^tt/, "") : Number(f.tmdb_id) === Number(item.tmdbId ?? item.id));
    }).sort((a, b) => releaseScore(b) - releaseScore(a) || Number(!!b.from_trusted) - Number(!!a.from_trusted) || Number(!!a.hearing_impaired) - Number(!!b.hearing_impaired) || (Number(b.download_count) || 0) - (Number(a.download_count) || 0));
  }
  var stamp = (value) => {
    const parts = value.replace(",", ".").split(":").map(Number);
    return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  };
  function parseSubtitle(text) {
    if (typeof text !== "string" || text.length > 8e5) throw Error("Subtitle file is too large.");
    const cues = [];
    for (const block of text.replace(/^\uFEFF/, "").replace(/\r/g, "").split(/\n\s*\n/)) {
      const lines = block.split("\n"), i = lines.findIndex((line) => line.includes("-->"));
      if (i < 0) continue;
      const match = lines[i].match(/^\s*((?:\d+:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d+:)?\d{2}:\d{2}[.,]\d{3})/);
      if (!match) continue;
      const start = stamp(match[1]), end = stamp(match[2]);
      const body = lines.slice(i + 1).join("\n").replace(/<[^>]*>/g, "").replace(/\{\\[^}]*\}/g, "").replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, n) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " })[n]).trim().slice(0, 1500);
      if (Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end > start && end <= 604800 && body) cues.push({ start, end, text: body });
    }
    if (!cues.length) throw Error("Subtitle file has no readable captions.");
    return cues.sort((a, b) => a.start - b.start);
  }
  function captionAt(cues, time) {
    let lo = 0, hi = cues.length;
    while (lo < hi) {
      const mid = lo + hi >> 1;
      if (cues[mid].start <= time) lo = mid + 1;
      else hi = mid;
    }
    return cues.slice(Math.max(0, lo - 20), lo).filter((c) => c.end > time).map((c) => c.text).slice(-3).join("\n");
  }
  async function fetchEnglishSubtitle(item, season, episode, { signal, alternate = false, duration, storage: storage2 = protectedStorage, fetcher = globalThis.fetch } = {}) {
    if (!alternate) {
      const stream = globalThis.__mjProviderEnglish?.[subtitleIdentity(item, season, episode)];
      if (stream && stream.expiresAt > Date.now()) {
        const result = await stream.promise;
        if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
        if (result) return result;
      }
    }
    const identity2 = subtitleEdition(item, season, episode, duration), cacheKey = "mjplay.subtitles.cache.v2";
    let cache3 = [];
    try {
      const saved = JSON.parse(storage2.getItem(cacheKey) || "[]");
      if (Array.isArray(saved)) cache3 = saved.filter((r) => typeof r.text === "string" && r.text.length <= 8e5);
    } catch {
    }
    const previous = cache3.find((r) => r.identity === identity2);
    if (previous && !alternate) return { cues: parseSubtitle(previous.text), release: previous.release, fileId: previous.fileId, cached: true };
    const key3 = storage2?.getItem(subtitleKey);
    if (!key3) throw Error("OpenSubtitles API key is not configured on this TV.");
    const api = async (path, body) => {
      const response2 = await fetcher(endpoint + path, { signal, method: body ? "POST" : "GET", headers: { "Api-Key": key3, "X-User-Agent": "MJPlay v1.1.51", ...body ? { "Content-Type": "application/json" } : {} }, ...body ? { body: JSON.stringify(body) } : {} });
      if (!response2.ok) throw Error(response2.status === 429 || response2.status === 406 ? "Subtitle download limit reached. Try again later." : `Subtitle service unavailable (${response2.status}).`);
      return response2.json();
    };
    const results = await api("subtitles?" + subtitleSearch(item, season, episode));
    const candidates = rankEnglish(results.data || [], item, season, episode), candidate = alternate ? candidates.find((a) => ![...previous?.tried || [], previous?.fileId].includes(a.files[0].file_id)) : candidates[0];
    if (!candidate) throw Error(alternate ? "No other English subtitle available." : "No English subtitle found for this title.");
    const fileId = candidate.files[0].file_id, download = await api("download", { file_id: fileId, sub_format: "srt" }), url = new URL(download.link);
    if (url.protocol !== "https:" || url.username || url.password || !/(^|\.)(opensubtitles\.com|osdb\.link)$/.test(url.hostname)) throw Error("Invalid subtitle download address.");
    const response = await fetcher(url.href, { signal });
    if (!response.ok) throw Error("Subtitle download failed.");
    if (Number(response.headers.get("content-length")) > 8e5) throw Error("Subtitle file is too large.");
    const text = await response.text(), cues = parseSubtitle(text);
    cache3 = [{ identity: identity2, text, fileId, tried: alternate ? [...previous?.tried || [], previous?.fileId].filter(Boolean) : [], release: String(candidate.release || "English").slice(0, 200) }, ...cache3.filter((r) => r.identity !== identity2)].slice(0, 6);
    while (JSON.stringify(cache3).length > 15e5 && cache3.length > 1) cache3.pop();
    try {
      storage2.setItem(cacheKey, JSON.stringify(cache3));
    } catch {
    }
    return { cues, release: candidate.release, fileId, cached: false };
  }

  // src/services/subtitlePreparation.js
  var pending = /* @__PURE__ */ new Map();
  function prepareEnglishSubtitle(item, season, episode, { duration } = {}) {
    if (!Number.isFinite(duration) || duration <= 0) return Promise.resolve(null);
    const key3 = subtitleEdition(item, season, episode, duration);
    if (pending.has(key3)) return pending.get(key3);
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15e3);
    const request = fetchEnglishSubtitle(item, season, episode, { signal: controller.signal, duration }).finally(() => {
      clearTimeout(timer);
      pending.delete(key3);
    });
    pending.set(key3, request);
    return request;
  }

  // src/components/EnglishSubtitles.js
  function mountEnglishSubtitles(video, panel, { item, season, episode, onChange = () => {
  } }) {
    const storage2 = protectedStorage, read = (key3, fallback) => {
      try {
        return storage2.getItem(key3) ?? fallback;
      } catch {
        return fallback;
      }
    }, write = (key3, value) => {
      try {
        storage2.setItem(key3, String(value));
      } catch {
      }
    };
    let offsetKey = "", release = "";
    const overlay = video.ownerDocument.createElement("div");
    overlay.className = "english-subtitle-overlay";
    overlay.hidden = true;
    panel.parentElement.append(overlay);
    let enabled = read("mj-subtitle-language", "en") !== "off", delay = Math.max(-120, Math.min(120, 0)), cues = [], busy = false, disposed = false, message = "English subtitles", source = "", abort, timer, preferExternal = false;
    const tracks = () => Array.from(video.textTracks || []), english = () => tracks().find((t) => ["subtitles", "captions"].includes(t.kind) && (/^(en|eng)(-|$)/i.test(t.language) || /^english\b/i.test(t.label)));
    const render = () => {
      overlay.textContent = enabled && !video.seeking && ["OpenSubtitles", "Stream"].includes(source) && cues.length ? captionAt(cues, video.currentTime - delay) : "";
      overlay.hidden = !overlay.textContent;
      overlay.classList.toggle("large-subtitles", read("mj-subtitle-size", "normal") === "large");
      overlay.classList.toggle("controls-visible", !panel.hidden);
    };
    const changed = () => {
      render();
      onChange();
    };
    const load = async (alternate = false) => {
      if (!enabled || disposed) return;
      const track = english();
      if (track && !alternate && !preferExternal) {
        for (const t of tracks()) t.mode = t === track ? "showing" : "disabled";
        source = "Provider";
        message = "English \xB7 Provider";
        changed();
        return;
      }
      if (busy || !Number.isFinite(video.duration) || video.duration <= 0) return;
      if (cues.length && !alternate) return;
      busy = true;
      message = "Loading English subtitles\u2026";
      changed();
      abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), 15e3);
      try {
        const result = await (alternate ? fetchEnglishSubtitle(item, season, episode, { signal: abort.signal, alternate, duration: video.duration }) : prepareEnglishSubtitle(item, season, episode, { duration: video.duration }));
        if (disposed || !enabled) return;
        if (!result) return;
        cues = result.cues;
        release = result.release || "English";
        offsetKey = "mjplay.subtitle.offset.v2/" + subtitleEdition(item, season, episode, video.duration) + "/" + result.fileId;
        delay = Math.max(-120, Math.min(120, Number(read(offsetKey, 0)) || 0));
        if (english() && !alternate && !preferExternal) {
          source = "Provider";
          message = "English \xB7 Provider";
          for (const t of tracks()) t.mode = t === english() ? "showing" : "disabled";
        } else {
          preferExternal = alternate || preferExternal;
          source = result.source || "OpenSubtitles";
          message = source === "Stream" ? "English \xB7 included with this stream" : "English \xB7 title matched; timing may vary";
          for (const t of tracks()) t.mode = "disabled";
        }
      } catch (e) {
        if (!disposed) message = e.name === "AbortError" ? "Subtitle request timed out. Try again." : e.message;
      } finally {
        clearTimeout(timeout);
        busy = false;
        if (!disposed) changed();
      }
    };
    const metadata2 = () => {
      clearTimeout(timer);
      timer = setTimeout(() => load(), 100);
    };
    const clock = setInterval(render, 100);
    video.addEventListener("loadedmetadata", metadata2);
    video.addEventListener("playing", metadata2);
    video.addEventListener("durationchange", metadata2);
    video.addEventListener("timeupdate", render);
    video.addEventListener("seeking", render);
    video.addEventListener("seeked", render);
    video.textTracks?.addEventListener?.("addtrack", metadata2);
    load();
    return {
      status: () => ({ enabled, delay, message, source, busy, release }),
      enable(value) {
        enabled = value;
        write("mj-subtitle-language", value ? "en" : "off");
        if (!value) {
          abort?.abort();
          for (const t of tracks()) t.mode = "disabled";
        } else load();
        changed();
      },
      retry() {
        return load(source === "Provider" || ["OpenSubtitles", "Stream"].includes(source) && cues.length > 0);
      },
      shift(seconds) {
        if (source === "Provider") {
          message = "Timing adjustment is available for downloaded subtitles. Use another English subtitle.";
          changed();
          return;
        }
        delay = Math.max(-120, Math.min(120, delay + seconds));
        if (offsetKey) write(offsetKey, delay);
        changed();
      },
      resize() {
        render();
      },
      dispose() {
        disposed = true;
        abort?.abort();
        clearTimeout(timer);
        clearInterval(clock);
        video.removeEventListener("loadedmetadata", metadata2);
        video.removeEventListener("playing", metadata2);
        video.removeEventListener("durationchange", metadata2);
        video.removeEventListener("timeupdate", render);
        video.removeEventListener("seeking", render);
        video.removeEventListener("seeked", render);
        video.textTracks?.removeEventListener?.("addtrack", metadata2);
        overlay.remove();
      }
    };
  }

  // src/components/PlaybackExtras.js
  function preferredSubtitle(tracks, preference) {
    if (!preference || preference === "off") return -1;
    const key3 = (value) => String(value || "").toLowerCase().replaceAll("_", "-");
    const exact = tracks.findIndex((t) => key3(t.language || t.label) === key3(preference));
    return exact >= 0 ? exact : tracks.findIndex((t) => t.language && key3(t.language).split("-")[0] === key3(preference).split("-")[0]);
  }
  function mountPlaybackExtras(video, panel, { onNextEpisode, prepareNextEpisode, isMenuOpen, item, season, episode, getCredits = () => null, isInteracting = () => false }) {
    const read = (key3, fallback) => {
      try {
        return protectedStorage.getItem(key3) ?? fallback;
      } catch {
        return fallback;
      }
    };
    const write = (key3, value) => {
      try {
        protectedStorage.setItem(key3, value);
      } catch {
      }
    };
    let enabled = read("mj-autoplay-next", "true") === "true", cancelled = false, busy = false, disposed = false, nextInfo = null, subtitleOpen = false;
    const doc = video.ownerDocument, extras = doc.createElement("div");
    extras.className = "cinema-extras";
    extras.innerHTML = `<div class="cinema-extra-actions" data-focus-row><button data-focus="subtitle-menu">Subtitles</button><button data-focus="subtitle-quick-earlier" aria-label="Show subtitles half a second earlier">Earlier \u22120.5s</button><button data-focus="subtitle-quick-later" aria-label="Show subtitles half a second later">Later +0.5s</button>${onNextEpisode ? '<button data-focus="autoplay-toggle"></button>' : ""}</div><div class="cinema-subtitles" hidden></div><div class="cinema-up-next" hidden><div class="up-next-heading"><p class="up-next-eyebrow">UP NEXT</p><p data-up-label></p></div><div class="up-next-countdown"><span></span></div><div data-focus-row><button data-focus="up-play">Play next</button><button data-focus="up-cancel" aria-label="Keep watching this episode">Stay</button></div></div>`;
    panel.querySelector(".cinema-bottom").append(extras);
    const popup = extras.querySelector(".cinema-subtitles"), card = extras.querySelector(".cinema-up-next"), auto = extras.querySelector('[data-focus="autoplay-toggle"]');
    panel.parentElement.append(card);
    card.setAttribute?.("data-playback-prompt", "");
    const hideCard = () => {
      releasePlaybackPrompt(card, video);
      card.hidden = true;
    };
    let englishController = null;
    const tracks = () => Array.from(video.textTracks || []).filter((t) => ["subtitles", "captions"].includes(t.kind));
    const applySubtitles = () => {
      if (englishController) return;
      const available = tracks(), selected = preferredSubtitle(available, read("mj-subtitle-language", "off"));
      available.forEach((t, i) => {
        const mode = i === selected ? "showing" : "disabled";
        if (t.mode !== mode) t.mode = mode;
      });
    };
    const applySize = () => {
      video.classList.toggle("large-subtitles", read("mj-subtitle-size", "normal") === "large");
    };
    applySize();
    applySubtitles();
    const refreshEnglish = () => {
      if (!englishController || !subtitleOpen) return;
      const state2 = englishController.status();
      const notice = popup.querySelector("[data-subtitle-status]");
      if (notice) notice.textContent = state2.message;
      const version = popup.querySelector("[data-subtitle-version]");
      if (version) version.textContent = state2.source === "Provider" ? "Included with this stream" : state2.release || "Finding an English version";
      const offset = popup.querySelector("[data-subtitle-offset]");
      if (offset) offset.textContent = "Timing: " + (state2.delay > 0 ? "+" : "") + state2.delay.toFixed(1) + "s";
      for (const b of popup.querySelectorAll("[data-subtitle-enabled]")) b.setAttribute("aria-pressed", String(state2.enabled === (b.dataset.subtitleEnabled === "true")));
    };
    if (item) englishController = mountEnglishSubtitles(video, panel, { item, season, episode, onChange: refreshEnglish });
    for (const [key3, delta] of [["earlier", -0.5], ["later", 0.5]]) {
      const button = extras.querySelector('[data-focus="subtitle-quick-' + key3 + '"]');
      if (button) button.onclick = () => {
        if (!englishController) return;
        englishController.shift(delta);
        const value = englishController.status();
        const notice = panel.querySelector(".cinema-message");
        if (notice) notice.textContent = value.source === "Provider" ? value.message : "Subtitle timing " + (value.delay > 0 ? "+" : "") + value.delay.toFixed(1) + "s";
      };
    }
    const englishMenu = () => {
      subtitleOpen = true;
      popup.hidden = false;
      popup.setAttribute("data-modal", "");
      popup.innerHTML = '<div class="subtitle-heading"><span class="subtitle-badge">CC</span><div><h3>Subtitles</h3><p data-subtitle-status></p></div></div><p class="subtitle-section-label">LANGUAGE</p><div class="subtitle-language" data-focus-row><button data-focus="subtitle-english" data-subtitle-enabled="true">English</button><button data-focus="subtitle-off" data-subtitle-enabled="false">Off</button></div><div class="subtitle-version"><p class="subtitle-section-label">CURRENT VERSION</p><p data-subtitle-version></p><button data-focus="subtitle-retry">Try another version</button></div><p class="subtle">If captions drift further out of sync as you watch, try another version. Timing adjustment only corrects a steady delay.</p><div class="subtitle-timing-heading"><p class="subtitle-section-label">ADJUST TIMING</p><p data-subtitle-offset></p></div><div class="subtitle-timing" data-focus-row><button data-focus="subtitle-earlier">\u2212 0.5s</button><button data-focus="subtitle-later">Later +0.5s</button><button data-focus="subtitle-reset">Reset</button></div><div class="subtitle-footer" data-focus-row><button data-focus="subtitle-size">Text size: ' + escapeHtml(read("mj-subtitle-size", "normal")) + '</button><button data-focus="subtitle-close">Done</button></div>';
      for (const button of popup.querySelectorAll("[data-subtitle-enabled]")) button.onclick = () => englishController.enable(button.dataset.subtitleEnabled === "true");
      popup.querySelector('[data-focus="subtitle-retry"]').onclick = () => {
        englishController.enable(true);
        englishController.retry();
      };
      popup.querySelector('[data-focus="subtitle-earlier"]').onclick = () => englishController.shift(-0.5);
      popup.querySelector('[data-focus="subtitle-later"]').onclick = () => englishController.shift(0.5);
      popup.querySelector('[data-focus="subtitle-reset"]').onclick = () => englishController.shift(-englishController.status().delay);
      popup.querySelector('[data-focus="subtitle-size"]').onclick = () => {
        write("mj-subtitle-size", read("mj-subtitle-size", "normal") === "normal" ? "large" : "normal");
        applySize();
        englishController.resize();
        popup.querySelector('[data-focus="subtitle-size"]').textContent = "Text size: " + read("mj-subtitle-size", "normal");
      };
      popup.querySelector('[data-focus="subtitle-close"]').onclick = () => {
        subtitleOpen = false;
        popup.hidden = true;
        popup.removeAttribute?.("data-modal");
        extras.querySelector('[data-focus="subtitle-menu"]').focus();
      };
      refreshEnglish();
      popup.querySelector("button").focus();
    };
    const menu = () => {
      subtitleOpen = true;
      if (englishController) {
        englishMenu();
        return;
      }
      popup.hidden = false;
      const available = tracks();
      popup.innerHTML = `<p>Subtitles</p><div data-focus-row><button data-focus="subtitle-off">Off</button>${available.map((t, i) => `<button data-focus="subtitle-${i}" data-track="${i}">${escapeHtml(t.label || t.language || "Track " + (i + 1))}</button>`).join("")}</div>${available.length ? "" : "<p>This stream has no subtitle tracks available.</p>"}<div data-focus-row><button data-focus="subtitle-size">Text size: ${read("mj-subtitle-size", "normal")}</button><button data-focus="subtitle-close">Done</button></div>`;
      popup.querySelector('[data-focus="subtitle-off"]').onclick = () => {
        write("mj-subtitle-language", "off");
        applySubtitles();
      };
      for (const button of popup.querySelectorAll("[data-track]")) button.onclick = () => {
        const t = available[Number(button.dataset.track)];
        write("mj-subtitle-language", t.language || t.label);
        applySubtitles();
      };
      popup.querySelector('[data-focus="subtitle-size"]').onclick = () => {
        write("mj-subtitle-size", read("mj-subtitle-size", "normal") === "normal" ? "large" : "normal");
        applySize();
        menu();
      };
      popup.querySelector('[data-focus="subtitle-close"]').onclick = () => {
        subtitleOpen = false;
        popup.hidden = true;
        extras.querySelector('[data-focus="subtitle-menu"]').focus();
      };
      popup.querySelector("button").focus();
    };
    extras.querySelector('[data-focus="subtitle-menu"]').onclick = () => {
      if (subtitleOpen) {
        subtitleOpen = false;
        popup.hidden = true;
      } else menu();
    };
    const subtitleBack = (e) => {
      if (!subtitleOpen || !(e.key === "Escape" || e.key === "Backspace" || e.keyCode === 461)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      subtitleOpen = false;
      popup.hidden = true;
      popup.removeAttribute?.("data-modal");
      extras.querySelector('[data-focus="subtitle-menu"]').focus();
    };
    doc.addEventListener("keydown", subtitleBack, true);
    const countdown = createCreditsCountdown();
    const refresh = () => {
      if (auto) auto.textContent = "Autoplay next: " + (enabled ? "On" : "Off");
    };
    refresh();
    if (auto) auto.onclick = () => {
      enabled = !enabled;
      write("mj-autoplay-next", String(enabled));
      refresh();
      countdown.reset();
      if (!enabled) hideCard();
    };
    const advance = async () => {
      if (busy || disposed || !onNextEpisode) return;
      busy = true;
      card.hidden = false;
      card.querySelector("[data-up-label]").textContent = "Loading next episode\u2026";
      try {
        const result = await onNextEpisode();
        if (!result && !disposed) {
          cancelled = true;
          card.querySelector("[data-up-label]").textContent = "No more episodes available.";
        }
      } catch {
        if (!disposed) {
          cancelled = true;
          card.querySelector("[data-up-label]").textContent = "Could not load next episode. Press Play next to retry, or use Playback options.";
        }
      } finally {
        busy = false;
      }
    };
    card.querySelector('[data-focus="up-play"]').onclick = advance;
    const stay = () => {
      cancelled = true;
      hideCard();
    };
    card.querySelector('[data-focus="up-cancel"]').onclick = stay;
    const promptKey = (e) => {
      if (card.hidden || isMenuOpen() || subtitleOpen) return;
      const back = e.keyCode === 461 || e.key === "Escape" || e.key === "Backspace", ok = e.keyCode === 13 || e.key === "Enter";
      if (back) {
        e.preventDefault();
        e.stopImmediatePropagation();
        stay();
      } else if (ok && card.contains?.(doc.activeElement)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) doc.activeElement.click();
      }
    };
    doc.addEventListener("keydown", promptKey, true);
    const update = () => {
      const marker = getCredits(), inCredits = !!marker && video.currentTime >= marker.start, remaining = video.duration - video.currentTime;
      if (marker && !inCredits) {
        countdown.reset();
        cancelled = false;
      }
      const canRun = enabled && !cancelled && !!nextInfo && !isMenuOpen() && !subtitleOpen && !video.paused && !video.seeking && !video.ended && (video.readyState === void 0 || video.readyState >= 3);
      const state2 = countdown.update({ position: video.currentTime, marker, playing: canRun });
      if (!enabled || cancelled || !nextInfo || isMenuOpen() || subtitleOpen || !Number.isFinite(remaining) || !inCredits && remaining > 15) {
        if (!busy) hideCard();
        return;
      }
      if (!busy && remaining > 0) {
        card.hidden = false;
        card.querySelector("[data-up-label]").textContent = `S${nextInfo.season} \xB7 E${nextInfo.episode}${state2.protectedScene ? " \xB7 Post-credit scene ahead" : ""}`;
        const seconds = state2.active ? state2.seconds : remaining;
        card.querySelector(".up-next-countdown span").style.width = `${state2.protectedScene ? 0 : Math.max(0, Math.min(100, seconds / (state2.active ? 10 : 15) * 100))}%`;
        card.querySelector('[data-focus="up-play"]').textContent = state2.protectedScene ? "Next episode" : `Next episode \xB7 ${Math.ceil(seconds)}s`;
        focusPlaybackPrompt(card.querySelector('[data-focus="up-play"]'), panel, video.seeking || isInteracting() || isMenuOpen() || subtitleOpen);
        if (state2.due && canRun) advance();
      }
    };
    const ended = () => {
      if (enabled && !cancelled && nextInfo) advance();
    };
    if (prepareNextEpisode) Promise.resolve().then(prepareNextEpisode).then((next) => {
      if (!disposed) {
        nextInfo = next;
        update();
      }
    }).catch(() => {
    });
    const countdownTimer = setInterval(update, 250);
    video.addEventListener("timeupdate", update);
    video.addEventListener("ended", ended);
    video.textTracks?.addEventListener?.("addtrack", applySubtitles);
    video.addEventListener("loadedmetadata", applySubtitles);
    return { keepVisible: () => subtitleOpen, dispose: () => {
      disposed = true;
      clearInterval(countdownTimer);
      doc.removeEventListener("keydown", subtitleBack, true);
      doc.removeEventListener("keydown", promptKey, true);
      englishController?.dispose();
      video.removeEventListener("timeupdate", update);
      video.removeEventListener("ended", ended);
      video.removeEventListener("loadedmetadata", applySubtitles);
      video.textTracks?.removeEventListener?.("addtrack", applySubtitles);
      card.remove();
      extras.remove();
    } };
  }

  // src/components/playerOverlay.js
  function mountPlayerOverlay(doc, element, isMenuOpen, scheduler = globalThis) {
    let timer, disposed = false;
    const hide = () => {
      if (disposed || isMenuOpen()) return;
      element.hidden = true;
    };
    const show = (e) => {
      if (disposed || e?.target?.closest?.("[data-playback-prompt]") || e?.type === "focusin" && e.target?.tagName === "VIDEO") return;
      element.hidden = false;
      scheduler.clearTimeout(timer);
      timer = scheduler.setTimeout(hide, 3e3);
    };
    const events = ["keydown", "pointermove", "pointerdown", "focusin"];
    for (const event of events) doc.addEventListener(event, show, true);
    show();
    return () => {
      disposed = true;
      scheduler.clearTimeout(timer);
      for (const event of events) doc.removeEventListener(event, show, true);
    };
  }

  // src/components/DirectVideoControls.js
  var icon = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  var playIcon = icon("M8 5v14l11-7z");
  var pauseIcon = icon("M6 5h4v14H6zM14 5h4v14h-4z");
  function mountDirectVideoControls(video, panel, { item, season, episode, provider: provider2, startAt, isMenuOpen, onNextEpisode, prepareNextEpisode, onOptions, onQuality }) {
    const doc = video.ownerDocument;
    let tvMenus = null;
    const externalMenu = isMenuOpen;
    isMenuOpen = () => externalMenu() || !!tvMenus?.isOpen();
    panel.classList.add("cinema-controls");
    panel.innerHTML = `<div class="cinema-top"><div class="cinema-top-actions" data-focus-row><button data-back data-focus="player-back">${icon("M15 4L7 12l8 8")}Exit</button><button data-focus="direct-restart">${icon("M5 7v5h5M5 12a7 7 0 1 1 2 5")}Play from beginning</button>${item.type === "tv" && onNextEpisode ? `<button data-focus="direct-next">${icon("M5 5v14l10-7zM18 5v14")}Next episode</button>` : ""}</div><span class="cinema-brand">MJ <b>PLAY</b></span></div><div class="cinema-bottom"><div class="cinema-heading"><div><p>${item.type === "tv" ? `SEASON ${season} \xB7 EPISODE ${episode}` : "NOW PLAYING"}</p><h2>${escapeHtml(item.title || "")}</h2></div><span class="cinema-quality" data-quality></span></div><button class="cinema-seek" data-focus="direct-seek" role="slider" aria-label="Playback position" aria-valuemin="0"><span class="cinema-track"><span class="cinema-buffer"></span><span class="cinema-progress"></span><span class="cinema-thumb"></span></span></button><div class="cinema-times"><span data-elapsed></span><span data-remaining></span></div><div class="cinema-bottom-actions"><div class="cinema-transport" data-focus-row><button id="player-toggle" data-focus="player-toggle" aria-label="Pause"></button><button data-focus="direct-rewind" aria-label="Rewind 10 seconds">${icon("M4 8v5h5M4 13a8 8 0 1 1 3 6")}<small>10</small></button><button data-focus="direct-forward" aria-label="Forward 10 seconds">${icon("M20 8v5h-5M20 13a8 8 0 1 0-3 6")}<small>10</small></button></div><button class="cinema-quality-action" data-focus="direct-quality" aria-label="Video quality">${icon("M3 5h18v14H3zM7 9v6M7 12h4M11 9v6M15 9h3v6h-3z")}<span data-quality-label>Quality</span></button><button class="cinema-options" data-focus="direct-options">Playback options</button></div><p class="cinema-message" role="status"></p></div>`;
    const bar = panel.querySelector(".cinema-seek"), toggle = panel.querySelector("#player-toggle"), message = panel.querySelector(".cinema-message");
    const format = (value) => {
      const n = Math.floor(Math.max(0, value || 0));
      return (n >= 3600 ? Math.floor(n / 3600) + ":" : "") + String(Math.floor(n / 60) % 60).padStart(n >= 3600 ? 2 : 1, "0") + ":" + String(n % 60).padStart(2, "0");
    };
    let credits = null;
    let continuationBusy = false, continuationQueued = false;
    const queueContinuation = () => {
      if (!prepareNextEpisode || item.type !== "tv" || continuationBusy || continuationQueued) return;
      continuationBusy = true;
      advanceContinueWatching(item, season, episode, prepareNextEpisode).then((advanced) => {
        continuationQueued = advanced;
      }).catch(() => {
      }).finally(() => {
        continuationBusy = false;
      });
    };
    let lastSave = 0;
    const resume = resumePosition(video, startAt);
    let recentRecorded = false;
    const save = () => {
      if (!recentRecorded && !resume.pending && video.currentTime >= 30 && Number.isFinite(video.duration) && video.duration - video.currentTime > 15) {
        recentRecorded = library.record(item, season, episode);
      }
      if (!resume.pending && Number.isFinite(video.duration) && video.duration > 0) progressStore.save(provider2, item, season, episode, { position: Math.min(video.currentTime, video.duration), duration: video.duration, completed: video.ended || !!credits && video.currentTime >= credits.start });
      if (!resume.pending && item.type === "movie" && Number.isFinite(video.duration) && video.duration > 0 && (video.ended || credits && video.currentTime >= credits.start || finishedMovieProgress({ position: video.currentTime, duration: video.duration }))) library.removeRecent("movie", item.tmdbId ?? item.id);
      if (!resume.pending && (video.ended || credits && video.currentTime >= credits.start || video.duration - video.currentTime <= 15)) queueContinuation();
    };
    const stopLifecycle = mountPlaybackLifecycle(video, save);
    let scrub;
    const update = () => {
      resume.apply();
      const duration = Number.isFinite(video.duration) ? video.duration : 0, position = scrub?.position ?? video.currentTime ?? 0;
      let buffered = position;
      try {
        if (video.buffered.length) buffered = video.buffered.end(video.buffered.length - 1);
      } catch {
      }
      bar.style.setProperty("--played", `${duration ? position / duration * 100 : 0}%`);
      bar.style.setProperty("--buffered", `${duration ? buffered / duration * 100 : 0}%`);
      bar.setAttribute("aria-valuemax", String(duration));
      bar.setAttribute("aria-valuenow", String(Math.floor(position)));
      bar.setAttribute("aria-valuetext", `${format(position)} of ${format(duration)}`);
      panel.querySelector("[data-elapsed]").textContent = format(position);
      panel.querySelector("[data-remaining]").textContent = "\u2212" + format(duration - position);
      const height = video.videoHeight;
      panel.querySelector("[data-quality]").textContent = height ? height >= 2160 ? "4K" : height >= 1080 ? "FULL HD" : height >= 720 ? "HD" : `${height}p` : "";
      const qualityLabel = panel.querySelector("[data-quality-label]");
      if (qualityLabel) qualityLabel.textContent = height ? "Quality \xB7 " + height + "p" : "Quality";
      toggle.innerHTML = video.paused ? playIcon : pauseIcon;
      toggle.setAttribute("aria-label", video.paused ? "Play" : "Pause");
      if (Date.now() - lastSave > 5e3) {
        save();
        lastSave = Date.now();
      }
    };
    const play = () => video.play().catch(() => {
      message.textContent = "Press Play to resume.";
    });
    scrub = seekPreview(video, { onPreview: update, onCommit: () => resume.reset() });
    const seek = (delta) => scrub.step(delta);
    toggle.onclick = () => video.paused ? play() : video.pause();
    const stopRemoteOk = mountPlayerRemoteOk(doc, panel, toggle, { isMenuOpen, onToggle: () => toggle.onclick() });
    panel.querySelector('[data-focus="direct-rewind"]').onclick = () => seek(-10);
    panel.querySelector('[data-focus="direct-forward"]').onclick = () => seek(10);
    panel.querySelector('[data-focus="direct-restart"]').onclick = () => {
      scrub.cancel();
      resume.reset();
      video.currentTime = 0;
      if (Number.isFinite(video.duration) && video.duration > 0) progressStore.save(provider2, item, season, episode, { position: 0, duration: video.duration, completed: false, restarted: true });
      play();
    };
    panel.querySelector('[data-focus="direct-options"]').onclick = onOptions;
    panel.querySelector('[data-focus="direct-quality"]').onclick = onQuality;
    const next = panel.querySelector('[data-focus="direct-next"]');
    if (next) next.onclick = async () => {
      next.disabled = true;
      message.textContent = "Loading next episode\u2026";
      try {
        if (!await onNextEpisode()) message.textContent = "No more episodes available.";
      } catch {
        message.textContent = "Could not load the next episode. Try again.";
        next.disabled = false;
      } finally {
        next.disabled = false;
      }
    };
    bar.onclick = (e) => {
      if (e.detail && Number.isFinite(video.duration)) {
        const rect = bar.getBoundingClientRect();
        video.currentTime = Math.max(0, Math.min(video.duration - 0.1, (e.clientX - rect.left) / rect.width * video.duration));
      } else toggle.onclick();
    };
    const keys2 = (e) => {
      if (isMenuOpen()) return;
      const key3 = e.key || { 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight" }[e.keyCode];
      const prompt = doc.activeElement?.closest?.("[data-playback-prompt]:not([hidden])");
      if (prompt) {
        if (key3 === "ArrowUp" || prompt.classList.contains("cinema-skip-intro") && ["ArrowLeft", "ArrowRight"].includes(key3)) {
          panel.hidden = false;
          bar.focus();
          if (key3 !== "ArrowUp") seek(key3 === "ArrowLeft" ? -10 : 10);
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }
      if (panel.hidden && key3?.startsWith("Arrow")) {
        panel.hidden = false;
        bar.focus();
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if ((doc.activeElement === bar || !doc.activeElement?.closest(".cinema-controls")) && (key3 === "ArrowLeft" || key3 === "ArrowRight")) {
        seek(key3 === "ArrowLeft" ? -10 : 10);
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    const releaseSeek = (e) => {
      if (["ArrowLeft", "ArrowRight"].includes(e.key) || [37, 39].includes(e.keyCode)) scrub.commit();
    };
    doc.addEventListener("keydown", keys2, true);
    doc.addEventListener("keyup", releaseSeek, true);
    const loaded = () => update();
    const creditsController = mountCreditsController(video, item, season, episode, { onChange: (marker) => {
      credits = marker;
      video.dataset.creditsStart = marker ? String(marker.start) : "";
      video.dataset.creditsSource = marker?.source || "";
      save();
    } });
    const events = ["timeupdate", "progress", "play", "pause", "ended", "seeked", "resize"];
    for (const name of events) video.addEventListener(name, update);
    for (const name of ["pause", "seeked", "ended"]) video.addEventListener(name, save);
    video.addEventListener("loadedmetadata", loaded);
    if (video.readyState >= 1) loaded();
    else update();
    const extras = video.__mjProviderControlled ? { keepVisible: () => false, dispose: () => {
    } } : mountPlaybackExtras(video, panel, { item, season, episode, getCredits: () => credits, onNextEpisode: item.type === "tv" ? onNextEpisode : null, isInteracting: () => scrub.position !== null, prepareNextEpisode: item.type === "tv" ? prepareNextEpisode : null, isMenuOpen });
    const qualityAction = panel.querySelector('[data-focus="direct-quality"]'), subtitleAction = panel.querySelector('[data-focus="subtitle-menu"]');
    if (qualityAction && subtitleAction) subtitleAction.insertAdjacentElement("afterend", qualityAction);
    if (globalThis.location?.protocol === "file:") tvMenus = mountTVPlayerMenus(panel, { item, season, episode });
    const introPrompt = mountIntroPrompt(video, panel, { item, season, episode, isBlocked: () => isMenuOpen() || extras.keepVisible() || scrub.position !== null, onSeek: () => {
      scrub.cancel();
      resume.reset();
    } });
    const stopOverlay = mountPlayerOverlay(doc, panel, () => scrub.position !== null || isMenuOpen() || extras.keepVisible() || video.paused || video.ended);
    return () => {
      tvMenus?.dispose();
      introPrompt.dispose();
      creditsController.dispose();
      stopLifecycle();
      stopRemoteOk();
      scrub.cancel();
      save();
      extras.dispose();
      stopOverlay();
      doc.removeEventListener("keydown", keys2, true);
      doc.removeEventListener("keyup", releaseSeek, true);
      video.removeEventListener("loadedmetadata", loaded);
      for (const name of events) video.removeEventListener(name, update);
      for (const name of ["pause", "seeked", "ended"]) video.removeEventListener(name, save);
    };
  }

  // web/ExperimentalEmbedPlayer.js
  var origin = "https://embed.vidrift.net";
  var provider = "MJ Player \xB7 VidRift experimental";
  function createFrame(doc) {
    const frame = doc.createElement("iframe");
    frame.title = "Experimental video provider";
    frame.tabIndex = -1;
    frame.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
    frame.allowFullscreen = true;
    return frame;
  }
  function mountExperimentalEmbed(state2, root, { onNextEpisode, prepareNextEpisode, onCancel, onUseDirect } = {}) {
    const host = root.querySelector("#player-host"), status = root.querySelector("#player-status");
    let identity2;
    try {
      identity2 = embedIdentity(state2.item, state2.season, state2.episode);
    } catch (e) {
      status.hidden = false;
      status.innerHTML = "<h2>Playback unavailable</h2><p>" + escapeHtml(e.message) + "</p><button data-back>Back</button>";
      return () => {
      };
    }
    const previousPanels = [...root.querySelectorAll(".player-controls,.iframe-back")].map((el) => ({ el, hidden: el.hidden }));
    for (const { el } of previousPanels) el.hidden = true;
    const doc = root.ownerDocument, stage = doc.createElement("div");
    stage.className = "web-controlled-embed web-embed-portal";
    stage.dataset.transport = "vidrift";
    stage.insertAdjacentHTML("beforeend", '<button class="web-embed-surface" aria-label="Show MJ controls"></button><div class="player-controls"></div><div class="web-embed-notice" role="status" hidden></div><div class="web-embed-menu" role="dialog" aria-label="Playback options" hidden></div>');
    const statusParent = status.parentNode, statusNext = status.nextSibling;
    host.replaceChildren();
    doc.body.append(stage);
    stage.append(status);
    const frame = createFrame(doc), surface = stage.querySelector(".web-embed-surface"), panel = stage.querySelector(".player-controls"), notice = stage.querySelector(".web-embed-notice"), menu = stage.querySelector(".web-embed-menu");
    frame.src = "about:blank";
    stage.prepend(frame);
    const facade = doc.createElement("video");
    facade.hidden = true;
    facade.__mjProviderControlled = true;
    stage.append(facade);
    let value = {}, disposed = false, menuOpen = false, metadata2 = false, playing = false, resumeApplied = false, nextStarted = false, timeout, hideNotice, activationTimer, activationRequired = false, unmuteRequested = false, run = 0;
    const saved = progressStore.latest(provider, state2.item, state2.season, state2.episode), resume = state2.restart ? 0 : saved && !saved.completed && saved.position >= 10 ? saved.position : 0;
    function send(action, extra = {}) {
      if (disposed || !frame.contentWindow) return;
      frame.contentWindow.postMessage({ type: "vidrift:" + action, ...extra }, origin);
    }
    const message = (text) => {
      notice.textContent = text;
      notice.hidden = false;
      clearTimeout(hideNotice);
      hideNotice = setTimeout(() => {
        notice.hidden = true;
      }, 5500);
    };
    const closeActivation = () => {
      clearTimeout(activationTimer);
      stage.classList.remove("web-embed-activation");
    };
    function explainActivation() {
      clearTimeout(hideNotice);
      notice.replaceChildren();
      notice.hidden = false;
      const text = doc.createElement("p");
      text.textContent = "The provider requires a tap inside its video to resume. Fullscreen alone cannot activate it.";
      const activate = doc.createElement("button");
      activate.textContent = "Enable video tap";
      activate.onclick = () => {
        stage.classList.add("web-embed-activation");
        text.textContent = "Tap the play button in the video. Provider interaction is temporarily enabled and may open provider ads.";
        activate.hidden = true;
        activationTimer = setTimeout(() => {
          closeActivation();
          explainActivation();
        }, 15e3);
      };
      const cancel = doc.createElement("button");
      cancel.textContent = "Cancel";
      cancel.onclick = () => {
        closeActivation();
        notice.hidden = true;
      };
      notice.append(text, activate, cancel);
    }
    function fail(text) {
      if (disposed) return;
      clearTimeout(timeout);
      status.classList.remove("web-embed-loading");
      send("pause");
      if (!playing) frame.src = "about:blank";
      status.hidden = false;
      status.classList.remove("player-ready");
      status.innerHTML = "<h2>Playback could not start</h2><p>" + escapeHtml(text) + '</p><div class="actions"><button data-embed-retry>Retry</button><button data-use-direct>Use MJ direct player</button><button data-back>Back</button></div>';
      status.querySelector("[data-embed-retry]").onclick = start;
      status.querySelector("[data-use-direct]").onclick = () => onUseDirect?.();
    }
    Object.defineProperties(facade, { currentTime: { get: () => value.currentTime || 0, set: (t) => {
      if (Number.isFinite(t)) send("resume", { currentTime: Math.max(0, t) });
    } }, duration: { get: () => value.duration || NaN }, paused: { get: () => value.paused !== false }, ended: { get: () => !!value.ended }, readyState: { get: () => metadata2 ? 4 : 0 }, videoHeight: { get: () => 0 } });
    facade.play = () => {
      if (activationRequired) explainActivation();
      else if (!run) start();
      else send("play");
      return Promise.resolve();
    };
    facade.pause = () => send("pause");
    const list = (field) => Array.isArray(value[field]) ? value[field].filter((o) => o && typeof o.value === "string" && o.value.length <= 160 && typeof o.label === "string").slice(0, 100) : [];
    function options() {
      menuOpen = true;
      panel.hidden = false;
      menu.hidden = false;
      menu.replaceChildren();
      const title = doc.createElement("h2");
      title.textContent = "Playback options";
      menu.append(title);
      for (const [field, items, label] of [["quality", "qualities", "Quality"], ["audio", "audios", "Audio"], ["subtitle", "subtitles", "Subtitles"]]) {
        const row = doc.createElement("label");
        row.textContent = label;
        const select = doc.createElement("select");
        select.setAttribute("aria-label", label);
        for (const o of list(items)) {
          const option = doc.createElement("option");
          option.value = o.value;
          option.textContent = o.label.slice(0, 100);
          select.append(option);
        }
        select.value = value[field];
        select.disabled = !select.options.length;
        select.onchange = () => {
          if (!list(items).some((o) => o.value === select.value)) return;
          send("set", { [field]: select.value });
        };
        row.append(select);
        menu.append(row);
      }
      const direct = doc.createElement("button");
      direct.textContent = "Use MJ direct player";
      direct.onclick = () => onUseDirect?.();
      const done = doc.createElement("button");
      done.textContent = "Done";
      done.onclick = () => {
        menuOpen = false;
        menu.hidden = true;
        panel.querySelector("#player-toggle")?.focus();
      };
      menu.append(direct, done);
      done.focus();
    }
    const stopControls = mountDirectVideoControls(facade, panel, { item: state2.item, season: state2.season, episode: state2.episode, provider, startAt: resume, isMenuOpen: () => menuOpen, onNextEpisode, prepareNextEpisode, onOptions: options, onQuality: options });
    const heading = doc.createElement("header");
    heading.className = "web-embed-heading";
    heading.innerHTML = '<button data-back aria-label="Back"><svg viewBox="0 0 24 24"><path d="m14 5-7 7 7 7"/></svg></button><div><strong>' + escapeHtml(state2.item.title || "") + "</strong><small>" + (identity2.type === "tv" ? "Season " + identity2.season + " \xB7 Episode " + identity2.episode : "MJ PLAYER") + "</small></div>";
    stage.append(heading);
    const info = doc.createElement("section");
    info.className = "web-embed-description";
    info.innerHTML = "<h1>" + escapeHtml(state2.item.title || "") + "</h1><p>" + escapeHtml(state2.item.overview || state2.item.description || "") + "</p>";
    stage.append(info);
    const settings = panel.querySelector(".cinema-options");
    settings.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 17h16M9 4v6M15 14v6"/></svg><span>Playback options</span>';
    const mobileLayout = matchMedia("(max-width:700px), (max-width:1000px) and (max-height:550px)");
    const applyLayout = () => {
      stage.classList.toggle("web-embed-mobile", mobileLayout.matches);
      settings.setAttribute("aria-label", mobileLayout.matches ? "Playback settings" : "Playback options");
    };
    mobileLayout.addEventListener("change", applyLayout);
    applyLayout();
    stage.addEventListener("click", (e) => {
      if (e.target.closest("[data-back]")) onCancel?.();
    });
    const fullscreen = doc.createElement("button");
    fullscreen.className = "web-embed-fullscreen";
    fullscreen.setAttribute("aria-label", "Fullscreen");
    fullscreen.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>';
    fullscreen.onclick = async () => {
      try {
        if (doc.fullscreenElement) await doc.exitFullscreen();
        else if (stage.requestFullscreen) await stage.requestFullscreen();
        else message("Fullscreen is not available in this browser.");
      } catch {
        message("Your browser did not allow fullscreen. Try again from this button.");
      }
    };
    panel.querySelector(".cinema-bottom-actions").append(fullscreen);
    surface.onclick = () => {
      panel.hidden = false;
    };
    surface.onkeydown = (e) => {
      if (e.key === " ") {
        e.preventDefault();
        value.paused ? facade.play() : facade.pause();
      }
    };
    function receive(e) {
      if (disposed) return;
      if (e.origin === origin && e.source === frame.contentWindow) {
        stage.dataset.received = String(Number(stage.dataset.received || 0) + 1);
        stage.dataset.lastMessage = String(e.data?.type || "unknown").slice(0, 60);
      }
      if (!matchesEmbedMessage(e, frame.contentWindow, identity2)) {
        if (e.origin === origin && e.source === frame.contentWindow) stage.dataset.rejected = String(Number(stage.dataset.rejected || 0) + 1);
        return;
      }
      stage.dataset.accepted = String(Number(stage.dataset.accepted || 0) + 1);
      const d = e.data;
      for (const key3 of ["currentTime", "duration", "paused", "muted", "volume", "quality", "audio", "subtitle", "qualities", "audios", "subtitles", "servers"]) if (d[key3] !== void 0) value[key3] = d[key3];
      if (d.type === "vidrift:paused") {
        value.paused = true;
        facade.dispatchEvent(new Event("pause"));
      }
      if (d.type === "vidrift:unpaused") {
        value.paused = false;
        activationRequired = false;
        unmuteRequested = false;
        closeActivation();
        notice.hidden = true;
        facade.dispatchEvent(new Event("play"));
      }
      if (value.paused === false && value.muted === true && !unmuteRequested && !activationRequired) {
        unmuteRequested = true;
        send("set", { muted: false, volume: 1 });
      }
      if (embedPlaybackStarted(d, value)) {
        playing = true;
        stage.dataset.phase = "playing";
        clearTimeout(timeout);
        status.hidden = true;
      }
      if (validEmbedProgress(value)) {
        status.hidden = true;
        if (!metadata2) {
          metadata2 = true;
          facade.dispatchEvent(new Event("loadedmetadata"));
        }
        facade.dispatchEvent(new Event("timeupdate"));
        if (!resumeApplied && resume > 0) {
          resumeApplied = true;
          send("resume", { currentTime: resume });
        }
      }
      if (d.type === "vidrift:command-error") {
        if (d.reason === "click-required") {
          activationRequired = true;
          explainActivation();
        } else message("The provider could not apply that option. Reopen Playback options and try again.");
      }
      if (d.type === "vidrift:ended" && !nextStarted) {
        value.ended = true;
        facade.dispatchEvent(new Event("ended"));
        if (identity2.type === "tv" && onNextEpisode && protectedStorage.getItem("mj-autoplay-next") !== "false") {
          nextStarted = true;
          void Promise.resolve(onNextEpisode()).catch(() => message("Could not open the next episode."));
        }
      }
    }
    const full = () => {
      send("fullscreen-state", { on: doc.fullscreenElement === stage });
    };
    const keys2 = (e) => {
      if (e.defaultPrevented || ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "Escape" && menuOpen) {
        menuOpen = false;
        menu.hidden = true;
        return;
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        fullscreen.click();
      }
    };
    window.addEventListener("message", receive);
    doc.addEventListener("fullscreenchange", full);
    doc.addEventListener("keydown", keys2);
    function start() {
      clearTimeout(timeout);
      closeActivation();
      activationRequired = false;
      unmuteRequested = false;
      notice.hidden = true;
      run++;
      stage.dataset.attempt = String(run);
      stage.dataset.received = stage.dataset.accepted = stage.dataset.rejected = stage.dataset.frameLoads = "0";
      stage.dataset.phase = "loading";
      value = {};
      metadata2 = false;
      playing = false;
      resumeApplied = false;
      nextStarted = false;
      menuOpen = false;
      menu.hidden = true;
      status.classList.add("web-embed-loading");
      status.hidden = false;
      status.innerHTML = '<div class="spinner"></div><h2>Preparing playback\u2026</h2>';
      timeout = setTimeout(() => {
        stage.dataset.phase = "timeout";
        fail("The provider did not report advancing playback. Retry or use MJ direct player.");
      }, 3e4);
      frame.src = embedUrl(identity2);
      if (!frame.isConnected) stage.prepend(frame);
    }
    frame.onload = () => {
      if (disposed || frame.getAttribute("src") === "about:blank") return;
      stage.dataset.frameLoads = String(Number(stage.dataset.frameLoads || 0) + 1);
      if (stage.dataset.phase === "loading") status.hidden = true;
      send("get-state");
      send("nextup-info", { next: null });
      full();
    };
    frame.onerror = () => fail("The external player could not load.");
    start();
    return () => {
      if (disposed) return;
      disposed = true;
      closeActivation();
      mobileLayout.removeEventListener("change", applyLayout);
      clearTimeout(timeout);
      clearTimeout(hideNotice);
      window.removeEventListener("message", receive);
      doc.removeEventListener("fullscreenchange", full);
      doc.removeEventListener("keydown", keys2);
      stopControls();
      frame.onload = frame.onerror = null;
      frame.src = "about:blank";
      status.classList.remove("web-embed-loading");
      statusParent.insertBefore(status, statusNext?.parentNode === statusParent ? statusNext : null);
      stage.remove();
      for (const { el, hidden } of previousPanels) el.hidden = hidden;
      status.hidden = true;
    };
  }

  // <stdin>
  var params = new URLSearchParams(location.search);
  var tv = params.get("type") === "tv";
  var id = Number(params.get("id")) || 155;
  var state = { item: { id, tmdbId: id, type: tv ? "tv" : "movie", title: tv ? "Family Guy" : "The Dark Knight", overview: "Isolated Android WebView research. Native playback and live TV are unchanged." }, season: Number(params.get("season")) || 1, episode: Number(params.get("episode")) || 1 };
  mountExperimentalEmbed(state, document.querySelector("#app"), { onCancel: () => {
    location.href = "https://mj-embed-research.invalid/close";
  }, onUseDirect: () => {
    document.querySelector("#return").hidden = false;
  } });
})();
