package com.mjentertainment.mjplay.android

import android.util.Base64
import org.json.JSONObject
import java.net.URI
import java.net.HttpURLConnection
import java.util.concurrent.CancellationException
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/** Device-side equivalent of the existing title resolver. Never forwards app credentials. */
internal object LocalVodResolver {
    private const val ORIGIN = "https://vidrock.to"
    @Volatile private var decoder: ByteArray? = null
    @Volatile private var expires = 0L
    private fun validatePlaylist(url: String, revalidate: Boolean) {
        val c=URI(url).toURL().openConnection() as HttpURLConnection
        c.connectTimeout=8000;c.readTimeout=8000;c.instanceFollowRedirects=false
        c.setRequestProperty("Origin",ORIGIN);c.setRequestProperty("Referer","$ORIGIN/")
        if (revalidate) c.setRequestProperty("Cache-Control", "no-cache")
        try {
            val status=c.responseCode
            if(!VodPlaylistPolicy.successful(status)) throw SourceHttpException(status)
            val text=c.inputStream.use { input ->
                val out=java.io.ByteArrayOutputStream();val buffer=ByteArray(4096)
                while(true){if(Thread.currentThread().isInterrupted)throw CancellationException();val n=input.read(buffer);if(n<0)break;check(out.size()+n<=131072);out.write(buffer,0,n)}
                out.toString("UTF-8")
            }
            check(VodPlaylistPolicy.isPlaylist(text)) { "Source did not return an HLS playlist" }
        } finally { c.disconnect() }
    }
    private fun read(url: String, referer: String, max: Int, revalidate: Boolean = false): String {
        check(!Thread.currentThread().isInterrupted) { "Playback cancelled" }
        val u=URI(url); require(u.scheme=="https" && u.host=="vidrock.to" && u.userInfo==null && u.port==-1)
        val connection=u.toURL().openConnection() as HttpURLConnection
        connection.connectTimeout=12000; connection.readTimeout=12000; connection.instanceFollowRedirects=false
        connection.setRequestProperty("Referer",referer); connection.setRequestProperty("Origin",ORIGIN)
        if (revalidate) connection.setRequestProperty("Cache-Control", "no-cache")
        try {
            if(connection.responseCode!=200) throw SourceHttpException(connection.responseCode)
            return connection.inputStream.use { input ->
                val out=java.io.ByteArrayOutputStream(); val buffer=ByteArray(8192)
                while(true) { if(Thread.currentThread().isInterrupted)throw CancellationException(); val n=input.read(buffer);if(n<0)break;require(out.size()+n<=max);out.write(buffer,0,n) }
                out.toString("UTF-8")
            }
        } finally { connection.disconnect() }
    }
    @Synchronized private fun key(): ByteArray {
        val now=android.os.SystemClock.elapsedRealtime()
        decoder?.let { if(now<expires)return it }
        val html=read("$ORIGIN/","$ORIGIN/",1048576)
        val script=Regex("<script[^>]+src=[\"']([^\"']+)[\"']").findAll(html).map { URI(ORIGIN).resolve(it.groupValues[1]) }.firstOrNull { it.host=="vidrock.to" && it.path.matches(Regex("/assets/index-[\\w-]+\\.js")) } ?: error("Source format changed")
        val js=read(script.toString(),"$ORIGIN/",5242880)
        val hex=Regex("TQ=[\"']([a-f0-9]{32,64})[\"']").find(js)?.groupValues?.get(1) ?: error("Source format changed")
        require(hex.length in listOf(32,48,64))
        return hex.chunked(2).map { it.toInt(16).toByte() }.toByteArray().also { decoder=it;expires=now+300000 }
    }
    fun resolve(item: Title, season: Int, episode: Int, revalidate: Boolean = false): Stream {
        require(item.type in listOf("movie","tv") && item.id>0) { "This title has no valid catalogue identity." }
        require(season in 1..9999 && episode in 1..9999) { "Choose a valid episode." }
        val path=item.key+if(item.type=="tv")"/$season/$episode" else ""
        val key=key();val data=JSONObject(read("$ORIGIN/api/$path","$ORIGIN/$path",1048576,revalidate))
        val candidates=VodCandidatePolicy.candidates(data)
        check(candidates.isNotEmpty()) { "No compatible English source is available for this title right now." }
        val usable=mutableListOf<String>()
        val failures=mutableListOf<Pair<String,Exception>>()
        for(candidate in candidates) {
        var stage="decode"
        try {
        val encoded=candidate.encoded
        val bytes=Base64.decode(encoded,Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING);require(bytes.size>=29)
        val cipher=Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE,SecretKeySpec(key,"AES"),GCMParameterSpec(128,bytes.copyOfRange(0,12)))
        val url=String(cipher.doFinal(bytes.copyOfRange(12,bytes.size)),Charsets.UTF_8)
        stage="destination"
        val u=URI(url)
        require(u.scheme=="https" && u.port==-1 && u.userInfo==null && u.fragment==null)
        // Trust only media returned by this fixed resolver, never a user-submitted URL.
        // Hosts rotate, so validate public DNS addresses instead of an APK hostname list.
        require(url.length<=16384 && u.host?.matches(Regex("(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,63}"))==true)
        val addresses=java.net.InetAddress.getAllByName(u.host)
        require(addresses.isNotEmpty() && addresses.all { address ->
            !address.isAnyLocalAddress && !address.isLoopbackAddress && !address.isLinkLocalAddress && !address.isSiteLocalAddress && !address.isMulticastAddress &&
                (address.address.size!=4 || (address.address[0].toInt() and 255)!=100 || (address.address[1].toInt() and 255) !in 64..127)
        }) { "Source returned an invalid media destination" }
        // Check extensionless endpoints and revalidate playlists when switching or retrying.
        if(revalidate || !u.path.endsWith(".m3u8")) {
            stage="playlist"
            try { validatePlaylist(url, revalidate) } catch(e: java.io.IOException) {
                // A single retry for a transient network failure; content and destination checks remain mandatory.
                if(Thread.currentThread().isInterrupted) throw CancellationException()
                validatePlaylist(url, revalidate)
            }
        }
        usable.add(url)
        } catch(e: CancellationException) { throw e } catch (e: Exception) { failures.add(stage to e); android.util.Log.w("MJLocalVod", "candidate=${candidate.name} stage=$stage error=${e.javaClass.simpleName}" ) }
        }
        check(usable.isNotEmpty()) {
            when {
                failures.any { it.second is java.net.SocketTimeoutException || it.second is java.net.UnknownHostException } -> "The video source did not respond. Please retry."
                failures.any { it.first == "playlist" } -> "The video source could not provide a usable playlist. Please retry."
                failures.any { it.first == "decode" } -> "The source response could not be read. Please retry for a fresh connection."
                else -> "The source returned an invalid playback address. Try again later."
            }
        }
        return Stream(usable.first(),hls=true,localVod=true,alternatives=usable.distinct().drop(1))
    }
}


