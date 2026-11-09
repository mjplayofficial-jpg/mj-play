package com.mjentertainment.mjplay.android

import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

/** Verifies native parsing against the real hosted catalogue, not sample data. */
class SportsCatalogueTest {
    @Test fun matchesAndHighlightsUseTheExistingWebCatalogue() = runBlocking {
        val repo = Repository(InstrumentationRegistry.getInstrumentation().targetContext)
        assertTrue("The existing preview session is required", repo.connected)
        val matches = repo.sports("Match")
        assertTrue("Matches should load", matches.isNotEmpty())
        assertEquals("Blogger IDs must stay unique", matches.size, matches.map { it.id }.distinct().size)
        assertTrue("WS playback routes must contain positive channel numbers", matches.flatMap { it.sources }.filter { it.provider == "WS_DDL" }.all { it.kind == "channel" && it.channel > 0 })
        assertTrue("At least one native-playable WS stream should be present", matches.any { event -> event.sources.any { it.provider == "WS_DDL" && it.channel > 0 } })
        val highlights = repo.sports("Highlights")
        assertTrue("Highlights should load", highlights.isNotEmpty())
        assertTrue("YouTube highlights need valid video keys", highlights.any { event -> event.highlight && event.sources.any { it.kind == "youtube" && it.videoKey.matches(Regex("[-\\w]{11}")) } })
        assertTrue("Schedules must contain valid start and end timestamps", (matches + highlights).all { it.starts > 0 && it.ends > it.starts })
        assertTrue("SS remains hidden consistently with the web edition", (matches + highlights).flatMap { it.sources }.none { it.provider == "SS" })
    }
}
