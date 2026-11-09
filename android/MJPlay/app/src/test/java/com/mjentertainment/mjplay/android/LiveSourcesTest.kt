package com.mjentertainment.mjplay.android

import java.net.URI
import org.junit.Assert.*
import org.junit.Test

class LiveSourcesTest {
    @Test fun classifiesReferencesWithoutGuessingMediaAddresses() {
        val base = URI("https://edge.example/premium339/index.m3u8")
        for (value in listOf("segment.ts", "chunk", "../chunk/42", "segment?part=1", "/live/fragment")) {
            assertEquals(LiveReferenceFormat.RELATIVE, liveReferenceFormat(value))
            assertEquals(base.resolve(value), resolveLiveReference(base, value))
        }
        for (value in listOf("https://cdn.example/live/fragment", "//cdn.example/live/fragment")) {
            assertEquals(LiveReferenceFormat.ABSOLUTE, liveReferenceFormat(value))
            assertEquals("cdn.example", resolveLiveReference(base, value).host)
        }
        for (length in listOf(204, 360, 368)) {
            val value = "a".repeat(length)
            assertEquals(LiveReferenceFormat.OPAQUE, liveReferenceFormat(value))
            assertThrows(UnsupportedLiveSourceException::class.java) { resolveLiveReference(base, value) }
        }
    }

    @Test fun sealedPlaylistStopsAtManifestAndMakesNoFragmentRequest() {
        val requests = mutableListOf<URI>()
        val session = LocalLiveSession(339, setOf("edge.wedd48c.top"), { uri, _ ->
            requests.add(uri)
            when (uri.path) {
                "/premiumtv/daddy.php" -> """const SRC = "https://edge.wedd48c.top/premium339/index.m3u8";"""
                "/api/playlist-token" -> """{"token":"fixture"}"""
                "/premium339/index.m3u8" -> "#EXTM3U\n#EXTINF:6,\n${"a".repeat(204)}\n"
                else -> error("Unexpected fragment request")
            }.toByteArray()
        })
        assertThrows(UnsupportedLiveSourceException::class.java) {
            session.load(URI("mjlive://channel/339/entry.m3u8"))
        }
        assertEquals(3, requests.size)
    }

    @Test fun healthIsChannelScopedAndNativePlanIsBounded() {
        var clock = 0L
        val health = LiveSourceHealth { clock }
        val channel = Channel(339, "Example", "", emptyList())
        val wrapped = WrappedLiveAdapter.candidates(channel).single()
        val direct = LiveCandidate("direct", "https://one.example/live.m3u8", LiveTransport.DIRECT_HLS)
        val hosted = LiveCandidate("embed", "https://two.example/player", LiveTransport.PROVIDER_PAGE)
        val other = direct.copy(sourceId = "other", url = "https://three.example/live.m3u8")
        val extra = direct.copy(sourceId = "extra", url = "https://four.example/live.m3u8")
        val candidates = listOf(wrapped, hosted, direct, direct.copy(sourceId = "duplicate"), other, extra)
        assertEquals(listOf(wrapped, direct, other), health.order(339, candidates))
        health.failed(339, wrapped)
        assertEquals(listOf(direct, other, extra), health.order(339, candidates))
        assertEquals(wrapped, health.order(340, candidates).first())
        clock = 120_000
        assertEquals(wrapped, health.order(339, candidates).first())
        health.failed(339, wrapped)
        health.healthy(339, wrapped)
        assertEquals(wrapped, health.order(339, candidates).first())
        assertEquals(listOf(direct), DirectHlsAdapter(mapOf(339 to listOf(direct, hosted, direct.copy(url = "http://one.example/live")))).candidates(channel))
    }
}
