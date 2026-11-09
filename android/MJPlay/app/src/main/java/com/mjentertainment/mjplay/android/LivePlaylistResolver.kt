package com.mjentertainment.mjplay.android

import java.io.IOException
import java.net.URI

/** Live-only manifest admission. No token discovery, media IO or provider-script execution. */
internal class LivePlaylistResolver {
    fun prepare(
        source: URI,
        text: String,
        allowed: (URI) -> Boolean,
        wrap: (URI, Boolean) -> String
    ): ByteArray {
        if (text.length > 2 * 1024 * 1024 || !text.startsWith("#EXTM3U"))
            throw IOException("Invalid live playlist")
        val attribute = Regex("URI=\"([^\"]+)\"")
        fun resolve(value: String): URI = resolveLiveReference(source, value).also {
            if (!allowed(it)) throw IOException("Unexpected live source host")
        }
        val lines = text.lineSequence().toList()
        // Admit the complete snapshot before generating any local media references.
        // A future supported provider resolver belongs here, before mjlive wrapping.
        lines.forEach { line ->
            if (line.isNotBlank() && !line.startsWith('#')) resolve(line.trim())
            else if (line.startsWith('#')) attribute.findAll(line).forEach { resolve(it.groupValues[1]) }
        }
        return lines.joinToString("\n") { line ->
            when {
                line.isBlank() -> line
                line.startsWith('#') -> attribute.replace(line) { match ->
                    val key = line.startsWith("#EXT-X-KEY:") || line.startsWith("#EXT-X-SESSION-KEY:")
                    "URI=\"${wrap(resolve(match.groupValues[1]), key)}\""
                }
                else -> wrap(resolve(line.trim()), false)
            }
        }.toByteArray(Charsets.UTF_8)
    }
}
