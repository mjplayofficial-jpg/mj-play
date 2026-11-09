package com.mjentertainment.mjplay.android

import android.app.Activity
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

/** Debug-only WebView experiment. No native resolver, production config or live changes. */
class EmbedProofActivity : ComponentActivity() {
    private lateinit var web: WebView
    private lateinit var root: FrameLayout
    private var custom: View? = null
    private var callback: WebChromeClient.CustomViewCallback? = null
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        root=FrameLayout(this);web=WebView(this);root.addView(web);setContentView(root)
        web.settings.javaScriptEnabled=true;web.settings.domStorageEnabled=true
        web.settings.mediaPlaybackRequiresUserGesture=false
        web.settings.allowFileAccess=false;web.settings.allowContentAccess=false
        web.settings.mixedContentMode=WebSettings.MIXED_CONTENT_NEVER_ALLOW
        web.settings.setSupportMultipleWindows(true)
        web.webChromeClient=object:WebChromeClient(){
            override fun onCreateWindow(view:WebView?,dialog:Boolean,gesture:Boolean,result:android.os.Message?):Boolean=false
            override fun onShowCustomView(view:View,cb:CustomViewCallback){custom=view;callback=cb;root.addView(view);web.visibility=View.GONE}
            override fun onHideCustomView(){custom?.let(root::removeView);custom=null;web.visibility=View.VISIBLE;callback?.onCustomViewHidden();callback=null}
        }
        web.webViewClient=object:WebViewClient(){
            override fun shouldOverrideUrlLoading(view:WebView,request:WebResourceRequest):Boolean {
                if(!request.isForMainFrame)return false
                if(request.url.host=="mj-embed-research.invalid"&&request.url.path=="/close")finish()
                // Never send top-level ad navigation to another app or page.
                return true
            }
            override fun shouldInterceptRequest(view:WebView,request:WebResourceRequest):WebResourceResponse? {
                if(request.url.host!="mj-embed-research.invalid")return null
                val path=if(request.url.path=="/app.js")"app.js" else if(request.url.path=="/")"index.html" else return WebResourceResponse("text/plain","UTF-8",java.io.ByteArrayInputStream(ByteArray(0)))
                return WebResourceResponse(if(path.endsWith("js"))"application/javascript" else "text/html","UTF-8",assets.open("embed-proof/$path"))
            }
        }
        val id=intent.getIntExtra("id",155).coerceAtLeast(1)
        val type=if(intent.getStringExtra("type")=="tv")"tv" else "movie"
        val season=intent.getIntExtra("season",1).coerceIn(1,9999);val episode=intent.getIntExtra("episode",1).coerceIn(1,9999)
        web.loadUrl("https://mj-embed-research.invalid/?type=$type&id=$id&season=$season&episode=$episode")
        onBackPressedDispatcher.addCallback(this,object:OnBackPressedCallback(true){override fun handleOnBackPressed(){if(custom!=null)web.webChromeClient?.onHideCustomView() else finish()}})
    }
    override fun onPause(){super.onPause();web.onPause()}
    override fun onResume(){super.onResume();if(::web.isInitialized)web.onResume()}
    override fun onDestroy(){root.removeAllViews();web.destroy();super.onDestroy()}
}
