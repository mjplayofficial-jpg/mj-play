package com.mjentertainment.mjplay.android

import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class ResumePersistenceTest {
    @Test fun movieCollectionAndRecommendationsUseCatalogue() = runBlocking {
        val r=Repository(InstrumentationRegistry.getInstrumentation().targetContext)
        val movie=Title(155,"movie","The Dark Knight")
        val collection=r.collection(movie)
        assertTrue(collection.any { it.id==155 })
        assertTrue(collection.any { it.id==272 })
        assertTrue(collection.any { it.id==49026 })
        assertEquals(collection.map { it.year }.sorted(),collection.map { it.year })
        assertTrue(r.related(movie).isNotEmpty())
        assertTrue(r.collection(Title(1434,"tv","Family Guy")).isEmpty())
    }
    @Test fun progressNextEpisodeAndListSurviveRepositoryRecreation() {
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        val item=Title(999998,"tv","Persistence test")
        val r=Repository(context)
        try {
            r.save(item,42000,600000,1,1)
            if(!r.isSaved(item))r.toggleSaved(item)
            val fresh=Repository(context)
            assertEquals(42000L,fresh.progress(item)!!.position)
            assertTrue(fresh.isSaved(item))
            fresh.queueNext(item,NextEpisode(1,2,"Next"))
            val next=Repository(context)
            assertEquals(2,next.progress(item)!!.episode)
            assertTrue(next.continueWatching().any { it.key==item.key })
            next.save(item,599000,600000,1,2)
            assertFalse(Repository(context).continueWatching().any { it.key==item.key })
            assertTrue(next.isSaved(item))
        } finally {
            context.getSharedPreferences("mj-progress",0).edit().remove(item.key).remove("list/${item.key}").remove("title/${item.key}").remove("updated/${item.key}").commit()
        }
    }
    @Test fun nextEpisodeCrossesSeasonBoundary() = runBlocking {
        val r=Repository(InstrumentationRegistry.getInstrumentation().targetContext)
        val show=Title(1434,"tv","Family Guy")
        val last=r.episodes(show,1).maxOf { it.number }
        val next=r.nextEpisode(show,1,last)
        assertEquals(2,next!!.season); assertEquals(1,next.episode)
    }
}
