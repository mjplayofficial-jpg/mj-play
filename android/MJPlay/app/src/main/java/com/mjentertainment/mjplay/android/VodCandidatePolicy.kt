package com.mjentertainment.mjplay.android

import org.json.JSONObject

internal data class VodCandidate(val name: String, val encoded: String)

/** Bounded English HLS fallback. Labels are eligibility hints, not playback proof. */
internal object VodCandidatePolicy {
    fun candidates(data: JSONObject): List<VodCandidate> = data.keys().asSequence().toList()
        .mapNotNull { name ->
            val source = data.optJSONObject(name) ?: return@mapNotNull null
            val url = source.optString("url").trim()
            val language = source.optString("language").trim().lowercase()
            if (url.isEmpty() || url.length > 16384 || source.optString("type").lowercase() != "hls" || language !in setOf("en", "eng", "english")) null
            else VodCandidate(name, url)
        }
        .sortedWith(compareBy<VodCandidate> { if (it.name == "Orion") 0 else if (it.name == "Luna") 1 else 2 }.thenBy { it.name })
        .distinctBy { it.encoded }.take(3)
}

internal object VodPlaylistPolicy {
    fun successful(status: Int) = status == 200 || status == 206
    fun isPlaylist(text: String) = text.trimStart('\uFEFF',' ','\r','\n','\t').let { it == "#EXTM3U" || it.startsWith("#EXTM3U\n") || it.startsWith("#EXTM3U\r\n") }
}
