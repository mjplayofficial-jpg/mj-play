package com.mjentertainment.mjplay.android

import java.io.IOException
import java.net.URI
import java.nio.ByteBuffer
import java.nio.charset.CodingErrorAction
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

/** Isolated format-compatibility experiment; not wired into production or source acquisition. */
internal object PreparedLivePlaylistProof {
    fun prepare(raw: String, sessionKey: ByteArray, allowed: (URI) -> Boolean): String {
        if (!raw.startsWith("#EXTM3U") || raw.length > 2 * 1024 * 1024 || sessionKey.size !in setOf(16, 24, 32))
            throw IOException("Invalid preparation input")
        val lines = raw.lineSequence().toList()
        if (lines.size > 8192) throw IOException("Preparation input too large")
        var sequence: Long? = null
        val prepared = lines.map { line ->
            val value = line.trim()
            when {
                value.isEmpty() -> value
                value.startsWith("#EXT-X-MEDIA-SEQUENCE:") -> {
                    sequence = value.substringAfter(':').trim().toLongOrNull()?.takeIf { it >= 0 && it <= Long.MAX_VALUE - 8192 }
                        ?: throw IOException("Invalid live sequence")
                    value
                }
                value.startsWith('#') -> value
                else -> {
                    val sn = sequence ?: throw IOException("Missing live sequence")
                    if (!value.matches(Regex("[A-Za-z0-9_-]{1,8192}={0,2}"))) throw IOException("Unexpected sealed reference")
                    val uri = try {
                        val counter = ByteBuffer.allocate(16).putLong(0).putLong(sn).array()
                        val cipher = Cipher.getInstance("AES/CTR/NoPadding")
                        cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(sessionKey, "AES"), IvParameterSpec(counter))
                        val bytes = cipher.doFinal(Base64.getUrlDecoder().decode(value))
                        val text = Charsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                            .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString()
                        URI(text)
                    } catch (_: Exception) { throw IOException("Live reference preparation failed") }
                    if (uri.scheme != "https" || uri.rawUserInfo != null || uri.rawFragment != null || !allowed(uri))
                        throw IOException("Prepared live address not admitted")
                    sequence = sn + 1
                    uri.toASCIIString()
                }
            }
        }
        return prepared.joinToString("\n").trimEnd() + "\n"
    }
}
