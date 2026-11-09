package com.mjentertainment.mjplay.android

import org.json.JSONObject
import java.io.IOException
import java.net.URI
import java.net.URLEncoder
import java.util.Base64
import java.util.concurrent.atomic.AtomicLong

internal object LocalLiveConfig {
    @Volatile var enabled: Boolean = true
    @Volatile var preparedEnabled: Boolean = true
    const val DEFAULT_WATCH_HOST = "thedaddy.li"
    val watchHosts = setOf(DEFAULT_WATCH_HOST, "thedaddy.pk", "dlive.sx")
    @Volatile var watchHost: String = DEFAULT_WATCH_HOST
    const val DEFAULT = "{\"allowed_hosts\":[\"edge.wedd48c.top\",\"edge.cowedd4855ws.sbs\"]}"
    @Volatile var hosts: Set<String> = parse(DEFAULT)
    fun parse(raw: String): Set<String> {
        require(raw.length <= 4096)
        val a=JSONObject(raw).getJSONArray("allowed_hosts"); require(a.length() in 1..16)
        return (0 until a.length()).map { a.getString(it).also { h -> require(h.matches(Regex("edge\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.(?:sbs|top)"))) } }.toSet()
    }
}

/** One player session. Only approved provider hosts can enter this transport. */
internal class LocalLiveSession(
    val channel: Int,
    private val hosts: Set<String>,
    private val fetch: (URI, Int) -> ByteArray,
    private val now: () -> Long = { System.nanoTime()/1_000_000 },
    private val playlistResolver: LivePlaylistResolver? = null
) {
    init { require(channel in 1..999999); require(hosts.isNotEmpty()) }
    private var edge: URI?=null
    private var token=""; private var tokenExpires=0L
    val sourceBytes=AtomicLong()
    val transformedSegments=AtomicLong()
    val tokenRefreshes=AtomicLong()
    private val player=URI("https://dembed.st/premiumtv/daddy.php?id=$channel")
    private fun read(uri: URI, max: Int): ByteArray = fetch(uri,max).also { if(it.size>max) throw IOException("Live response too large"); sourceBytes.addAndGet(it.size.toLong()) }
    fun allowed(uri: URI): Boolean {
        if(uri.scheme != "https" || uri.port != -1 || uri.rawUserInfo != null || uri.rawFragment != null) return false
        val host=uri.host ?: return false
        return host in hosts && uri.rawPath.startsWith("/premium$channel/") || host in setOf("p16-common-sign.tiktokcdn-us.com","p19-common-sign.tiktokcdn-us.com")
    }
    private fun checked(uri: URI): URI { if(!allowed(uri)) throw IOException("Unexpected live source host"); return uri }
    private fun ref(uri: URI, raw: Boolean = false): String {
        checked(uri)
        return "mjlive://channel/$channel/media/"+Base64.getUrlEncoder().withoutPadding().encodeToString(uri.toASCIIString().toByteArray())+if(raw) "/key.bin" else if(uri.path.endsWith(".m3u8")) "/index.m3u8" else "/segment.ts"
    }
    @Synchronized private fun entry(): URI {
        val html=read(player,1024*1024).toString(Charsets.UTF_8)
        val encoded=Regex("const\\s+SRC\\s*=\\s*(\"(?:[^\"\\\\]|\\\\.)*\")").find(html)?.groupValues?.get(1) ?: throw IOException("Live source changed")
        val source=URI(JSONObject("{\"url\":$encoded}").getString("url"))
        if(source.host !in hosts || !source.rawPath.startsWith("/premium$channel/")) throw IOException("Unexpected live source")
        checked(source)
        val origin=URI("https://${source.host}")
        if(edge != origin) { edge=origin; token=""; tokenExpires=0 }
        return source
    }
    @Synchronized private fun auth(): String {
        if(token.isNotEmpty() && tokenExpires>now()) return token
        val origin=edge ?: throw IOException("Missing live session")
        val data=JSONObject(read(origin.resolve("/api/playlist-token?slug=premium$channel"),65536).toString(Charsets.UTF_8))
        val value=data.getString("token"); if(value.isBlank() || value.length>8192) throw IOException("Live handshake unavailable")
        token=value; tokenExpires=now()+30_000; tokenRefreshes.incrementAndGet()
        return value
    }
    fun load(local: URI): ByteArray {
        if(local.scheme != "mjlive" || local.host != "channel" || local.rawQuery != null || local.rawFragment != null || local.port != -1 || local.rawUserInfo != null) throw IOException("Invalid local live reference")
        val source=if(local.path == "/$channel/entry.m3u8") entry() else {
            val match=Regex("/$channel/media/([A-Za-z0-9_-]{1,22000})/(?:index\\.m3u8|segment\\.ts|key\\.bin)").matchEntire(local.path) ?: throw IOException("Invalid local live reference")
            if(edge == null) throw IOException("Missing live session")
            checked(URI(String(Base64.getUrlDecoder().decode(match.groupValues[1]),Charsets.UTF_8)))
        }
        if(local.path.endsWith("/key.bin")) return read(source,65536)
        if(!source.path.endsWith(".m3u8")) return LiveSegmentDecoder.decode(read(source,LiveSegmentDecoder.MAX_INPUT)).also { transformedSegments.incrementAndGet() }
        fun playlist(): ByteArray {
            val query=source.rawQuery?.split('&')?.filterNot { it.substringBefore('=') in setOf("t","_") }?.filter { it.isNotBlank() }.orEmpty()
            val uri=URI(source.toASCIIString().substringBefore('?')+"?"+(query+listOf("t="+URLEncoder.encode(auth(),"UTF-8"),"_="+now())).joinToString("&"))
            return read(uri,2*1024*1024)
        }
        val bytes=try { playlist() } catch(e: LiveHttpException) {
            if(e.status !in listOf(401,403)) throw e
            synchronized(this) { token=""; tokenExpires=0 }
            playlist()
        }
        val text=bytes.toString(Charsets.UTF_8)
        playlistResolver?.let { return it.prepare(source, text, ::allowed, ::ref) }
        if(!text.startsWith("#EXTM3U")) throw IOException("Invalid live playlist")
        return text.lineSequence().map { line ->
            if(line.isBlank()) line else if(line.startsWith('#')) Regex("URI=\"([^\"]+)\"").replace(line) { m -> "URI=\"${ref(resolveLiveReference(source,m.groupValues[1]),line.startsWith("#EXT-X-KEY:") || line.startsWith("#EXT-X-SESSION-KEY:"))}\"" }
            else ref(resolveLiveReference(source,line.trim()))
        }.joinToString("\n").toByteArray(Charsets.UTF_8)
    }
}

internal class LiveHttpException(val status: Int): IOException("Live source HTTP $status")
