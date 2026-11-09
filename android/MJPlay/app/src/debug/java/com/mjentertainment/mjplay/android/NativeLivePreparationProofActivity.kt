package com.mjentertainment.mjplay.android

import android.net.Uri
import android.os.Bundle
import android.webkit.*
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.media3.common.*
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.*
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.PlayerView
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

/** Session traffic uses a real WebView origin; Media3 alone downloads/decodes media. Debug only. */
@androidx.annotation.OptIn(UnstableApi::class)
class NativeLivePreparationProofActivity : ComponentActivity() {
    private lateinit var web: WebView
    private lateinit var status: TextView
    private var player: ExoPlayer? = null
    private val nonce = UUID.randomUUID().toString()
    private val ready = CountDownLatch(1)
    private var dead = false
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
            synchronized(this@NativeLivePreparationProofActivity) {
                if (pending == null) return
                reply = data
                pending?.countDown()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        status = TextView(this).apply { text = "MJ native preparation proof · channel 339\nInitializing genuine on-device session…"; setTextColor(-1); setPadding(12,12,12,12) }
        web = WebView(this)
        WebView.setWebContentsDebuggingEnabled(true)
        web.settings.apply { javaScriptEnabled=true; domStorageEnabled=true; allowFileAccess=false; allowContentAccess=false; mixedContentMode=WebSettings.MIXED_CONTENT_NEVER_ALLOW }
        check(WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER) && WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT))
        WebViewCompat.addWebMessageListener(web,"MJPreparationProof",setOf("https://dembed.st")) { _,message,origin,_,proxy ->
            if(origin.scheme!="https"||origin.host!="dembed.st")return@addWebMessageListener
            val data=message.data ?: return@addWebMessageListener
            if(data=="ready"){frameReply=proxy;ready.countDown();android.util.Log.i("MJNativePrep","provider_frame_ready")}
            else Bridge().result(nonce,data)
        }
        val bootstrap="""(()=>{MJPreparationProof.onmessage=e=>{if(e.data==='request'){${sessionRequestScript()}}};let sent=false;const timer=setInterval(()=>{if(!sent&&typeof SRC==='string'){sent=true;clearInterval(timer);MJPreparationProof.postMessage('ready');}},500);})()"""
        WebViewCompat.addDocumentStartJavaScript(web,bootstrap,setOf("https://dembed.st"))
        web.webViewClient = object : WebViewClient() {
            override fun onReceivedError(view:WebView,request:WebResourceRequest,error:WebResourceError){android.util.Log.i("MJNativePrep","web_error main=${request.isForMainFrame} host=${request.url.host} code=${error.errorCode}")}
            override fun onReceivedHttpError(view:WebView,request:WebResourceRequest,response:WebResourceResponse){android.util.Log.i("MJNativePrep","web_http main=${request.isForMainFrame} host=${request.url.host} status=${response.statusCode}")}
            override fun onPageStarted(view:WebView,url:String,icon:android.graphics.Bitmap?) { android.util.Log.i("MJNativePrep","document_started host=${Uri.parse(url).host}") }
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = request.isForMainFrame &&
                (request.url.scheme != "https" || request.url.host !in setOf("dembed.st","thedaddy.li","thedaddy.pk","dlive.sx"))
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                // Prevent duplicate provider-video delivery; native requests never pass through WebView.
                if (request.url.host in mediaHosts) return WebResourceResponse("application/octet-stream", null, 403, "Native proof owns media", emptyMap(), ByteArrayInputStream(byteArrayOf()))
                return null
            }
            override fun onPageFinished(view: WebView, url: String) {
                android.util.Log.i("MJNativePrep","document_finished host=${Uri.parse(url).host}")
                view.evaluateJavascript("JSON.stringify({title:document.title,chars:document.documentElement.innerHTML.length,secure:window.isSecureContext})",{v->android.util.Log.i("MJNativePrep","document_meta=$v")})
                if (Uri.parse(url).host != "dembed.st") return
                view.evaluateJavascript("typeof SRC === 'string'", { value -> if(value=="true") ready.countDown() })
            }
        }
        val pv = PlayerView(this)
        setContentView(LinearLayout(this).apply {
            orientation=LinearLayout.VERTICAL;setBackgroundColor(android.graphics.Color.BLACK)
            addView(status);addView(pv, LinearLayout.LayoutParams(-1,0,1f));addView(web,LinearLayout.LayoutParams(1,1))
        })
        val factory = DataSource.Factory { ProofDataSource() }
        player = ExoPlayer.Builder(this).setMediaSourceFactory(DefaultMediaSourceFactory(factory)).build().also { p ->
            pv.player=p
            p.addListener(object : Player.Listener {
                override fun onRenderedFirstFrame() { android.util.Log.i("MJNativePrep", "first_frame renderer=Media3") }
                override fun onPlayerError(error: PlaybackException) {
                    status.text="Native proof failed: ${error.errorCodeName}"
                    val reason=generateSequence(error as Throwable){it.cause}.last().message.orEmpty()
                    android.util.Log.i("MJNativePrep", "failed code=${error.errorCodeName} reason=${reason.takeIf { !it.contains("http") && it.length < 150 } ?: "redacted"}")
                }
            })
            p.setMediaItem(MediaItem.Builder().setUri("mjproof://channel/339/index.m3u8").setMimeType(MimeTypes.APPLICATION_M3U8).build())
            p.prepare();p.play()
        }
        web.loadUrl("https://thedaddy.li/watch.php?id=339")
        web.post(object : Runnable {
            override fun run() {
                if(dead)return
                val p=player
                val video=p?.videoDecoderCounters?.also { it.ensureUpdated() }
                val audio=p?.audioDecoderCounters?.also { it.ensureUpdated() }
                android.util.Log.i("MJNativePrep", "sample playing=${p?.isPlaying} position=${p?.currentPosition} frames=${video?.renderedOutputBufferCount} audio=${audio?.renderedOutputBufferCount} manifests=$manifests sequences=${sequences.size} lastSequence=$lastSequence segments=$segments keyChanges=$keyChanges")
                if(p?.isPlaying==true) status.text="MJ Media3 · 339 · ${p.videoSize.height}p\nNative segments: $segments · playlists: $manifests · session key changes: $keyChanges"
                web.postDelayed(this,5000)
            }
        })
    }

    private fun sessionRequestScript():String = """(async()=>{try{
            const origin=new URL(SRC).origin;
            if(!${JSONObject.quote(LocalLiveConfig.hosts.joinToString(","))}.split(',').includes(new URL(SRC).hostname))throw Error('Source host not admitted');
            const now=Date.now();let state=window.__mjNativeProofSession;
            if(!state||state.until<now){const response=await fetch(origin+'/api/playlist-token?slug=premium339',{credentials:'omit',cache:'no-store'});if(!response.ok)throw Error('Session HTTP '+response.status);const data=await response.json();if(!data.token||!data.k)throw Error('Session preparation key missing');state={token:data.token,k:data.k,until:now+Math.min(45,Math.max(1,Number(data.ttl||120)-5))*1000};window.__mjNativeProofSession=state;}
            const url=new URL(SRC);url.searchParams.set('t',state.token);url.searchParams.set('_',Date.now());const response=await fetch(url,{credentials:'omit',cache:'no-store'});if(!response.ok)throw Error('Playlist HTTP '+response.status);const text=await response.text();
            MJPreparationProof.postMessage(JSON.stringify({key:state.k,text}));
        }catch(e){MJPreparationProof.postMessage(JSON.stringify({error:String(e.message).slice(0,100)}));}})()"""

    private fun preparedPlaylist(): ByteArray {
        if(!ready.await(30,TimeUnit.SECONDS)||dead)throw IOException("Session document not ready")
        val latch=CountDownLatch(1)
        synchronized(this){pending=latch;reply=null}
        runOnUiThread { if(!dead)frameReply?.postMessage("request") }
        try{
            if(!latch.await(20,TimeUnit.SECONDS)||dead)throw IOException("Session preparation timed out")
            val data=JSONObject(reply ?: throw IOException("Missing session response"))
            if(data.has("error"))throw IOException(data.getString("error").takeIf{!it.contains("http") } ?: "Session request failed")
            val key=Base64.getUrlDecoder().decode(data.getString("key"))
            try {
                val raw=data.getString("text")
                val result=PreparedLivePlaylistProof.prepare(raw,key,::mediaAllowed)
                val keyHash=key.contentHashCode()
                if(lastKeyHash!=null&&lastKeyHash!=keyHash)keyChanges++
                lastKeyHash=keyHash
                lastSequence=Regex("#EXT-X-MEDIA-SEQUENCE:(\\d+)").find(raw)?.groupValues?.get(1)?.toLong() ?: -1
                sequences.add(lastSequence);manifests++
                android.util.Log.i("MJNativePrep","prepared sequence=$lastSequence refs=${result.lineSequence().count{it.startsWith("https://")}}")
                return result.toByteArray()
            }finally{key.fill(0)}
        }finally{synchronized(this){pending=null;reply=null}}
    }

    private inner class ProofDataSource : BaseDataSource(true) {
        private var bytes=byteArrayOf();private var cursor=0;private var end=0;private var uri:Uri?=null
        private var connection:HttpURLConnection?=null;private var started=false
        override fun open(spec:DataSpec):Long {
            uri=spec.uri;transferInitializing(spec)
            bytes=if(spec.uri.toString()=="mjproof://channel/339/index.m3u8")preparedPlaylist()else{
                val u=URI(spec.uri.toString());if(!mediaAllowed(u))throw IOException("Media host not admitted")
                val c=u.toURL().openConnection() as HttpURLConnection;connection=c
                try{c.connectTimeout=10000;c.readTimeout=15000;c.instanceFollowRedirects=false
                    val status=c.responseCode;if(status !in 200..299)throw IOException("Media HTTP $status")
                    val decoded=c.inputStream.use{LiveSegmentDecoder.decode(LiveSegmentDecoder.bounded(it,LiveSegmentDecoder.MAX_INPUT))}
                    segments++;android.util.Log.i("MJNativePrep","segment host=${u.host} bytes=${decoded.size} status=$status");decoded
                }finally{c.disconnect();connection=null}
            }
            if(spec.position>bytes.size)throw IOException("Media offset invalid")
            cursor=spec.position.toInt();end=if(spec.length==C.LENGTH_UNSET.toLong())bytes.size else minOf(bytes.size.toLong(),spec.position+spec.length).toInt()
            transferStarted(spec);started=true;return (end-cursor).toLong()
        }
        override fun read(buffer:ByteArray,offset:Int,length:Int):Int{if(length==0)return 0;if(cursor>=end)return C.RESULT_END_OF_INPUT;val n=minOf(length,end-cursor);bytes.copyInto(buffer,offset,cursor,cursor+n);cursor+=n;bytesTransferred(n);return n}
        override fun getUri()=uri
        override fun close(){connection?.disconnect();bytes=byteArrayOf();uri=null;if(started){started=false;transferEnded()}}
    }
    override fun onDestroy(){dead=true;synchronized(this){pending?.countDown();pending=null;reply=null};player?.release();WebViewCompat.removeWebMessageListener(web,"MJPreparationProof");web.destroy();super.onDestroy()}
}
