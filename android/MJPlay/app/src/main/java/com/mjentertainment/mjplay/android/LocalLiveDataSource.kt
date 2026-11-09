package com.mjentertainment.mjplay.android

import android.net.Uri
import androidx.media3.common.C
import androidx.media3.datasource.BaseDataSource
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DataSpec
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.util.concurrent.atomic.AtomicBoolean

/** Experimental transport: player loading threads perform network/unwrap work, never Compose. */
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
internal class LocalLiveDataSource(private val channel: Int, private val hosts: Set<String>, private val shared: Shared): BaseDataSource(true) {
    internal class Shared {
        val cookies=java.net.CookieManager(null,java.net.CookiePolicy.ACCEPT_ORIGINAL_SERVER)
        // Each DataSource has cancellable IO; session/token state is shared by the player's loaders.
        var session: LocalLiveSession?=null
    }
    class Factory(private val channel: Int, private val hosts: Set<String>): DataSource.Factory {
        private val shared=Shared()
        fun proofStats(): Triple<Long,Long,Long> = synchronized(shared) { shared.session?.let { Triple(it.sourceBytes.get(),it.transformedSegments.get(),it.tokenRefreshes.get()) } ?: Triple(0,0,0) }
        override fun createDataSource(): DataSource = LocalLiveDataSource(channel,hosts,shared)
    }
    @Volatile private var connection: HttpURLConnection?=null
    private val closed=AtomicBoolean(false)
    private var data=ByteArray(0); private var cursor=0; private var end=0
    private var current: Uri?=null; private var spec: DataSpec?=null; private var started=false
    // The currently active loader supplies IO; sessions don't retain a closed DataSource.
    private fun fetch(uri: URI, max: Int): ByteArray {
        if(closed.get() || Thread.currentThread().isInterrupted) throw IOException("Live request cancelled")
        val conn=uri.toURL().openConnection() as HttpURLConnection
        connection=conn
        try {
            if(closed.get()) throw IOException("Live request cancelled")
            conn.connectTimeout=15_000; conn.readTimeout=15_000; conn.instanceFollowRedirects=false
            conn.setRequestProperty("Referer","https://dembed.st/")
            conn.setRequestProperty("Origin","https://dembed.st")
            conn.setRequestProperty("Accept-Encoding","identity")
            shared.cookies.get(uri,emptyMap()).forEach { (name,values) -> conn.setRequestProperty(name,values.joinToString("; ")) }
            val status=conn.responseCode
            if(status !in 200..299) throw LiveHttpException(status)
            shared.cookies.put(uri,conn.headerFields.filterKeys { it != null })
            if(conn.contentLengthLong>max) throw IOException("Live response too large")
            return conn.inputStream.use { LiveSegmentDecoder.bounded(it,max) }
        } finally { connection=null; conn.disconnect() }
    }
    override fun open(dataSpec: DataSpec): Long {
        val began=android.os.SystemClock.elapsedRealtime()
        closed.set(false); current=dataSpec.uri; spec=dataSpec; transferInitializing(dataSpec)
        try {
            // Serialize session operations to keep per-player tokens coherent and avoid duplicate handshakes.
            synchronized(shared) {
                val session=shared.session ?: LocalLiveSession(channel,hosts,{ uri,max -> activeFetch.get()!!.invoke(uri,max) }).also { shared.session=it }
                activeFetch.set(::fetch)
                try { data=session.load(URI(dataSpec.uri.toString())) } finally { activeFetch.remove() }
            }
            if(closed.get()) throw IOException("Live request cancelled")
            if(dataSpec.position>data.size) throw IOException("Live byte offset out of range")
            cursor=dataSpec.position.toInt(); end=if(dataSpec.length==C.LENGTH_UNSET.toLong()) data.size else minOf(data.size.toLong(),dataSpec.position+dataSpec.length).toInt()
            started=true; transferStarted(dataSpec)
            val kind=if(dataSpec.uri.path?.endsWith(".m3u8")==true) "playlist" else "segment"
            if(BuildConfig.DEBUG) android.util.Log.d("MJLocalLive","loaded kind=$kind bytes=${data.size} elapsedMs=${android.os.SystemClock.elapsedRealtime()-began}")
            return (end-cursor).toLong()
        } catch(e: Exception) { data=ByteArray(0); current=null; throw if(e is IOException) e else IOException("Local live preparation failed",e) }
    }
    override fun read(buffer: ByteArray, offset: Int, length: Int): Int {
        if(length==0) return 0
        if(closed.get()) throw IOException("Live request cancelled")
        if(cursor>=end) return C.RESULT_END_OF_INPUT
        val n=minOf(length,end-cursor); data.copyInto(buffer,offset,cursor,cursor+n); cursor+=n; bytesTransferred(n); return n
    }
    override fun getUri(): Uri? = current
    override fun close() {
        closed.set(true); connection?.disconnect(); data=ByteArray(0); current=null; spec=null
        if(started) { started=false; transferEnded() }
    }
    companion object { private val activeFetch=ThreadLocal<((URI,Int)->ByteArray)>() }
}
