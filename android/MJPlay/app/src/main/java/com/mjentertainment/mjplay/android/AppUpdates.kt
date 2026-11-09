package com.mjentertainment.mjplay.android

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

data class AppUpdate(val code: Long, val version: String, val url: String, val hash: String, val size: Long, val notes: String, val required: Boolean)
object AppUpdates {
    var manifest = "$BACKEND/downloads/android.json"
    fun validateManifest(value: String): String {
        val u=java.net.URI(value); require(u.scheme=="https" && u.port==-1 && u.userInfo==null && u.fragment==null && u.query==null)
        require((u.host==java.net.URI(BACKEND).host && u.path=="/downloads/android.json") || (u.host=="james00bong.github.io" && u.path=="/mjplay-downloads/android.json"))
        return value
    }
    private fun connection(value: String): HttpURLConnection {
        val uri = Uri.parse(value)
        require(uri.scheme == "https" && uri.host == Uri.parse(manifest).host && uri.port == -1 && uri.query == null && uri.fragment == null && uri.path?.startsWith(Uri.parse(manifest).path!!.substringBeforeLast("/")+"/") == true && uri.userInfo == null) { "Untrusted update address." }
        return (URL(value).openConnection() as HttpURLConnection).apply { connectTimeout = 15000; readTimeout = 30000; instanceFollowRedirects = false }
    }
    suspend fun check(context: Context): AppUpdate? = withContext(Dispatchers.IO) {
        if (BuildConfig.DEBUG) return@withContext null // Preview and public builds have different signing identities.
        val c = connection(manifest)
        try {
            check(c.responseCode == 200) { "Update service unavailable." }
            val raw = c.inputStream.use { input -> val out=java.io.ByteArrayOutputStream();val buffer=ByteArray(4096);while(true){val n=input.read(buffer);if(n<0)break;require(out.size()+n<=65536);out.write(buffer,0,n)};out.toByteArray() }
            val j = JSONObject(raw.toString(Charsets.UTF_8))
            val code = j.getLong("versionCode")
            if (code <= BuildConfig.VERSION_CODE || j.getString("packageName") != context.packageName) return@withContext null
            val url = URL(URL(manifest), j.getString("url")).toString(); connection(url).disconnect()
            val hash = j.getString("sha256"); require(hash.matches(Regex("[a-fA-F0-9]{64}")))
            val size = j.getLong("size"); require(size in 1..150_000_000)
            AppUpdate(code, j.getString("versionName").take(40), url, hash, size, j.optString("notes").take(2000), BuildConfig.VERSION_CODE < j.optLong("minVersionCode", 0))
        } finally { c.disconnect() }
    }
    suspend fun download(context: Context, update: AppUpdate, progress: (Float) -> Unit): File = withContext(Dispatchers.IO) {
        val dir = File(context.cacheDir, "updates").apply { mkdirs() }
        val partial = File(dir, "update.part"); val file = File(dir, "update.apk")
        val c = connection(update.url)
        try {
            require(c.responseCode == 200) { "Update download failed. Please retry." }
            val digest = MessageDigest.getInstance("SHA-256"); var count = 0L
            c.inputStream.use { input -> partial.outputStream().use { output ->
                val buffer = ByteArray(65536)
                while (true) { kotlinx.coroutines.currentCoroutineContext().ensureActive(); val n = input.read(buffer); if (n < 0) break; count += n; require(count <= update.size) { "Update size did not match." }; digest.update(buffer,0,n); output.write(buffer,0,n); progress(count.toFloat()/update.size) }
            } }
            require(count == update.size && digest.digest().joinToString("") { "%02x".format(it) }.equals(update.hash,true)) { "Update verification failed. Please retry." }
            verifyPackage(context, partial, update.code)
            if (file.exists()) file.delete(); require(partial.renameTo(file)); file
        } catch (e: Exception) { partial.delete(); throw e } finally { c.disconnect() }
    }
    @Suppress("DEPRECATION")
    private fun verifyPackage(context: Context, file: File, version: Long) {
        val pm = context.packageManager
        val flag = if (Build.VERSION.SDK_INT >= 28) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES
        val apk = pm.getPackageArchiveInfo(file.absolutePath, flag) ?: error("Invalid Android update.")
        val installed = pm.getPackageInfo(context.packageName, flag)
        require(apk.packageName == context.packageName && (if (Build.VERSION.SDK_INT >= 28) apk.longVersionCode else apk.versionCode.toLong()) == version) { "This update is for a different app or version." }
        val actual = if (Build.VERSION.SDK_INT >= 28) apk.signingInfo?.apkContentsSigners else apk.signatures
        val expected = if (Build.VERSION.SDK_INT >= 28) installed.signingInfo?.apkContentsSigners else installed.signatures
        require(!actual.isNullOrEmpty() && !expected.isNullOrEmpty() && actual.size == expected.size && actual.all { a -> expected.any { a == it } }) { "The update signing certificate did not match MJ Play." }
    }
    fun install(context: Context, file: File) {
        if (!context.packageManager.canRequestPackageInstalls()) {
            context.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:"+context.packageName)))
            return
        }
        val uri = FileProvider.getUriForFile(context, context.packageName+".updates", file)
        context.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri,"application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION))
    }
}

