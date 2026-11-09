package com.mjentertainment.mjplay.android
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class PublicSportsFeedTest {
    private fun post(url: String="https://wsdss.mp/stream/stream-38.php"): JSONObject {
        val data=JSONObject().put("module","MIC").put("title","Test match").put("is_live",true).put("event",JSONObject().put("starts","2026-10-29T12:00:00Z").put("ends","2026-10-29T14:00:00Z").put("match",JSONObject())).put("servers",JSONArray().put(JSONObject().put("fb_id","WS_DDL").put("id",4).put("url",url)))
        return JSONObject().put("id",JSONObject().put("\$t","tag:blogger.com,1999:blog-9205612625018620342.post-123")).put("content",JSONObject().put("\$t","<script id=\"__STR34M_X_D4T4__\">$data</script>"))
    }
    private fun feed(post: JSONObject)=JSONObject().put("feed",JSONObject().put("id",JSONObject().put("\$t","tag:blogger.com,1999:blog-9205612625018620342")).put("entry",JSONArray().put(post))).toString()
    @Test fun publicFeedPreservesChannelAndServerNumber() { val event=PublicSportsFeed.parse(feed(post())).single(); assertEquals("123",event.id);assertEquals(38,event.sources.single().channel);assertEquals(4,event.sources.single().serverNumber) }
    @Test fun invalidSourceAndCategoryCannotBecomeArbitraryRequests() { assertTrue(PublicSportsFeed.parse(feed(post("https://evil.test/stream/stream-38.php"))).single().sources.isEmpty());assertThrows(IllegalArgumentException::class.java) { PublicSportsFeed.url("../private") } }
    @Test fun catalogueHostMustBeDedicatedWorker() { assertEquals("https://mjplay-catalogue.jmssika1997.workers.dev",CatalogueEndpoint.validate("https://mjplay-catalogue.jmssika1997.workers.dev/"));listOf("https://evil.test","http://mjplay-catalogue.example.workers.dev","https://user@mjplay-catalogue.example.workers.dev","https://mjplay-catalogue.example.workers.dev/x").forEach { assertThrows(IllegalArgumentException::class.java) { CatalogueEndpoint.validate(it) } } }
}
