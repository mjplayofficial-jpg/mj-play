package com.mjentertainment.mjplay.android
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
class VodCandidatePolicyTest {
    @Test fun emptyOrionFallsBackWithoutAcceptingOtherLanguagesOrEmbeds() {
        val data=JSONObject("""{"Orion":{"url":"","type":""},"Luna":{"url":"encoded","type":"hls","language":"English"},"Hindi":{"url":"other","type":"hls","language":"Hindi"},"Embed":{"url":"page","type":"iframe","language":"English"}}""")
        assertEquals(listOf("Luna"),VodCandidatePolicy.candidates(data).map { it.name })
    }
    @Test fun boundedDeduplicatedAndNativeSourceRetainsPriority() {
        val data=JSONObject()
        for(name in listOf("A","B","C","D","Orion")) data.put(name,JSONObject().put("url",name).put("type","hls").put("language","en"))
        data.put("Copy",JSONObject().put("url","Orion").put("type","hls").put("language","English"))
        val result=VodCandidatePolicy.candidates(data)
        assertEquals(3,result.size);assertEquals("Orion",result.first().name);assertEquals(result.size,result.map { it.encoded }.distinct().size)
    }
    @Test fun playlistRangeResponsesStillRequireAnActualManifest() {
        assertTrue(VodPlaylistPolicy.successful(200))
        assertTrue(VodPlaylistPolicy.successful(206))
        assertFalse(VodPlaylistPolicy.successful(302))
        assertFalse(VodPlaylistPolicy.successful(403))
        assertTrue(VodPlaylistPolicy.isPlaylist("\uFEFF  #EXTM3U\n#EXT-X-VERSION:3"))
        assertFalse(VodPlaylistPolicy.isPlaylist("<html>Access denied</html>"))
        assertFalse(VodPlaylistPolicy.isPlaylist("#EXTM3U-fake"))
    }
}
