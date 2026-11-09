package com.mjentertainment.mjplay.android

import android.os.Bundle
import android.webkit.*
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/** Visible diagnostic. Observes normal requests without saving URLs, cookies or credentials. */
class LiveProviderProofActivity : ComponentActivity() {
    private lateinit var web: WebView
    private var active = true
    private val counts = ConcurrentHashMap<String, AtomicInteger>()
    private val legacyFilters = listOf("/premiumtv", "/stream", "/embed", "/player", "jwplayer",
        "jsdelivr", "jwpcdn", "tiktok", "token", "expires", "signature", ".m3u8", ".ts")

    private fun record(event: String) { counts.getOrPut(event) { AtomicInteger() }.incrementAndGet() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        val channel = intent.getIntExtra("channel", 339)
        require(channel in 1..999999)
        val origin = if (intent.getBooleanExtra("legacyDomain", false)) "https://dlive.sx" else "https://thedaddy.li"
        web = WebView(this)
        setContentView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(android.graphics.Color.BLACK)
            addView(TextView(this@LiveProviderProofActivity).apply {
                text = "MJ hosted channel $channel test\nProvider controls playback. Native handoff unverified."
                setTextColor(android.graphics.Color.WHITE)
                setPadding(16, 16, 16, 16)
            })
            addView(web, LinearLayout.LayoutParams(-1, 0, 1f))
        })
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            setSupportMultipleWindows(true)
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onCreateWindow(view: WebView?, dialog: Boolean, gesture: Boolean, result: android.os.Message?): Boolean {
                record("popup_declined")
                return false
            }
        }
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val permitted = request.url.scheme == "https" && request.url.host in setOf("thedaddy.li", "thedaddy.pk", "dlive.sx")
                if (request.isForMainFrame && !permitted) { record("navigation_declined"); return true }
                return false
            }
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                val path = request.url.path.orEmpty()
                val category = when {
                    path.endsWith(".m3u8") -> "playlist"
                    path.endsWith(".image") -> "image_media"
                    path.contains("playlist-token") -> "token"
                    path.contains("daddy.min.js") -> "loader_script"
                    path.contains("p2p-engine") -> "p2p_script"
                    path.contains("daddy.php") -> "nested_player"
                    else -> "other"
                }
                record(category)
                if (!legacyFilters.any { request.url.toString().contains(it) }) record("legacy_would_reject_$category")
                if (category != "other") android.util.Log.i("MJLiveProvider", "request category=$category host=${request.url.host}")
                return null
            }
            override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, response: WebResourceResponse) {
                record("http_${response.statusCode}")
                android.util.Log.i("MJLiveProvider", "http status=${response.statusCode} main=${request.isForMainFrame} host=${request.url.host}")
            }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) { record("network_${error.errorCode}") }
        }
        web.post(object : Runnable {
            override fun run() {
                if (!active) return
                android.util.Log.i("MJLiveProvider", "summary " + counts.entries.sortedBy { it.key }.joinToString(" ") { "${it.key}=${it.value.get()}" })
                web.postDelayed(this, 10_000)
            }
        })
        web.loadUrl("$origin/stream/stream-$channel.php")
    }
    override fun onPause() { super.onPause(); web.onPause() }
    override fun onResume() { super.onResume(); if (::web.isInitialized) web.onResume() }
    override fun onDestroy() { active = false; web.stopLoading(); web.destroy(); super.onDestroy() }
}
