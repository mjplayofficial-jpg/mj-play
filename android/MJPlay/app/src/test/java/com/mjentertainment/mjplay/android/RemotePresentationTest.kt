package com.mjentertainment.mjplay.android

import org.junit.Assert.*
import org.junit.Test

class RemotePresentationTest {
    @Test fun defaultsKeepRemoteContentHidden() {
        RemotePresentation.defaults.forEach { (key,value) -> RemotePresentation.validate(key,value) }
        val config=RemotePresentation.read(RemotePresentation.defaults)
        assertTrue(config.links.isEmpty()); assertEquals("",config.header.image); assertEquals("",config.announcement.id)
    }
    @Test fun linksKeepOrderAndSkipDisabledEntries() {
        val raw="""[{"platform":"telegram","url":"https://t.me/example","label":"Join us"},{"platform":"youtube","url":"https://youtube.com/example","enabled":false}]"""
        RemotePresentation.validate("community_links",raw)
        val config=RemotePresentation.read(RemotePresentation.defaults + ("community_links" to raw))
        assertEquals(listOf("telegram"),config.links.map { it.platform }); assertEquals("Join us",config.links.single().label)
    }
    @Test fun invalidLinksAndMalformedGroupsAreRejected() {
        listOf("javascript:alert(1)","http://example.com","https://user:pass@example.com","https://example.com:8443").forEach { url -> assertTrue(runCatching { RemotePresentation.https(url) }.isFailure) }
        assertTrue(runCatching { RemotePresentation.validate("community_links","not json") }.isFailure)
        assertTrue(runCatching { RemotePresentation.validate("community_links","""[{"platform":"unknown","url":"https://example.com"}]""") }.isFailure)
        assertTrue(runCatching { RemotePresentation.validate("support_content","""{"email":"a@example.com\nBcc:spam@example.com"}""") }.isFailure)
    }
    @Test fun enabledAnnouncementsRequireStableIdentityAndMessage() {
        assertTrue(runCatching { RemotePresentation.validate("announcement","""{"enabled":true,"message":"Hello"}""") }.isFailure)
        val raw="""{"enabled":true,"id":"notice-1","title":"News","message":"Hello","expires_at_ms":1900000000000,"dismissible":true}"""
        RemotePresentation.validate("announcement",raw)
        val notice=RemotePresentation.read(RemotePresentation.defaults + ("announcement" to raw)).announcement
        assertEquals("notice-1",notice.id); assertEquals(1900000000000,notice.expires)
    }
}
