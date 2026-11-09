package com.mjentertainment.mjplay.android

import android.content.Context

internal object PreparedLiveTransportFactory {
    fun candidate(channel: Int): LiveCandidate? = null
    fun create(context: Context, channel: Int): PreparedLiveTransport? = null
}
