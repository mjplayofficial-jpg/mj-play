package com.mjentertainment.mjplay.android

import java.io.IOException

internal const val LIVE_PLAYBACK_UNAVAILABLE = "This channel is temporarily unavailable. Please try again."

internal enum class LiveFailureStage(val label: String) {
    DISCOVERY("Channel discovery"),
    SESSION("Session initialization or renewal"),
    PLAYLIST("Playlist preparation"),
    CDN("CDN delivery"),
    DECODING("Media decoding");
}

internal class LivePlaybackFailure(
    val stage: LiveFailureStage,
    val status: Int? = null,
) : IOException(stage.label)
