package com.mjentertainment.mjplay.android

import org.junit.Assert.*
import org.junit.Test

class PreparedLiveRoutingTest {
    @Test fun eachAdmittedChannelKeepsItsOwnIdentity() {
        for (id in listOf(1, 38, 349, 339, 999999)) {
            val source = PreparedLiveTransportFactory.candidate(id)!!
            assertEquals("mjproof://channel/$id/index.m3u8", source.url)
            assertEquals(LiveTransport.PREPARED_HLS, source.transport)
        }
        assertNull(PreparedLiveTransportFactory.candidate(0))
        assertNull(PreparedLiveTransportFactory.candidate(1000000))
    }
}
