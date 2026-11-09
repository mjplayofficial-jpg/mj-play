package com.mjentertainment.mjplay.android

import android.content.Context
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.supervisorScope
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL

const val BACKEND = "https://mjplay-private-trial.onrender.com"
class SourceHttpException(val status: Int) : Exception(when (status) {
    429 -> "Too many requests. Please wait a moment."
    404 -> "No playable source was found for this title."
    502, 503, 504 -> "The source is currently unavailable (HTTP $status). Retry to request a fresh stream."
    else -> "The source returned HTTP $status. Please retry."
})
data class Title(val id: Int, val type: String, val title: String, val overview: String = "", val poster: String = "", val backdrop: String = "", val year: String = "", val rating: String = "", val seasons: List<Int> = emptyList()) {
    val key get() = "$type/$id"
}
data class Episode(val number: Int, val title: String, val image: String, val overview: String, val airDate: String = "")
data class Person(val id: Int, val name: String, val image: String)
data class PersonPage(val people: List<Person>, val hasMore: Boolean)
data class Caption(val start: Double, val end: Double, val text: String)
data class EnglishCaptions(val cues: List<Caption>, val release: String)
data class Programme(val start: Long, val end: Long, val title: String)
data class CreditsMarker(val start: Long, val hasPostCredits: Boolean)
data class NextEpisode(val season: Int, val episode: Int, val title: String)
data class Channel(val number: Int, val title: String, val logo: String, val categories: List<String>)
data class Stream(val url: String, val live: Boolean = false, val sample: Boolean = false, val hls: Boolean = false, val localChannel: Int? = null, val localVod: Boolean = false, val alternatives: List<String> = emptyList())
data class SavedProgress(val position: Long, val duration: Long, val season: Int, val episode: Int)
data class SportsTeam(val name: String, val logo: String)
data class SportsSource(val provider: String, val serverNumber: Int, val kind: String, val channel: Int, val videoKey: String)
data class SportsEvent(val id: String, val title: String, val starts: Long, val ends: Long, val highlight: Boolean, val league: String, val home: SportsTeam, val away: SportsTeam, val image: String, val sources: List<SportsSource>) {
    fun status(now: Long = System.currentTimeMillis()) = when { highlight -> "Highlights"; now < starts -> "Upcoming"; now < ends -> "Live now"; else -> "Finished" }
}
fun imageUrl(path: String, large: Boolean = false): String = if (path.startsWith("https://")) path else if (path.isBlank()) "" else "https://image.tmdb.org/t/p/${if (large) "w1280" else "w500"}$path"
private fun title(json: JSONObject, type: String) = Title(
    json.optInt("id"), json.optString("media_type", type), json.optString("title", json.optString("name", "Untitled")),
    json.optString("overview"), json.optString("poster_path"), json.optString("backdrop_path"),
    json.optString("release_date", json.optString("first_air_date")).take(4), "%.1f".format(json.optDouble("vote_average", 0.0)),
    json.optJSONArray("seasons")?.let { a -> (0 until a.length()).map { a.getJSONObject(it).optInt("season_number") }.filter { it > 0 } } ?: emptyList()
)
class Repository(private val context: Context) {
    private val captionCache = linkedMapOf<String, EnglishCaptions>()
    private var superheroKeyword: Int? = null
    private val preferences = context.getSharedPreferences("mj-progress", Context.MODE_PRIVATE)
    private val secure = SecureSession(context)
    var authorization: String? = secure.read(); private set
    val connected get() = authorization != null
    val browsingAvailable get() = connected || CatalogueEndpoint.origin.isNotBlank()
    val localLiveAvailable get() = BuildConfig.LOCAL_LIVE_ENABLED && LocalLiveConfig.enabled
    suspend fun connect(password: String) {
        val auth = "Basic " + Base64.encodeToString("preview:$password".toByteArray(), Base64.NO_WRAP)
        request("/api/config", auth)
        secure.save(auth); authorization = auth
    }
    fun disconnect() { authorization = null; secure.clear() }
    private suspend fun request(path: String, auth: String? = authorization): JSONObject = withContext(Dispatchers.IO) {
        if(path.startsWith("/api/catalogue/") && CatalogueEndpoint.origin.isNotBlank()) {
            val result=publicText(CatalogueEndpoint.origin+path,4*1024*1024)
            return@withContext JSONObject(result)
        }
        check(auth != null) { "Connect to the trial backend first." }
        val connection = URL(BACKEND + path).openConnection() as HttpURLConnection
        connection.connectTimeout = 25_000; connection.readTimeout = 65_000; connection.instanceFollowRedirects = false
        connection.setRequestProperty("Authorization", auth)
        try {
            val code = connection.responseCode
            if (code == 401) error("Trial password was not accepted. Open Connect and try again.")
            if (code !in 200..299) throw SourceHttpException(code)
            val text = connection.inputStream.use { LiveSegmentDecoder.bounded(it,4*1024*1024).toString(Charsets.UTF_8) }
            if (text.trimStart().startsWith("[")) JSONObject().put("results", JSONArray(text)) else JSONObject(text)
        } finally { connection.disconnect() }
    }
    private fun publicText(url: String,max: Int): String {
        val c=URL(url).openConnection() as HttpURLConnection
        c.connectTimeout=8000; c.readTimeout=15000; c.instanceFollowRedirects=false
        try {
            if(c.responseCode !in 200..299) throw SourceHttpException(c.responseCode)
            return c.inputStream.use { LiveSegmentDecoder.bounded(it,max).toString(Charsets.UTF_8) }
        } finally { c.disconnect() }
    }
    suspend fun browse(type: String = "all", query: String = ""): List<Title> {
        val path = if (query.isNotBlank()) "search/multi?query=" + java.net.URLEncoder.encode(query, "UTF-8") else if (type == "all") "trending/movie/week" else "$type/popular"
        val json = request("/api/catalogue/$path")
        val results = json.getJSONArray("results")
        return (0 until results.length()).map { results.getJSONObject(it) }.filter { it.optString("media_type") != "person" }.map { title(it, if (type == "all") "movie" else type) }
    }
    suspend fun details(item: Title): Title = title(request("/api/catalogue/${item.key}"), item.type)
    suspend fun people(query: String, page: Int): PersonPage {
        val j = request("/api/catalogue/search/person?query=" + java.net.URLEncoder.encode(query, "UTF-8") + "&page=$page")
        val a = j.getJSONArray("results")
        return PersonPage((0 until a.length()).map { a.getJSONObject(it) }.filter { it.optString("known_for_department") == "Acting" }.map { Person(it.getInt("id"), it.optString("name"), it.optString("profile_path")) }, page < minOf(500, j.optInt("total_pages", 1)))
    }
    suspend fun filmography(person: Person): List<Title> {
        val a = request("/api/catalogue/person/${person.id}/combined_credits").getJSONArray("cast")
        return (0 until a.length()).map { a.getJSONObject(it) }.filter { it.optString("media_type") in listOf("movie", "tv") }.sortedByDescending { it.optDouble("popularity") }.map { title(it, it.optString("media_type")) }.distinctBy { it.key }
    }
    suspend fun cast(item: Title): List<Person> {
        val a = request("/api/catalogue/${item.key}/credits").getJSONArray("cast")
        return (0 until minOf(a.length(), 12)).map { a.getJSONObject(it) }.map { Person(it.getInt("id"), it.optString("name"), it.optString("profile_path")) }
    }
    suspend fun trailer(item: Title): String? {
        val a = request("/api/catalogue/${item.key}/videos").getJSONArray("results")
        val videos = (0 until a.length()).map { a.getJSONObject(it) }.filter { it.optString("site") == "YouTube" && it.optString("key").matches(Regex("[-\\w]{11}")) && it.optString("type") in listOf("Trailer", "Teaser") }
        return videos.sortedWith(compareByDescending<JSONObject> { it.optBoolean("official") }.thenByDescending { it.optString("type") == "Trailer" }).firstOrNull()?.optString("key")
    }
    suspend fun nextEpisode(item: Title, season: Int, episode: Int): NextEpisode? {
        val today = java.time.LocalDate.now().toString()
        episodes(item, season).firstOrNull { it.number > episode && (it.airDate.isBlank() || it.airDate <= today) }?.let { return NextEpisode(season, it.number, it.title) }
        val seasons = details(item).seasons.sorted().filter { it > season }
        for (s in seasons) episodes(item, s).firstOrNull { it.airDate.isBlank() || it.airDate <= today }?.let { return NextEpisode(s, it.number, it.title) }
        return null
    }
    suspend fun intro(item: Title, season: Int, episode: Int, duration: Long): Pair<Long,Long>? = withContext(Dispatchers.IO) {
        if (duration < 300000 || item.type != "tv") return@withContext null
        val c=URL("https://api.theintrodb.org/v3/media?tmdb_id=${item.id}&season=$season&episode=$episode&duration_ms=$duration").openConnection() as HttpURLConnection
        c.connectTimeout=5000;c.readTimeout=5000;c.instanceFollowRedirects=false
        try {
            if(c.responseCode!=200)return@withContext null
            val j=JSONObject(c.inputStream.bufferedReader().use { it.readText().also { text -> check(text.length<=131072) } })
            if(j.optInt("tmdb_id")!=item.id || j.optString("type")!="tv" || j.optInt("season")!=season || j.optInt("episode")!=episode)return@withContext null
            if(j.has("video_duration_ms") && kotlin.math.abs(j.optLong("video_duration_ms")-duration)>20000)return@withContext null
            val intro=j.optJSONArray("intro")?.optJSONObject(0) ?: return@withContext null
            val start=intro.optLong("start_ms",-1);val end=intro.optLong("end_ms",-1)
            if(start<0 || end-start !in 5000..240000 || start>minOf(900000.0,duration*.35) || end>duration*.5) null else start to end
        } catch(e: CancellationException){throw e} catch(_:Exception){null} finally {c.disconnect()}
    }
    suspend fun credits(item: Title, season: Int, episode: Int, duration: Long): CreditsMarker? = withContext(Dispatchers.IO) {
        if (duration < 300000 || item.type != "tv") return@withContext null
        val c = URL("https://api.theintrodb.org/v3/media?tmdb_id=${item.id}&season=$season&episode=$episode&duration_ms=$duration").openConnection() as HttpURLConnection
        c.connectTimeout = 5000; c.readTimeout = 5000; c.instanceFollowRedirects = false
        try {
            if (c.responseCode != 200) return@withContext null
            val j = JSONObject(c.inputStream.bufferedReader().use { it.readText() })
            if (j.optInt("tmdb_id") != item.id || j.optString("type") != "tv" || j.optInt("season") != season || j.optInt("episode") != episode) return@withContext null
            val a = j.optJSONArray("credits") ?: return@withContext null
            val post = j.optJSONObject("post_credits")
            (0 until a.length()).map { a.getJSONObject(it) }.sortedBy { it.optLong("start_ms") }.firstNotNullOfOrNull { segment ->
                val start = segment.optLong("start_ms", -1); val end = segment.optLong("end_ms", -1)
                val finalEnd = post?.optLong("end_ms", -1) ?: end
                if (start < duration * .75 || start >= duration - 5000 || duration - start > 240000 || end >= 0 && (end <= start || end > duration + 20000) || finalEnd >= 0 && kotlin.math.abs(finalEnd - duration) > 20000) null
                else CreditsMarker(start, post != null || a.length() > 1)
            }
        } catch (_: Exception) { null } finally { c.disconnect() }
    }
    fun englishEnabled() = preferences.getBoolean("english-enabled", false)
    fun cineSrcEnabled() = preferences.getBoolean("cinesrc-player", false)
    fun setCineSrcEnabled(value: Boolean) {
        preferences.edit().putBoolean("cinesrc-player", value).apply()
    }
    fun autoplayEnabled() = preferences.getBoolean("autoplay-enabled", true)
    fun setAutoplayEnabled(value: Boolean) { preferences.edit().putBoolean("autoplay-enabled", value).apply() }
    fun preferredHeight() = preferences.getInt("preferred-height", Int.MAX_VALUE)
    fun setPreferredHeight(value: Int) { preferences.edit().putInt("preferred-height", value).apply() }
    fun setEnglishEnabled(value: Boolean) { preferences.edit().putBoolean("english-enabled", value).apply() }
    fun subtitleOffset(item: Title, season: Int, episode: Int) = preferences.getFloat("sub-offset-provider-v1/${item.key}/$season/$episode", 0f)
    fun setSubtitleOffset(item: Title, season: Int, episode: Int, value: Float) { preferences.edit().putFloat("sub-offset-provider-v1/${item.key}/$season/$episode", value.coerceIn(-120f, 120f)).apply() }
    suspend fun english(item: Title, season: Int, episode: Int, duration: Long, alternate: Boolean = false): EnglishCaptions {
        val key = "provider-v1/${item.key}/$season/$episode/${duration / 1000}"
        if (!alternate) synchronized(captionCache) { captionCache[key] }?.let { return it }
        val file = java.io.File(context.cacheDir, "english-provider-v1-${item.type}-${item.id}-$season-$episode-${duration / 1000}.json")
        fun decode(j: JSONObject): EnglishCaptions {
            val a = j.getJSONArray("cues"); require(a.length() <= 20000)
            val result = EnglishCaptions((0 until a.length()).map { a.getJSONObject(it) }.map { Caption(it.optDouble("start"), it.optDouble("end"), it.optString("text").take(1500)) }.filter { it.start.isFinite() && it.end.isFinite() && it.start >= 0 && it.end > it.start && it.text.isNotBlank() }.sortedBy { it.start }, j.optString("release", "English"))
            check(result.cues.isNotEmpty()) { "No readable English captions found." }; return result
        }
        if (!alternate) {
            val saved = withContext(Dispatchers.IO) { runCatching { check(file.length() <= 4000000 && System.currentTimeMillis() - file.lastModified() < 604800000); decode(JSONObject(file.readText())) }.getOrNull() }
            if (saved != null) { synchronized(captionCache) { captionCache[key] = saved }; return saved }
        }
        val local = kotlinx.coroutines.runInterruptible(Dispatchers.IO) { ProviderSubtitles.english(item, season, episode, alternate) }
        val j = JSONObject().put("release",local.release).put("cues",JSONArray(local.cues.map { JSONObject().put("start",it.start).put("end",it.end).put("text",it.text) }))
        val captions = decode(j)
        withContext(Dispatchers.IO) {
            runCatching {
                file.writeText(j.toString())
                context.cacheDir.listFiles()?.filter { it.name.startsWith("english-") && it.extension == "json" }?.sortedByDescending { it.lastModified() }?.drop(6)?.forEach { it.delete() }
            }
        }
        synchronized(captionCache) { captionCache[key] = captions; while (captionCache.size > 6) captionCache.remove(captionCache.keys.first()) }
        return captions
    }
    suspend fun guide(channel: Int): List<Programme> = withContext(Dispatchers.IO) {
        val file = java.io.File(context.cacheDir, "guide-$channel.json")
        fun parse(text: String): List<Programme> {
            require(text.length <= 1000000)
            val j = JSONObject(text); require(j.optInt("version") == 1 && j.optInt("channel") == channel)
            val a = j.getJSONArray("programmes"); require(a.length() <= 1000)
            return (0 until a.length()).map { a.getJSONObject(it) }.map { Programme(it.optLong("start"), it.optLong("end"), it.optString("title").take(1000)) }.filter { it.start > 0 && it.end > it.start && it.end > System.currentTimeMillis() && it.title.isNotBlank() }.sortedBy { it.start }
        }
        val saved = runCatching { check(file.length()<=1000000); parse(file.readText()) }.getOrDefault(emptyList())
        if (saved.isNotEmpty() && System.currentTimeMillis() - file.lastModified() < 900000) return@withContext saved
        val connection = URL("https://james00bong.github.io/mjplay-epg/guides/$channel.json").openConnection() as HttpURLConnection
        connection.connectTimeout = 8000; connection.readTimeout = 10000; connection.instanceFollowRedirects = false
        try {
            check(connection.responseCode == 200) { "Schedule unavailable" }
            val text = connection.inputStream.use { LiveSegmentDecoder.bounded(it,1000000).toString(Charsets.UTF_8) }
            val programmes = parse(text); check(programmes.isNotEmpty()) { "Schedule is out of date" }
            file.writeText(text); programmes
        } catch (e: Exception) { if (saved.isNotEmpty()) saved else throw e }
        finally { connection.disconnect() }
    }
    suspend fun sports(category: String): List<SportsEvent> = withContext(Dispatchers.IO) {
        val url=PublicSportsFeed.url(category)
        val file=java.io.File(context.cacheDir,"sports-$category.json")
        val saved=runCatching { check(file.length()<=8*1024*1024); PublicSportsFeed.parse(file.readText()) }.getOrNull()
        if(saved!=null && System.currentTimeMillis()-file.lastModified() in 0..120000) return@withContext saved
        try {
            val text=publicText(url,8*1024*1024); val events=PublicSportsFeed.parse(text)
            runCatching { file.writeText(text) }; return@withContext events
        } catch(e: CancellationException) { throw e } catch(e: Exception) {
            if(saved!=null && System.currentTimeMillis()-file.lastModified() in 0..21600000) return@withContext saved
            throw e
        }
    }
    private fun legacySportsParse(j: JSONObject): List<SportsEvent> {
        val a = j.getJSONArray("results")
        fun team(j: JSONObject?) = SportsTeam(j?.optString("name") ?: "", j?.optString("logo") ?: "")
        return (0 until a.length()).mapNotNull { index ->
            val j = a.optJSONObject(index) ?: return@mapNotNull null
            val servers = j.optJSONArray("servers") ?: JSONArray()
            val sources = (0 until servers.length()).mapNotNull { n ->
                val s = servers.optJSONObject(n) ?: return@mapNotNull null
                SportsSource(s.optString("provider"), s.optInt("serverNumber", n + 1), s.optString("kind"), s.optInt("number"), s.optString("key"))
            }
            SportsEvent(j.optString("id"), j.optString("title"), j.optLong("starts"), j.optLong("ends"), j.optBoolean("highlight"), j.optString("league"), team(j.optJSONObject("home")), team(j.optJSONObject("away")), j.optString("image"), sources)
        }.filter { it.id.isNotBlank() && it.starts > 0 && it.ends > it.starts }
    }
    suspend fun catalogueRow(type: String, feed: String): List<Title> {
        val path = if (feed == "trending") "trending/$type/week" else "$type/$feed"
        val a = request("/api/catalogue/$path").getJSONArray("results")
        return (0 until a.length()).map { title(a.getJSONObject(it), type) }.filter { it.poster.isNotBlank() }
    }
    suspend fun homeRows(type: String = "all"): List<Pair<String, List<Title>>> = supervisorScope {
        val feeds = buildList {
            if (type in listOf("movie", "tv")) {
                add(Triple("Trending This Week", type, "trending"))
                add(Triple("Popular Right Now", type, "popular"))
                add(Triple("Critically Acclaimed", type, "top_rated"))
                if (type == "movie") add(Triple("Now Playing", type, "now_playing"))
            } else {
            if (type != "tv") { add(Triple("Trending Now", "movie", "trending")); add(Triple("Popular Movies", "movie", "popular")) }
            if (type != "movie") { add(Triple("Popular TV Shows", "tv", "popular")) }
            if (type != "tv") add(Triple("Top Rated Movies", "movie", "top_rated"))
            if (type != "movie") add(Triple("Top Rated Series", "tv", "top_rated"))
            if (type != "tv") add(Triple("Now Playing", "movie", "now_playing"))
            if (type == "tv") add(0, Triple("Trending Now", "tv", "trending"))
            }
        }
        feeds.map { (label, kind, feed) -> async {
            try { label to catalogueRow(kind, feed) }
            catch (e: CancellationException) { throw e }
            catch (_: Exception) { label to emptyList<Title>() }
        } }.map { it.await() }.filter { it.second.isNotEmpty() }
    }
    suspend fun pickedForYou(fallback: List<Title>): List<Title> = supervisorScope {
        val known = knownTitles()
        val seeds = known.filter { taste(it) == "like" || progress(it) != null }.takeLast(4)
        val suggestions = seeds.map { seed -> async {
            try { related(seed) } catch (e: CancellationException) { throw e } catch (_: Exception) { emptyList<Title>() }
        } }.map { it.await() }
        // Interleave candidates so a single seed cannot occupy the entire row.
        val ranked = (0 until (suggestions.maxOfOrNull { it.size } ?: 0)).flatMap { n -> suggestions.mapNotNull { it.getOrNull(n) } }
        val candidates = (ranked + fallback).distinctBy { it.key }.filter { taste(it) != "dislike" && it.poster.isNotBlank() && progress(it) == null }
        val movies = candidates.filter { it.type == "movie" }; val shows = candidates.filter { it.type == "tv" }
        (0 until maxOf(movies.size, shows.size)).flatMap { n -> listOfNotNull(movies.getOrNull(n), shows.getOrNull(n)) }.take(20)
    }
    suspend fun related(item: Title): List<Title> {
        val a = request("/api/catalogue/${item.key}/recommendations").getJSONArray("results")
        return (0 until a.length()).map { title(a.getJSONObject(it), item.type) }
    }
    suspend fun collection(item: Title): List<Title> {
        if(item.type != "movie") return emptyList()
        val id=request("/api/catalogue/${item.key}").optJSONObject("belongs_to_collection")?.optInt("id") ?: return emptyList()
        if(id<=0)return emptyList()
        val a=request("/api/catalogue/collection/$id").getJSONArray("parts")
        val today=java.time.LocalDate.now().toString()
        return (0 until a.length()).map { a.getJSONObject(it) }
            .filter { it.optString("release_date").isNotBlank() && it.optString("release_date")<=today }
            .sortedBy { it.optString("release_date") }.map { title(it,"movie") }.distinctBy { it.key }
    }
    suspend fun discover(type: String, genre: Int): List<Title> {
        val constraint = if (genre == -1) {
            val keyword = superheroKeyword ?: run {
                val matches = request("/api/catalogue/search/keyword?query=superhero").getJSONArray("results")
                (0 until matches.length()).map { matches.getJSONObject(it) }.firstOrNull { it.optString("name").equals("superhero", true) }?.getInt("id")?.also { superheroKeyword = it }
                    ?: return emptyList()
            }
            "with_keywords=$keyword"
        } else "with_genres=$genre"
        val a = request("/api/catalogue/discover/$type?$constraint&sort_by=popularity.desc&include_adult=false").getJSONArray("results")
        return (0 until a.length()).map { title(a.getJSONObject(it), type) }
    }
    fun isFavourite(channel: Channel) = preferences.getBoolean("channel/${channel.number}", false)
    fun toggleFavourite(channel: Channel): Boolean = (!isFavourite(channel)).also { preferences.edit().putBoolean("channel/${channel.number}", it).apply() }
    suspend fun episodes(item: Title, season: Int): List<Episode> {
        val a = request("/api/catalogue/${item.key}/season/$season").getJSONArray("episodes")
        return (0 until a.length()).map { a.getJSONObject(it) }.map { Episode(it.getInt("episode_number"), it.optString("name"), it.optString("still_path"), it.optString("overview"), it.optString("air_date").takeUnless { date -> date == "null" } ?: "") }
    }
    suspend fun stream(item: Title, season: Int, episode: Int, revalidate: Boolean = false): Stream {
        return kotlinx.coroutines.runInterruptible(Dispatchers.IO) { LocalVodResolver.resolve(item, season, episode, revalidate) }
    }
    suspend fun live(channel: Channel): Stream {
        if (BuildConfig.LOCAL_LIVE_ENABLED && LocalLiveConfig.enabled) {
            require(channel.number in 1..999999)
            // Resolve on the player loading thread, so closing the player cancels loading.
            // Relay remains available via the remote operational switch, never a hidden retry loop.
            return Stream("mjlive://channel/${channel.number}/entry.m3u8", live = true, hls = true, localChannel = channel.number)
        }
        return validatedStream(playbackRequest("/api/live/${channel.number}"), true)
    }
    private suspend fun playbackRequest(path: String): JSONObject {
        try { return request(path) }
        catch (e: CancellationException) { throw e }
        catch (e: SourceHttpException) {
            if (e.status !in listOf(502, 503, 504)) throw e
            delay(1200)
            return request(path)
        }
    }
    private fun validatedStream(json: JSONObject, live: Boolean): Stream {
        val uri = URI(BACKEND).resolve(json.getString("url"))
        check(uri.scheme == "https" && uri.host == URI(BACKEND).host && uri.userInfo == null) { "This source needs a different playback adapter. It is not supported in this Android preview yet." }
        return Stream(uri.toString(), live, hls = json.optString("streamType") == "hls" || uri.path.endsWith(".m3u8"))
    }
    fun channels(): List<Channel> {
        val a = JSONArray(context.assets.open("channels.json").bufferedReader().use { it.readText() })
        return (0 until a.length()).map { a.getJSONObject(it) }.map { j -> Channel(j.getInt("number"), j.getString("title"), j.optString("logo"), j.getJSONArray("categories").let { c -> (0 until c.length()).map { c.getString(it) } }) }
    }
    fun progress(item: Title): SavedProgress? = runCatching {
        val j = JSONObject(preferences.getString(item.key, null) ?: return null)
        SavedProgress(j.getLong("position"), j.getLong("duration"), j.optInt("season", 1), j.optInt("episode", 1))
    }.getOrNull()
    fun save(item: Title, position: Long, duration: Long, season: Int, episode: Int) {
        if (position < 0 || duration <= 0) return
        rememberTitle(item)
        preferences.edit().putString(item.key, JSONObject().put("position", position.coerceAtMost(duration)).put("duration", duration).put("season", season).put("episode", episode).toString()).putLong("updated/${item.key}", System.currentTimeMillis()).apply()
    }
    fun queueNext(item: Title, next: NextEpisode) {
        rememberTitle(item)
        preferences.edit().putString(item.key, JSONObject().put("position",0).put("duration",0).put("season",next.season).put("episode",next.episode).toString()).putLong("updated/${item.key}",System.currentTimeMillis()).apply()
    }
    fun isSaved(item: Title) = preferences.getBoolean("list/${item.key}", false)
    fun toggleSaved(item: Title): Boolean = (!isSaved(item)).also { rememberTitle(item); preferences.edit().putBoolean("list/${item.key}", it).apply() }
    private fun rememberTitle(item: Title) {
        if (preferences.contains("title/${item.key}")) return
        val json = JSONObject().put("id", item.id).put("media_type", item.type).put("title", item.title).put("overview", item.overview)
            .put("poster_path", item.poster).put("backdrop_path", item.backdrop).put("release_date", item.year).put("vote_average", item.rating.toDoubleOrNull() ?: 0)
        preferences.edit().putString("title/${item.key}", json.toString()).apply()
    }
    fun knownTitles(): List<Title> = preferences.all.filterKeys { it.startsWith("title/") }.values.mapNotNull { runCatching { title(JSONObject(it as String), "movie") }.getOrNull() }
    fun continueWatching(): List<Title> = knownTitles().filter { item -> progress(item)?.let { (item.type == "tv" && it.duration == 0L) || (it.position > 0 && it.duration - it.position > 15_000) } == true }.sortedByDescending { preferences.getLong("updated/${it.key}",0) }
    fun myList(): List<Title> = knownTitles().filter(::isSaved)
    fun taste(item: Title) = preferences.getString("taste/${item.key}", "") ?: ""
    fun rate(item: Title, value: String): String = (if (taste(item) == value) "" else value).also { rememberTitle(item); preferences.edit().putString("taste/${item.key}", it).apply() }
    fun removeProgress(item: Title) { preferences.edit().remove(item.key).apply() }
}



