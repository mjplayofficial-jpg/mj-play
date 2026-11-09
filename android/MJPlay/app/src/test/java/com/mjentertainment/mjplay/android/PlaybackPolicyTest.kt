package com.mjentertainment.mjplay.android

import org.junit.Assert.*
import org.junit.Test

class PlaybackPolicyTest {
    @Test fun resumeStaysWithinTheCorrectEpisode() {
        val saved=SavedProgress(42000,600000,2,3)
        assertEquals(42000L,resumePosition(saved,2,3))
        assertEquals(0L,resumePosition(saved,2,4))
        assertEquals(0L,resumePosition(SavedProgress(599000,600000,2,3),2,3))
        assertEquals(0L,resumePosition(SavedProgress(0,0,2,4),2,4))
    }
    @Test fun transientErrorsCanRecoverButDecoderErrorsCannot() {
        assertTrue(recoverablePlayback(403,2004))
        assertTrue(recoverablePlayback(null,2002))
        assertFalse(recoverablePlayback(429,2004))
        assertFalse(recoverablePlayback(null,4001))
    }
    @Test fun gridsAdaptWithoutTinyPhoneCards() {
        assertEquals(2,browseColumns(390)); assertEquals(3,browseColumns(700)); assertEquals(4,browseColumns(1100))
    }
    @Test fun updateManifestCannotPointAtAnotherAccountOrPlainHttp() {
        assertEquals("https://james00bong.github.io/mjplay-downloads/android.json",AppUpdates.validateManifest("https://james00bong.github.io/mjplay-downloads/android.json"))
        for(url in listOf("http://james00bong.github.io/mjplay-downloads/android.json","https://evil.github.io/mjplay-downloads/android.json","https://james00bong.github.io:443/mjplay-downloads/android.json")) {
            assertTrue(runCatching { AppUpdates.validateManifest(url) }.isFailure)
        }
    }
}
