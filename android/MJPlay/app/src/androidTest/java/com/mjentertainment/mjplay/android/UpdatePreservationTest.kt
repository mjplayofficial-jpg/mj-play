package com.mjentertainment.mjplay.android

import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test

/** Run seed on the old APK, install -r the new APK, then run verify. */
class UpdatePreservationTest {
    private fun prefs()=InstrumentationRegistry.getInstrumentation().targetContext.getSharedPreferences("mj-upgrade-proof",0)
    @Test fun seedBeforeUpgrade() { assertTrue(prefs().edit().putString("sentinel","saved-before-update").commit()) }
    @Test fun verifyAfterUpgrade() {
        assertEquals("saved-before-update",prefs().getString("sentinel",null))
        prefs().edit().clear().commit()
    }
}
