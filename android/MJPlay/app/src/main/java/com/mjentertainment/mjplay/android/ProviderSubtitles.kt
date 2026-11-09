package com.mjentertainment.mjplay.android

import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URI

internal object ProviderSubtitles {
    private fun read(raw: String): String {
        val uri=URI(raw.replace(" ","%20"))
        require(uri.scheme=="https" && uri.host in setOf("sub.vdrk.site","cache.vdrk.site") && uri.port==-1 && uri.userInfo==null)
        val c=uri.toURL().openConnection() as HttpURLConnection
        c.connectTimeout=8000;c.readTimeout=10000;c.instanceFollowRedirects=false
        try {
            if(c.responseCode!=200)throw SourceHttpException(c.responseCode)
            return c.inputStream.use { input ->
                val out=java.io.ByteArrayOutputStream();val buffer=ByteArray(8192)
                while(true){if(Thread.currentThread().isInterrupted)throw java.util.concurrent.CancellationException();val n=input.read(buffer);if(n<0)break;require(out.size()+n<=2000000);out.write(buffer,0,n)}
                out.toString("UTF-8")
            }
        }finally{c.disconnect()}
    }
    fun english(item: Title, season: Int, episode: Int, alternate: Boolean): EnglishCaptions {
        require(item.type in listOf("movie","tv") && item.id>0 && season in 1..9999 && episode in 1..9999)
        val path=item.key+if(item.type=="tv")"/$season/$episode" else ""
        val a=JSONArray(read("https://sub.vdrk.site/v2/$path"))
        val english=(0 until a.length()).map { a.getJSONObject(it) }.filter { it.optString("label").startsWith("English",true) }
            .sortedBy { if(it.optString("label").contains(Regex("SDH|CC",RegexOption.IGNORE_CASE)))1 else 0 }
        val chosen=english.getOrNull(if(alternate)1 else 0) ?: error(if(alternate)"No other provider English track available" else "No provider English track available")
        val cues=parse(read(chosen.getString("file")))
        check(cues.isNotEmpty()) { "English track was empty" }
        return EnglishCaptions(cues,"Provider English · ${chosen.optString("label")}")
    }
    fun parse(raw: String): List<Caption> {
        require(raw.length<=2000000)
        fun stamp(s: String): Double = s.replace(',','.').split(':').fold(0.0){sum,p->sum*60+p.toDouble()}
        return raw.removePrefix("\uFEFF").replace("\r","").split(Regex("""\n\s*\n""")).mapNotNull { block ->
            val lines=block.lines();val index=lines.indexOfFirst { it.contains("-->") };if(index<0)return@mapNotNull null
            val match=Regex("^\\s*((?:\\d+:)?\\d{2}:\\d{2}[.,]\\d{3})\\s*-->\\s*((?:\\d+:)?\\d{2}:\\d{2}[.,]\\d{3})").find(lines[index]) ?: return@mapNotNull null
            val start=stamp(match.groupValues[1]);val end=stamp(match.groupValues[2])
            val text=android.text.Html.fromHtml(lines.drop(index+1).joinToString("\n").replace("\n","<br>"),android.text.Html.FROM_HTML_MODE_LEGACY).toString().trim().take(1500)
            if(start.isFinite() && end.isFinite() && start>=0 && end>start && end<604800 && text.isNotBlank())Caption(start,end,text)else null
        }.sortedBy { it.start }.take(20000)
    }
}


