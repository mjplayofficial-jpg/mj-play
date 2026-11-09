package com.mjentertainment.mjplay.android

import java.net.URI

enum class LiveTransport { WRAPPED_HLS, DIRECT_HLS, PREPARED_HLS, PROVIDER_PAGE }

data class LiveCandidate(val sourceId: String, val url: String, val transport: LiveTransport)

internal fun interface LiveSourceAdapter {
    fun candidates(channel: Channel): List<LiveCandidate>
}

internal object WrappedLiveAdapter : LiveSourceAdapter {
    override fun candidates(channel: Channel): List<LiveCandidate> {
        require(channel.number in 1..999999)
        return listOf(LiveCandidate("wrapped", "mjlive://channel/${channel.number}/entry.m3u8", LiveTransport.WRAPPED_HLS))
    }
}

/** Entries are curated by channel identity. Never infer a mapping from a channel name. */
internal class DirectHlsAdapter(private val byChannel: Map<Int, List<LiveCandidate>>) : LiveSourceAdapter {
    override fun candidates(channel: Channel): List<LiveCandidate> = byChannel[channel.number].orEmpty().filter {
        val uri = runCatching { URI(it.url) }.getOrNull()
        it.transport == LiveTransport.DIRECT_HLS && uri?.scheme == "https" &&
            uri.host != null && uri.rawUserInfo == null && uri.rawFragment == null
    }
}

internal class LiveSourceHealth(private val now: () -> Long = { System.nanoTime() / 1_000_000 }) {
    private val failures = linkedMapOf<Pair<Int, String>, Long>()

    fun failed(channel: Int, source: LiveCandidate) {
        failures[channel to source.sourceId] = now()
        if (failures.size > 256) failures.remove(failures.keys.first())
    }

    fun healthy(channel: Int, source: LiveCandidate) {
        failures.remove(channel to source.sourceId)
    }

    fun order(channel: Int, candidates: List<LiveCandidate>): List<LiveCandidate> =
        candidates.filter { it.transport != LiveTransport.PROVIDER_PAGE }
            .distinctBy { it.url }
            .sortedBy { candidate -> failures[channel to candidate.sourceId]?.let { now() - it < 120_000 } == true }
            .take(3)
}
