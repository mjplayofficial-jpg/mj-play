package com.mjentertainment.mjplay.android

import org.junit.Assert.*
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.DataOutputStream
import java.io.IOException
import java.net.URI
import java.util.zip.DeflaterOutputStream
import java.util.zip.GZIPOutputStream

class LocalLiveTest {
    private fun ts() = ByteArray(564) { if(it%188==0) 71 else (it%67).toByte() }
    private fun gzip(b: ByteArray): ByteArray = ByteArrayOutputStream().also { out -> GZIPOutputStream(out).use { it.write(b) } }.toByteArray()
    @Test fun passesTransportAndRawGzipWrappers() {
        val expected=ts()
        assertSame(expected,LiveSegmentDecoder.decode(expected))
        assertArrayEquals(expected,LiveSegmentDecoder.decode("prefixTIKTIKRAW".toByteArray()+expected))
        assertArrayEquals(expected,LiveSegmentDecoder.decode("TIKTIKTSGZ".toByteArray()+gzip(expected)))
        assertArrayEquals(expected,LiveSegmentDecoder.decode("garbage".toByteArray()+expected))
    }
    @Test fun unwrapsWebpExif() {
        val b=ByteArrayOutputStream(); b.write("RIFF".toByteArray()); b.write(ByteArray(4)); b.write("WEBPEXIF".toByteArray())
        val payload=ts(); repeat(4) { b.write(payload.size shr (it*8) and 255) }; b.write(payload)
        assertArrayEquals(payload,LiveSegmentDecoder.decode(b.toByteArray()))
    }
    @Test fun unwrapsPngEveryFilterAndAlpha() {
        for(channels in listOf(3,4)) for(filter in 0..4) {
            val expected=ts(); val compressed=gzip(expected)
            val rgb="TIKTIKPX".toByteArray()+ByteArrayOutputStream().also { DataOutputStream(it).writeInt(compressed.size) }.toByteArray()+compressed
            val width=16; val height=(rgb.size+width*3-1)/(width*3)
            val scan=ByteArrayOutputStream(); var previous=ByteArray(width*channels)
            repeat(height) { y ->
                val row=ByteArray(width*channels)
                for(x in 0 until width) for(c in 0..2) row[x*channels+c]=rgb.getOrElse((y*width+x)*3+c) { 0 }
                scan.write(filter)
                for(x in row.indices) {
                    val a=if(x>=channels) row[x-channels].toInt() and 255 else 0; val v=previous[x].toInt() and 255; val c=if(x>=channels) previous[x-channels].toInt() and 255 else 0
                    val p=a+v-c; val pa=kotlin.math.abs(p-a); val pb=kotlin.math.abs(p-v); val pc=kotlin.math.abs(p-c)
                    val correction=when(filter) { 0->0; 1->a; 2->v; 3->(a+v)/2; else->if(pa<=pb && pa<=pc) a else if(pb<=pc) v else c }
                    scan.write(((row[x].toInt() and 255)-correction) and 255)
                }; previous=row
            }
            val out=ByteArrayOutputStream(); out.write(byteArrayOf(137.toByte(),80,78,71,13,10,26,10))
            fun chunk(tag: String, data: ByteArray) { DataOutputStream(out).writeInt(data.size); out.write(tag.toByteArray()); out.write(data); out.write(ByteArray(4)) }
            val ihdr=ByteArrayOutputStream(); DataOutputStream(ihdr).apply { writeInt(width); writeInt(height); writeByte(8); writeByte(if(channels==3) 2 else 6); write(ByteArray(3)) }
            chunk("IHDR",ihdr.toByteArray()); val deflated=ByteArrayOutputStream(); DeflaterOutputStream(deflated).use { it.write(scan.toByteArray()) }; chunk("IDAT",deflated.toByteArray()); chunk("IEND",ByteArray(0))
            assertArrayEquals("filter=$filter channels=$channels",expected,LiveSegmentDecoder.decode(out.toByteArray()))
        }
    }
    @Test fun rejectsMalformedAndOversizedInflation() {
        assertThrows(IOException::class.java) { LiveSegmentDecoder.decode(byteArrayOf(1,2,3)) }
        assertThrows(IOException::class.java) { LiveSegmentDecoder.decode(ByteArray(LiveSegmentDecoder.MAX_INPUT+1)) }
        assertThrows(IOException::class.java) { LiveSegmentDecoder.bounded(ByteArrayInputStream(ByteArray(20)),10) }
        assertThrows(IOException::class.java) { LiveSegmentDecoder.decode("TIKTIKTSGZ".toByteArray()+gzip(ByteArray(33*1024*1024))) }
    }
    @Test fun validatesSourceBoundaries() {
        val hosts=LocalLiveConfig.parse(LocalLiveConfig.DEFAULT)
        val s=LocalLiveSession(38,hosts,{ _,_->error("No network expected") })
        assertTrue(s.allowed(URI("https://edge.wedd48c.top/premium38/a.m3u8")))
        listOf("https://edge.wedd48c.top/premium380/a", "https://evil.test/premium38/a", "http://edge.wedd48c.top/premium38/a", "https://user@edge.wedd48c.top/premium38/a", "https://edge.wedd48c.top:8443/premium38/a", "https://edge.wedd48c.top/premium38/a#x").forEach { assertFalse(it,s.allowed(URI(it))) }
        assertThrows(IllegalArgumentException::class.java) { LocalLiveConfig.parse("{\"allowed_hosts\":[\"localhost\"]}") }
    }
    @Test fun resolvesRewritesAndRefreshesOnDeviceWithoutBackend() {
        var clock=0L; var tokens=0; val requested=mutableListOf<URI>()
        val s=LocalLiveSession(38,setOf("edge.wedd48c.top"),{ u,_ ->
            requested.add(u)
            when {
                u.host=="dembed.st" -> "const SRC = \"https://edge.wedd48c.top/premium38/main.m3u8\";".toByteArray()
                u.path=="/api/playlist-token" -> "{\"token\":\"token${++tokens}\"}".toByteArray()
                u.path.endsWith(".m3u8") -> "#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI=\"key.bin\"\n#EXTINF:6,\nchunk.png\n".toByteArray()
                else -> "TIKTIKRAW".toByteArray()+ts()
            }
        },{clock})
        val manifest=s.load(URI("mjlive://channel/38/entry.m3u8")).toString(Charsets.UTF_8)
        assertTrue(manifest.contains("URI=\"mjlive://channel/38/media/"))
        val segment=URI(manifest.lines().first { it.startsWith("mjlive:") })
        assertArrayEquals(ts(),s.load(segment))
        s.load(URI("mjlive://channel/38/entry.m3u8")); assertEquals(1,tokens)
        clock=31_000; s.load(URI("mjlive://channel/38/entry.m3u8")); assertEquals(2,tokens)
        assertTrue(requested.all { it.host in setOf("dembed.st","edge.wedd48c.top") })
        assertTrue(s.sourceBytes.get()>0); assertEquals(1L,s.transformedSegments.get())
    }
    @Test fun retriesExpiredPlaylistOnceAndRejectsUnapprovedManifestLinks() {
        var tokens=0; var manifests=0
        val s=LocalLiveSession(38,setOf("edge.wedd48c.top"),{ u,_ -> when {
            u.host=="dembed.st" -> "const SRC=\"https://edge.wedd48c.top/premium38/live.m3u8\"".toByteArray()
            u.path=="/api/playlist-token" -> "{\"token\":\"${++tokens}\"}".toByteArray()
            else -> { if(++manifests==1) throw LiveHttpException(403); "#EXTM3U\nhttps://evil.test/segment.ts".toByteArray() }
        } })
        assertThrows(IOException::class.java) { s.load(URI("mjlive://channel/38/entry.m3u8")) }
        assertEquals(2,tokens); assertEquals(2,manifests)
    }
}
