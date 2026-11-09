package com.mjentertainment.mjplay.android

import java.io.IOException
import java.net.URI
import java.net.URISyntaxException

internal enum class LiveReferenceFormat { ABSOLUTE, RELATIVE, OPAQUE }

internal class UnsupportedLiveSourceException : IOException(
    "This live source requires the provider's player. MJ Player cannot read its segment references."
)

internal fun liveReferenceFormat(reference: String): LiveReferenceFormat {
    // Sealed entries are long, bare tokens. Keep ordinary relative paths, including extensionless URLs.
    if (reference.matches(Regex("[A-Za-z0-9_-]{128,}={0,2}"))) return LiveReferenceFormat.OPAQUE
    val uri = try { URI(reference) } catch (error: URISyntaxException) {
        throw IOException("Invalid live playlist reference", error)
    }
    return if (uri.isAbsolute || uri.rawAuthority != null) LiveReferenceFormat.ABSOLUTE else LiveReferenceFormat.RELATIVE
}

internal fun resolveLiveReference(source: URI, reference: String): URI {
    if (liveReferenceFormat(reference) == LiveReferenceFormat.OPAQUE) throw UnsupportedLiveSourceException()
    return source.resolve(reference)
}
