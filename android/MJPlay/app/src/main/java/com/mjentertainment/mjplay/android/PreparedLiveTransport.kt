package com.mjentertainment.mjplay.android

import android.view.View
import androidx.media3.datasource.DataSource

/** Build-variant boundary: release builds have no browser session-preparation implementation. */
internal interface PreparedLiveTransport : AutoCloseable {
    val view: View
    val factory: DataSource.Factory
    val lastFailure: LivePlaybackFailure?
    fun onFirstFrame()
}
