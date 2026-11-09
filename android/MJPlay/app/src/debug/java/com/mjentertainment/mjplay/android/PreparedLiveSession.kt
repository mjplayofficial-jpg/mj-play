package com.mjentertainment.mjplay.android

import android.net.Uri
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.View
import android.webkit.*
import androidx.media3.common.*
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.*
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import androidx.webkit.JavaScriptReplyProxy
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.util.Base64
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Preview-only fresh on-device session preparation; Media3 owns all media delivery. */
@androidx.annotation.OptIn(UnstableApi::class)
internal class PreparedLiveSession(context: Context, private val channel: Int) : PreparedLiveTransport {
    private val web = WebView(context)
    private val watchHost = LocalLiveConfig.watchHost
    private val edgeHosts = LocalLiveConfig.hosts
    @Volatile override var lastFailure: LivePlaybackFailure? = null
        private set
    private val main = Handler(Looper.getMainLooper())
    override val view: View get() = web
    override val factory = DataSource.Factory { ProofDataSource() }
    private val nonce = UUID.randomUUID().toString()
    private val ready = CountDownLatch(1)
    @Volatile private var dead = false
    private var pending: CountDownLatch? = null
    private var reply: String? = null
    private var frameReply: JavaScriptReplyProxy? = null
    private var manifests = 0
    private var segments = 0
    private var keyChanges = 0
    private var lastKeyHash: Int? = null
    private var lastSequence = -1L
    private val sequences = mutableSetOf<Long>()
    private val mediaHosts = setOf("p16-common-sign.tiktokcdn-us.com", "p19-common-sign.tiktokcdn-us.com")

    private fun mediaAllowed(uri: URI) = uri.scheme == "https" && uri.port == -1 && uri.rawUserInfo == null &&
        uri.rawFragment == null && uri.host in mediaHosts

    inner class Bridge {
        @JavascriptInterface fun result(proof: String, data: String) {
            if (proof != nonce || data.length > 3 * 1024 * 1024 || dead) return
            synchronized(this@PreparedLiveSession) {
                if (pending == null) return
                reply = data
                pending?.countDown()
            }
        }
    }

    init {
        WebView.setWebContentsDebuggingEnabled(true)
        web.settings.apply { javaScriptEnabled=true; domStorageEnabled=true; allowFileAccess=false; allowContentAccess=false; mixedContentMode=WebSettings.MIXED_CONTENT_NEVER_ALLOW }
        check(WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER) && WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT))
        WebViewCompat.addWebMessageListener(web,"MJPreparationProof",setOf("https://dembed.st")) { _,message,origin,_,proxy ->
            if(origin.scheme!="https"||origin.host!="dembed.st")return@addWebMessageListener
            val data=message.data ?: return@addWebMessageListener
            if(data=="ready"){frameReply=proxy;ready.countDown();android.util.Log.i("MJNativePrep","provider_frame_ready")}
            else if (data.contains("rendererRemoved")) android.util.Log.i("MJNativePrep", "provider_renderer_removed=${runCatching { JSONObject(data).optBoolean("rendererRemoved") }.getOrDefault(false)}")
            else Bridge().result(nonce,data)
        }
        val bootstrap="""(()=>{MJPreparationProof.onmessage=e=>{if(e.data==='request'){${sessionRequestScript()}}else if(e.data==='native-ready'){try{if(typeof jwplayer==='function'){jwplayer('player').stop();jwplayer('player').remove();}MJPreparationProof.postMessage(JSON.stringify({rendererRemoved:document.querySelectorAll('video').length===0}));}catch(_){}}};let sent=false;const timer=setInterval(()=>{if(!sent&&typeof SRC==='string'){sent=true;clearInterval(timer);MJPreparationProof.postMessage('ready');}},500);})()"""
        WebViewCompat.addDocumentStartJavaScript(web,bootstrap,setOf("https://dembed.st"))
        web.webViewClient = object : WebViewClient() {
            override fun onReceivedError(view:WebView,request:WebResourceRequest,error:WebResourceError){android.util.Log.i("MJNativePrep","web_error main=${request.isForMainFrame} host=${request.url.host} code=${error.errorCode}")}
            override fun onReceivedHttpError(view:WebView,request:WebResourceRequest,response:WebResourceResponse){android.util.Log.i("MJNativePrep","web_http main=${request.isForMainFrame} host=${request.url.host} status=${response.statusCode}")}
            override fun onPageStarted(view:WebView,url:String,icon:android.graphics.Bitmap?) { android.util.Log.i("MJNativePrep","document_started host=${Uri.parse(url).host}") }
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = request.isForMainFrame &&
                (request.url.scheme != "https" || request.url.host !in LocalLiveConfig.watchHosts + "dembed.st")
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                // Prevent duplicate provider-video delivery; native requests never pass through WebView.
                if (request.url.host in mediaHosts) return WebResourceResponse("application/octet-stream", null, 403, "Native proof owns media", emptyMap(), ByteArrayInputStream(byteArrayOf()))
                return null
            }
            override fun onPageFinished(view: WebView, url: String) {
                android.util.Log.i("MJNativePrep","document_finished host=${Uri.parse(url).host}")
                view.evaluateJavascript("JSON.stringify({title:document.title,chars:document.documentElement.innerHTML.length,secure:window.isSecureContext})",{v->android.util.Log.i("MJNativePrep","document_meta=$v")})
                // Readiness comes only from the origin-scoped message carrying its reply proxy.
            }
        }
        web.loadUrl("https://$watchHost/watch.php?id=$channel")
    }
    private fun sessionRequestScript(): String = """
        (async () => {
            let stage = 'DISCOVERY';
            let status = 0;
            try {
                const url = new URL(SRC);
                const allowed = ${JSONObject.quote(edgeHosts.joinToString(","))}.split(',');
                if (url.protocol !== 'https:' || url.port || url.username || url.password ||
                    !allowed.includes(url.hostname) || !url.pathname.startsWith('/premium$channel/')) throw Error();
                stage = 'SESSION';
                const now = Date.now();
                let state = window.__mjNativeProofSession;
                if (!state || state.until < now) {
                    const response = await fetch(url.origin + '/api/playlist-token?slug=premium$channel',
                        {credentials:'omit', cache:'no-store'});
                    if (!response.ok) { status = response.status; throw Error(); }
                    const data = await response.json();
                    if (!data.token || !data.k) throw Error();
                    state = {token:data.token, k:data.k,
                        until:now + Math.min(45, Math.max(1, Number(data.ttl || 120) - 5)) * 1000};
                    window.__mjNativeProofSession = state;
                }
                stage = 'PLAYLIST';
                url.searchParams.set('t', state.token);
                url.searchParams.set('_', Date.now());
                const response = await fetch(url, {credentials:'omit', cache:'no-store'});
                if (!response.ok) { status = response.status; throw Error(); }
                MJPreparationProof.postMessage(JSON.stringify({key:state.k, text:await response.text()}));
            } catch (_) {
                window.__mjNativeProofSession = null;
                MJPreparationProof.postMessage(JSON.stringify({stage, status}));
            }
        })()
    """.trimIndent()

    private fun preparedPlaylist(): ByteArray {
        if(!ready.await(30,TimeUnit.SECONDS)||dead)throw LivePlaybackFailure(LiveFailureStage.DISCOVERY)
        val latch=CountDownLatch(1)
        synchronized(this){pending=latch;reply=null}
        main.post { if(!dead)frameReply?.postMessage("request") }
        try{
            if(!latch.await(20,TimeUnit.SECONDS)||dead)throw LivePlaybackFailure(LiveFailureStage.SESSION)
            val data = try { JSONObject(reply ?: "") }
            catch (_: org.json.JSONException) { throw LivePlaybackFailure(LiveFailureStage.SESSION) }
            if (data.has("stage")) {
                val stage = LiveFailureStage.entries.firstOrNull { it.name == data.optString("stage") }
                    ?: LiveFailureStage.SESSION
                throw LivePlaybackFailure(stage, data.optInt("status").takeIf { it in 400..599 })
            }
            val key = try { Base64.getUrlDecoder().decode(data.getString("key")) }
            catch (_: IllegalArgumentException) { throw LivePlaybackFailure(LiveFailureStage.SESSION) }
            catch (_: org.json.JSONException) { throw LivePlaybackFailure(LiveFailureStage.SESSION) }
            try {
                val raw=data.getString("text")
                val result=PreparedLivePlaylistProof.prepare(raw,key,::mediaAllowed)
                val keyHash=key.contentHashCode()
                if(lastKeyHash!=null&&lastKeyHash!=keyHash)keyChanges++
                lastKeyHash=keyHash
                lastSequence=Regex("#EXT-X-MEDIA-SEQUENCE:(\\d+)").find(raw)?.groupValues?.get(1)?.toLong() ?: -1
                sequences.add(lastSequence);manifests++
                android.util.Log.i("MJNativePrep","prepared channel=$channel sequence=$lastSequence refs=${result.lineSequence().count{it.startsWith("https://")}} manifests=$manifests segments=$segments keyChanges=$keyChanges")
                return result.toByteArray()
            } catch (_: IOException) {
                throw LivePlaybackFailure(LiveFailureStage.PLAYLIST)
            } catch (_: org.json.JSONException) {
                throw LivePlaybackFailure(LiveFailureStage.PLAYLIST)
            } finally { key.fill(0) }
        }finally{synchronized(this){pending=null;reply=null}}
    }

    private inner class ProofDataSource : BaseDataSource(true) {
        private var bytes=byteArrayOf();private var cursor=0;private var end=0;private var uri:Uri?=null
        private var connection:HttpURLConnection?=null;private var started=false
        override fun open(spec:DataSpec):Long {
            uri=spec.uri;transferInitializing(spec)
            bytes = try {
                if (spec.uri.toString() == "mjproof://channel/$channel/index.m3u8") preparedPlaylist()
                else downloadSegment(spec.uri)
            } catch (failure: LivePlaybackFailure) {
                if (!dead) {
                    lastFailure = failure
                    android.util.Log.w("MJNativePrep",
                        "failure channel=$channel stage=${failure.stage.name} http=${failure.status ?: 0}")
                }
                throw failure
            }
            if (lastFailure?.stage in listOf(LiveFailureStage.DISCOVERY, LiveFailureStage.SESSION, LiveFailureStage.PLAYLIST)
                && spec.uri.scheme == "mjproof") lastFailure = null
            if (lastFailure?.stage in listOf(LiveFailureStage.CDN, LiveFailureStage.DECODING)
                && spec.uri.scheme == "https") lastFailure = null
            if(spec.position>bytes.size)throw IOException("Media offset invalid")
            cursor=spec.position.toInt();end=if(spec.length==C.LENGTH_UNSET.toLong())bytes.size else minOf(bytes.size.toLong(),spec.position+spec.length).toInt()
            transferStarted(spec);started=true;return (end-cursor).toLong()
        }
        private fun downloadSegment(address: Uri): ByteArray {
            val uri = try { URI(address.toString()) }
            catch (_: java.net.URISyntaxException) { throw LivePlaybackFailure(LiveFailureStage.CDN) }
            if (!mediaAllowed(uri)) throw LivePlaybackFailure(LiveFailureStage.CDN)
            val response = try {
                val request = uri.toURL().openConnection() as HttpURLConnection
                connection = request
                try {
                    request.connectTimeout = 10000
                    request.readTimeout = 15000
                    request.instanceFollowRedirects = false
                    val status = request.responseCode
                    if (status !in 200..299) throw LivePlaybackFailure(LiveFailureStage.CDN, status)
                    request.inputStream.use { LiveSegmentDecoder.bounded(it, LiveSegmentDecoder.MAX_INPUT) }
                } finally {
                    request.disconnect()
                    connection = null
                }
            } catch (failure: LivePlaybackFailure) {
                throw failure
            } catch (_: IOException) {
                throw LivePlaybackFailure(LiveFailureStage.CDN)
            }
            val decoded = try { LiveSegmentDecoder.decode(response) }
            catch (_: IOException) { throw LivePlaybackFailure(LiveFailureStage.DECODING) }
            segments++
            android.util.Log.i("MJNativePrep", "segment channel=$channel host=${uri.host} bytes=${decoded.size} status=200")
            return decoded
        }

        override fun read(buffer:ByteArray,offset:Int,length:Int):Int{if(length==0)return 0;if(cursor>=end)return C.RESULT_END_OF_INPUT;val n=minOf(length,end-cursor);bytes.copyInto(buffer,offset,cursor,cursor+n);cursor+=n;bytesTransferred(n);return n}
        override fun getUri()=uri
        override fun close(){connection?.disconnect();bytes=byteArrayOf();uri=null;if(started){started=false;transferEnded()}}
    }
    override fun onFirstFrame() {
        if (!dead) frameReply?.postMessage("native-ready")
    }
    override fun close() {
        if (dead) return
        dead=true
        synchronized(this) { pending?.countDown(); pending=null; reply=null }
        ready.countDown()
        frameReply=null
        web.stopLoading()
        WebViewCompat.removeWebMessageListener(web,"MJPreparationProof")
        web.loadUrl("about:blank")
        web.destroy()
        android.util.Log.i("MJNativePrep","session_closed channel=$channel")
    }
}
