package com.mjentertainment.mjplay.android

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.util.zip.GZIPInputStream
import java.util.zip.InflaterInputStream
import java.io.InputStream

/** Container unwrapping only. No video re-encoding and no Android bitmap allocation. */
internal object LiveSegmentDecoder {
    const val MAX_INPUT = 16 * 1024 * 1024
    private const val MAX_OUTPUT = 32 * 1024 * 1024
    fun bounded(input: InputStream, max: Int): ByteArray {
        val out = ByteArrayOutputStream(minOf(max, 65536)); val buffer = ByteArray(16384)
        while (true) {
            if (Thread.currentThread().isInterrupted) throw IOException("Live request cancelled")
            val n = input.read(buffer); if (n < 0) break
            if (out.size().toLong() + n > max) throw IOException("Live response too large")
            out.write(buffer, 0, n)
        }
        return out.toByteArray()
    }
    private fun ts(b: ByteArray, p: Int = 0) = p >= 0 && b.size - p > 188 && b[p] == 71.toByte() && b[p + 188] == 71.toByte()
    private fun ascii(b: ByteArray, p: Int, n: Int) = if (p < 0 || p.toLong() + n > b.size) "" else String(b, p, n, Charsets.US_ASCII)
    private fun uint(b: ByteArray, p: Int, little: Boolean = false): Int {
        if (p < 0 || p.toLong() + 4 > b.size) throw IOException("Truncated live container")
        var v = 0L
        for (i in 0..3) v = v or ((b[p + i].toLong() and 255) shl (if (little) i * 8 else (3 - i) * 8))
        if (v > Int.MAX_VALUE) throw IOException("Invalid live container size")
        return v.toInt()
    }
    private fun unzip(b: ByteArray) = GZIPInputStream(ByteArrayInputStream(b)).use { bounded(it, MAX_OUTPUT) }
    private fun paeth(a: Int, b: Int, c: Int): Int {
        val p = a + b - c; val x = kotlin.math.abs(p-a); val y = kotlin.math.abs(p-b); val z = kotlin.math.abs(p-c)
        return if (x <= y && x <= z) a else if (y <= z) b else c
    }
    fun decode(b: ByteArray): ByteArray {
        if (b.size > MAX_INPUT) throw IOException("Live segment too large")
        if (ts(b)) return b
        if (ascii(b,0,4) == "RIFF" && ascii(b,8,4) == "WEBP") {
            var p=12
            while (p.toLong()+8 <= b.size) {
                val tag=ascii(b,p,4); val n=uint(b,p+4,true); p+=8
                if(n > b.size-p) throw IOException("Invalid WebP container")
                if(tag == "EXIF" && n > 188 && ts(b,p)) return b.copyOfRange(p,p+n)
                p += n + (n and 1)
            }
        }
        if (b.take(8) == listOf(137,80,78,71,13,10,26,10).map(Int::toByte)) {
            var p=8; var w=0; var h=0; var channels=0; val parts=ByteArrayOutputStream()
            while(p.toLong()+12 <= b.size) {
                val n=uint(b,p); if(n > b.size-p-12) throw IOException("Invalid PNG container")
                val tag=ascii(b,p+4,4); val d=p+8; p+=n+12
                if(tag == "IHDR") {
                    if(n != 13 || b[d+8] != 8.toByte() || b[d+10] != 0.toByte() || b[d+11] != 0.toByte() || b[d+12] != 0.toByte() || b[d+9].toInt() !in listOf(2,6)) throw IOException("Unsupported PNG container")
                    w=uint(b,d); h=uint(b,d+4); channels=if(b[d+9].toInt()==6) 4 else 3
                    if(w == 0 || h == 0 || w.toLong()*h*channels+h > MAX_OUTPUT) throw IOException("PNG container too large")
                }
                if(tag == "IDAT") parts.write(b,d,n)
                if(tag == "IEND") { if(ts(b,p)) return b.copyOfRange(p,b.size); break }
            }
            if(w == 0 || channels == 0 || parts.size() == 0) throw IOException("Missing PNG payload")
            val stride=w*channels
            val raw=InflaterInputStream(ByteArrayInputStream(parts.toByteArray())).use { bounded(it,MAX_OUTPUT) }
            if(raw.size != (stride+1)*h) throw IOException("Invalid PNG pixels")
            val rgb=ByteArray(w*h*3); var previous=ByteArray(stride); var src=0; var dst=0
            repeat(h) {
                val filter=raw[src++].toInt() and 255; if(filter > 4) throw IOException("Invalid PNG filter")
                val row=ByteArray(stride)
                for(x in row.indices) {
                    val a=if(x>=channels) row[x-channels].toInt() and 255 else 0
                    val v=previous[x].toInt() and 255; val c=if(x>=channels) previous[x-channels].toInt() and 255 else 0
                    val correction=when(filter) { 0->0; 1->a; 2->v; 3->(a+v)/2; else->paeth(a,v,c) }
                    row[x]=((raw[src++].toInt() and 255)+correction).toByte()
                }
                for(x in 0 until stride step channels) { rgb[dst++]=row[x]; rgb[dst++]=row[x+1]; rgb[dst++]=row[x+2] }
                previous=row
            }
            if(ascii(rgb,0,8) != "TIKTIKPX") throw IOException("Missing media payload")
            val n=uint(rgb,8); if(n < 1 || n > rgb.size-12) throw IOException("Invalid media payload size")
            val result=unzip(rgb.copyOfRange(12,12+n)); if(!ts(result)) throw IOException("Invalid transport stream")
            return result
        }
        for ((tag,gzip) in listOf("TIKTIKRAW" to false,"TIKTIKTSGZ" to true)) {
            val marker=tag.toByteArray(Charsets.US_ASCII)
            val i=(0..(b.size-marker.size)).firstOrNull { p -> marker.indices.all { b[p+it]==marker[it] } }
            if(i != null) { val data=b.copyOfRange(i+marker.size,b.size); val result=if(gzip) unzip(data) else data; if(ts(result)) return result }
        }
        for(p in 0 until b.size-376) if(ts(b,p) && b[p+376]==71.toByte()) return b.copyOfRange(p,b.size)
        throw IOException("Unsupported live segment")
    }
}
