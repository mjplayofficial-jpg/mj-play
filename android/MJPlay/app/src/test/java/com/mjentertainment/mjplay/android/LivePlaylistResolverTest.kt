package com.mjentertainment.mjplay.android

import java.io.IOException
import java.net.URI
import org.junit.Assert.*
import org.junit.Test

class LivePlaylistResolverTest {
    private val source = URI("https://edge.wedd48c.top/premium339/index.m3u8")
    private val resolver = LivePlaylistResolver()
    private fun allowed(uri: URI) = uri.scheme == "https" && uri.host == source.host && uri.rawUserInfo == null

    @Test fun admitsRelativeAbsoluteAndKeyReferences() {
        val seen = mutableListOf<Pair<URI, Boolean>>()
        val result = resolver.prepare(source,
            "#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI=\"key.bin\"\n#EXTINF:6,\na.ts\n${source.resolve("b.ts")}\n",
            ::allowed) { uri, key -> seen.add(uri to key); "local-${seen.size}" }.toString(Charsets.UTF_8)
        assertEquals(listOf(source.resolve("key.bin") to true, source.resolve("a.ts") to false, source.resolve("b.ts") to false), seen)
        assertTrue(result.contains("URI=\"local-1\""))
        assertTrue(result.contains("local-2\nlocal-3"))
    }

    @Test fun rejectsEntireSnapshotBeforeWrappingOpaqueOrDisallowedReferences() {
        for (bad in listOf("a".repeat(368), "https://unapproved.example/media.ts", "http://edge.wedd48c.top/media.ts")) {
            var wrapped = 0
            assertThrows(IOException::class.java) {
                resolver.prepare(source, "#EXTM3U\na.ts\n$bad", ::allowed) { _, _ -> wrapped++; "local" }
            }
            assertEquals(0, wrapped)
        }
    }

    @Test fun rejectsOpaqueAttributeAndInvalidManifest() {
        assertThrows(UnsupportedLiveSourceException::class.java) {
            resolver.prepare(source, "#EXTM3U\n#EXT-X-MAP:URI=\"${"b".repeat(204)}\"", ::allowed) { _, _ -> error("Must not wrap") }
        }
        assertThrows(IOException::class.java) {
            resolver.prepare(source, "<html>error</html>", ::allowed) { _, _ -> error("Must not wrap") }
        }
    }

    @Test fun experimentalSessionRetainsRefreshAndAdvancingPlaylistBehavior() {
        var clock = 0L
        var tokens = 0
        var playlists = 0
        val session = LocalLiveSession(339, setOf(source.host), { uri, _ ->
            when (uri.path) {
                "/premiumtv/daddy.php" -> "const SRC = \"$source\";"
                "/api/playlist-token" -> "{\"token\":\"fixture-${++tokens}\"}"
                source.path -> "#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:${++playlists}\n#EXTINF:6,\nsegment-$playlists.ts\n"
                else -> error("No media fetching during preparation")
            }.toByteArray()
        }, { clock }, resolver)
        val entry = URI("mjlive://channel/339/entry.m3u8")
        val first = session.load(entry).toString(Charsets.UTF_8)
        clock = 1000
        val second = session.load(entry).toString(Charsets.UTF_8)
        assertEquals(1, tokens)
        assertTrue(first.contains("MEDIA-SEQUENCE:1"))
        assertTrue(second.contains("MEDIA-SEQUENCE:2"))
        clock = 31_000
        session.load(entry)
        assertEquals(2, tokens)
        assertEquals(3, playlists)
        assertEquals(0L, session.transformedSegments.get())
    }
}
