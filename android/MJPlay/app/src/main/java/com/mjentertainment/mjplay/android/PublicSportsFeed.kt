package com.mjentertainment.mjplay.android

import org.json.JSONObject
import java.net.URI
import java.time.Instant

/** Parse only supported public WS/YouTube sources. Never ship the private sports cipher. */
internal object PublicSportsFeed {
    private const val BLOG="9205612625018620342"
    val categories=setOf("Match","Highlights","football","basketball","tennis","cricket","baseball","rugby","american-football","ice-hockey","ufc","motorsport")
    fun url(category: String): String {
        require(category in categories)
        return "https://www.blogger.com/feeds/9205612625018620342/posts/default/-/$category?alt=json&max-results=150&orderby=published"
    }
    private fun text(j: JSONObject?,key: String)=j?.optString(key)?.takeUnless { it=="null" }?.trim()?.take(250) ?: ""
    private fun image(raw: String): String = runCatching { val u=URI(raw); require(u.scheme=="https" && !u.host.isNullOrBlank() && u.rawUserInfo==null && u.port==-1); raw }.getOrDefault("")
    fun parse(raw: String): List<SportsEvent> {
        require(raw.length<=8*1024*1024)
        val feed=JSONObject(raw).getJSONObject("feed")
        require(feed.optJSONObject("id")?.optString("\$t")?.endsWith("blog-$BLOG")==true)
        val entries=feed.optJSONArray("entry") ?: return emptyList()
        require(entries.length()<=150)
        return (0 until entries.length()).mapNotNull { n -> runCatching { event(entries.getJSONObject(n)) }.getOrNull() }
    }
    private fun event(post: JSONObject): SportsEvent? {
        val html=post.optJSONObject("content")?.optString("\$t") ?: return null
        val payload=Regex("<script\\b[^>]*\\bid=[\"']__STR34M_X_D4T4__[\"'][^>]*>([\\s\\S]*?)</script>",RegexOption.IGNORE_CASE).find(html)?.groupValues?.get(1) ?: return null
        require(payload.length<=150000)
        val data=JSONObject(payload); require(data.optString("module")=="MIC")
        val id=Regex("post-([0-9]+)$").find(post.getJSONObject("id").getString("\$t"))?.groupValues?.get(1) ?: return null
        val ev=data.getJSONObject("event"); val starts=Instant.parse(ev.getString("starts")).toEpochMilli(); val ends=Instant.parse(ev.getString("ends")).toEpochMilli()
        require(ends>starts && ends-starts<=172800000)
        val a=data.getJSONArray("servers"); require(a.length()<=100)
        val sources=(0 until a.length()).mapNotNull { index -> runCatching { source(a.getJSONObject(index),index) }.getOrNull() }.distinctBy { "${it.kind}/${if(it.kind=="channel") it.channel.toString() else it.videoKey}" }
        val labels=post.optJSONArray("category")
        val highlight=(0 until (labels?.length() ?: 0)).any { labels!!.getJSONObject(it).optString("term")=="Highlights" } || ev.optString("status")=="Highlights" || !data.optBoolean("is_live",true) && sources.any { it.kind=="youtube" }
        val match=ev.optJSONObject("match")
        fun team(key: String): SportsTeam { val t=match?.optJSONObject(key); return SportsTeam(text(t,"name"),image(text(t,"logo"))) }
        return SportsEvent(id,text(data,"title").ifBlank { text(post.optJSONObject("title"),"\$t") },starts,ends,highlight,text(match?.optJSONObject("league"),"name"),team("home"),team("away"),image(data.optString("thumb")),sources)
    }
    private fun source(j: JSONObject,index: Int): SportsSource? {
        val provider=j.optString("fb_id"); val number=j.optInt("id",0).takeIf { it in 1..999 } ?: Regex("server\\s*([0-9]+)",RegexOption.IGNORE_CASE).find(j.optString("title"))?.groupValues?.get(1)?.toIntOrNull()?.takeIf { it in 1..999 } ?: index+1
        // Unsupported encrypted providers remain visible without disclosing or needing cipher keys.
        if(provider in setOf("SS","S8")) return SportsSource(provider,number,"embed",0,provider+number)
        val u=URI(j.getString("url")); require(u.scheme=="https" && u.rawUserInfo==null && u.port==-1)
        if(provider=="WS_DDL" && u.host in setOf("wsdss.mp","dlive.sx","dembed.st")) {
            val id=Regex("^/stream/stream-([1-9][0-9]{0,5})\\.php$").matchEntire(u.path)?.groupValues?.get(1)
                ?: if(u.path=="/premiumtv/daddy.php") u.rawQuery?.split('&')?.firstOrNull { it.startsWith("id=") }?.substringAfter('=') else null
            if(id?.matches(Regex("[1-9][0-9]{0,5}"))==true) return SportsSource(provider,number,"channel",id.toInt(),"")
        }
        if(provider=="YT" && u.host in setOf("youtube.com","www.youtube.com","www.youtube-nocookie.com","youtu.be")) {
            val key=if(u.host=="youtu.be") u.path.drop(1) else Regex("^/embed/([-\\w]{11})$").matchEntire(u.path)?.groupValues?.get(1) ?: u.rawQuery?.split('&')?.firstOrNull { it.startsWith("v=") }?.substringAfter('=')
            if(key?.matches(Regex("[-\\w]{11}"))==true) return SportsSource(provider,number,"youtube",0,key)
        }
        return null
    }
}

