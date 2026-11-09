package com.mjentertainment.mjplay.android

/** Positive offset displays captions later; negative offset displays them earlier. */
fun captionAt(cues: List<Caption>, positionMs: Long, offsetSeconds: Float): String {
    val time = positionMs / 1000.0 - offsetSeconds
    var lo = 0; var hi = cues.size
    while (lo < hi) { val mid = (lo + hi) / 2; if (cues[mid].start <= time) lo = mid + 1 else hi = mid }
    return cues.subList((lo - 20).coerceAtLeast(0), lo).filter { it.end > time }.takeLast(3).joinToString("\n") { it.text }
}

fun guideWindow(programmes: List<Programme>, now: Long) = programmes.filter { it.end > now }.take(4)

fun browseColumns(widthDp: Int) = when { widthDp >= 840 -> 4; widthDp >= 600 -> 3; else -> 2 }
fun resumePosition(saved: SavedProgress?, season: Int, episode: Int): Long = saved?.takeIf {
    it.season == season && it.episode == episode && it.position >= 0 && it.duration > 0 && it.position < it.duration - 15000
}?.position ?: 0L
fun recoverablePlayback(http: Int?, code: Int) = http in listOf(401,403,404,408,410,500,502,503,504) || code in listOf(2001,2002)
