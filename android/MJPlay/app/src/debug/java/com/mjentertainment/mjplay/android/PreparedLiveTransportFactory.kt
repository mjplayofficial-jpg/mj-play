package com.mjentertainment.mjplay.android

import android.content.Context
import androidx.webkit.WebViewFeature

internal object PreparedLiveTransportFactory {
    fun candidate(channel: Int): LiveCandidate? = if (channel in 1..999999)
        LiveCandidate("daddy-prepared-preview", "mjproof://channel/$channel/index.m3u8", LiveTransport.PREPARED_HLS) else null

    fun create(context: Context, channel: Int): PreparedLiveTransport? =
        if (channel in 1..999999 && WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER) &&
            WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) PreparedLiveSession(context, channel) else null
}
