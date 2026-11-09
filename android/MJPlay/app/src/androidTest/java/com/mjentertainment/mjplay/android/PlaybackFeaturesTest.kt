package com.mjentertainment.mjplay.android

import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class PlaybackFeaturesTest {
    private fun repo() = Repository(InstrumentationRegistry.getInstrumentation().targetContext)

    @Test fun captionsFollowOffsetsAndBackwardSeeks() {
        val cues = listOf(Caption(1.0, 2.0, "First"), Caption(3.0, 4.0, "Second"))
        assertEquals("First", captionAt(cues, 1500, 0f))
        assertEquals("", captionAt(cues, 1500, 1f))
        assertEquals("First", captionAt(cues, 2500, 1f))
        assertEquals("Second", captionAt(cues, 2500, -1f))
        assertEquals("First", captionAt(cues, 1500, 0f))
        assertEquals("", captionAt(cues, 4000, 0f))
    }

    @Test fun guideDropsExpiredShowsAndPreservesUpcoming() {
        val rows = listOf(Programme(1, 10, "Expired"), Programme(10, 20, "Now"), Programme(20, 30, "Next"))
        assertEquals(listOf("Now", "Next"), guideWindow(rows, 15).map { it.title })
    }

    @Test fun actorTrailersAndCrossSeasonUseRealCatalogue() = runBlocking {
        val repo = repo(); assertTrue(repo.connected)
        val person = repo.people("Jack Black", 1).people.first { it.name == "Jack Black" }
        val credits = repo.filmography(person)
        assertTrue(credits.any { it.type == "movie" }); assertTrue(credits.any { it.type == "tv" })
        assertEquals(credits.size, credits.map { it.key }.distinct().size)
        val show = Title(1434, "tv", "Family Guy")
        assertTrue(repo.trailer(show)?.matches(Regex("[-\\w]{11}")) == true)
        val last = repo.episodes(show, 1).maxOf { it.number }
        val next = repo.nextEpisode(show, 1, last)
        assertNotNull(next); assertEquals(2, next!!.season); assertEquals(1, next.episode)
        assertNotNull(repo.nextEpisode(show, 1, 1))
    }

    @Test fun englishAndLiveGuideUseExistingServices() = runBlocking {
        val repo = repo()
        val captions = repo.english(Title(1434, "tv", "Family Guy"), 1, 1, 1351000)
        assertTrue(captions.cues.isNotEmpty())
        assertTrue(captions.cues.all { it.end > it.start && it.text.isNotBlank() })
        val guide = repo.guide(359)
        assertTrue(guide.isNotEmpty()); assertTrue(guide.all { it.end > System.currentTimeMillis() })
    }
}
