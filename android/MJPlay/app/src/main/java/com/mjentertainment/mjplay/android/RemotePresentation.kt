package com.mjentertainment.mjplay.android

import android.content.Context
import android.content.Intent
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject

data class CommunityLink(val platform: String, val label: String, val url: String)
data class DrawerHeader(val tagline: String = "Your world. Press play.", val image: String = "")
data class SupportContent(val email: String = "", val helpUrl: String = "", val text: String = "")
data class Announcement(val id: String = "", val title: String = "", val message: String = "", val url: String = "", val button: String = "Learn more", val dismissible: Boolean = true, val expires: Long = 0)
data class Presentation(val links: List<CommunityLink> = emptyList(), val header: DrawerHeader = DrawerHeader(), val support: SupportContent = SupportContent(), val announcement: Announcement = Announcement())

object RemotePresentation {
    val defaults = mapOf("community_links" to "[]", "drawer_header" to "{\"tagline\":\"Your world. Press play.\",\"image_url\":\"\"}", "support_content" to "{}", "announcement" to "{\"enabled\":false}")
    private val platforms = setOf("facebook", "instagram", "telegram", "whatsapp", "tiktok", "x", "youtube", "website")
    fun https(value: String): String {
        if(value.isBlank()) return ""
        require(value.length <= 2048)
        val uri = java.net.URI(value)
        require(uri.scheme == "https" && !uri.host.isNullOrBlank() && uri.rawUserInfo == null && (uri.port == -1 || uri.port == 443))
        return value
    }
    fun validate(key: String, raw: String) {
        require(raw.length <= 16000)
        when(key) {
            "community_links" -> { val array=JSONArray(raw); require(array.length() <= 8); val seen=mutableSetOf<String>(); for(i in 0 until array.length()) { val link=array.getJSONObject(i); val platform=link.getString("platform"); require(platform in platforms && seen.add(platform)); if(link.optBoolean("enabled",true)) https(link.getString("url")) } }
            "drawer_header" -> { val j=JSONObject(raw); https(j.optString("image_url")); require(j.optString("tagline").length <= 100) }
            "support_content" -> { val j=JSONObject(raw); https(j.optString("help_url")); val email=j.optString("email"); require(email.isBlank() || email.matches(Regex("[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}"))); require(j.optString("text").length <= 700) }
            "announcement" -> { val j=JSONObject(raw); if(j.optBoolean("enabled")) { require(j.optString("id").isNotBlank() && j.optString("id").length <= 80); require(j.optString("message").isNotBlank() && j.optString("message").length <= 700); https(j.optString("url")); require(j.optLong("expires_at_ms",0) >= 0) } }
            else -> error("Unknown presentation group")
        }
    }
    fun read(values: Map<String,String>): Presentation {
        val links=JSONArray(values.getValue("community_links")); val header=JSONObject(values.getValue("drawer_header")); val support=JSONObject(values.getValue("support_content")); val notice=JSONObject(values.getValue("announcement"))
        return Presentation((0 until links.length()).map { links.getJSONObject(it) }.filter { it.optBoolean("enabled",true) && it.optString("url").isNotBlank() }.map { CommunityLink(it.getString("platform"),it.optString("label").ifBlank { it.getString("platform").replaceFirstChar(Char::uppercase) }.take(40),it.getString("url")) }, DrawerHeader(header.optString("tagline","Your world. Press play."),header.optString("image_url")), SupportContent(support.optString("email"),support.optString("help_url"),support.optString("text")), if(notice.optBoolean("enabled")) Announcement(notice.getString("id"),notice.optString("title","MJ Play").take(80),notice.getString("message"),notice.optString("url"),notice.optString("button","Learn more").take(40),notice.optBoolean("dismissible",true),notice.optLong("expires_at_ms",0)) else Announcement())
    }
    fun open(context: Context, url: String) = runCatching { context.startActivity(Intent(Intent.ACTION_VIEW,Uri.parse(https(url)))) }.isSuccess
}
