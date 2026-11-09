package com.mjentertainment.mjplay.android

import android.content.Context
import android.os.Bundle
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.google.firebase.remoteconfig.FirebaseRemoteConfig
import com.google.firebase.remoteconfig.FirebaseRemoteConfigSettings
import kotlinx.coroutines.flow.MutableStateFlow
import com.google.firebase.remoteconfig.ConfigUpdate
import com.google.firebase.remoteconfig.ConfigUpdateListener
import com.google.firebase.remoteconfig.FirebaseRemoteConfigException
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine

data class PublicFlags(val vod: Boolean = true, val live: Boolean = true, val sports: Boolean = true, val maintenance: String = "", val minimumVersion: Long = 0)
object PublicFirebase {
    val flags = MutableStateFlow(PublicFlags())
    val presentation = MutableStateFlow(Presentation())
    private var remote: FirebaseRemoteConfig? = null
    private var applyValues: (() -> Unit)? = null
    private var analytics: FirebaseAnalytics? = null
    private var crash: FirebaseCrashlytics? = null
    private var appContext: Context? = null
    val consent = MutableStateFlow<Boolean?>(null)
    fun initialize(context: Context) {
        if(remote != null) return
        appContext = context.applicationContext
        val prefs = context.getSharedPreferences("mj-diagnostics", Context.MODE_PRIVATE)
        val presentationPrefs = context.getSharedPreferences("mj-presentation", Context.MODE_PRIVATE)
        val saved = RemotePresentation.defaults.mapValues { (key, fallback) -> presentationPrefs.getString(key, fallback) ?: fallback }.toMutableMap()
        saved.keys.toList().forEach { key -> if(runCatching { RemotePresentation.validate(key,saved.getValue(key)) }.isFailure) saved[key] = RemotePresentation.defaults.getValue(key) }
        presentation.value = RemotePresentation.read(saved)
        consent.value = if (prefs.contains("analytics")) prefs.getBoolean("analytics", false) else null
        runCatching {
            analytics = FirebaseAnalytics.getInstance(context)
            analytics?.setAnalyticsCollectionEnabled(consent.value == true)
            analytics?.setConsent(mapOf(FirebaseAnalytics.ConsentType.AD_STORAGE to FirebaseAnalytics.ConsentStatus.DENIED, FirebaseAnalytics.ConsentType.AD_USER_DATA to FirebaseAnalytics.ConsentStatus.DENIED, FirebaseAnalytics.ConsentType.AD_PERSONALIZATION to FirebaseAnalytics.ConsentStatus.DENIED))
            crash = FirebaseCrashlytics.getInstance()
            crash?.setCrashlyticsCollectionEnabled(consent.value == true)
            crash?.setCustomKey("platform", "android")
            val config = FirebaseRemoteConfig.getInstance()
            remote = config
            applyValues = {
                runCatching { CatalogueEndpoint.validate(config.getString("catalogue_api_origin")) }.onSuccess { CatalogueEndpoint.origin = it }
                runCatching { AppUpdates.validateManifest(config.getString("android_update_manifest_url")) }.onSuccess { AppUpdates.manifest = it }
                LocalLiveConfig.enabled = config.getBoolean("android_local_live_enabled")
                runCatching { LocalLiveConfig.parse(config.getString("live_source_config")) }.onSuccess { LocalLiveConfig.hosts = it }
                flags.value = PublicFlags(config.getBoolean("vod_enabled"), config.getBoolean("live_tv_enabled"), config.getBoolean("sports_enabled"), config.getString("maintenance_message").take(240), config.getLong("min_android_version"))
                RemotePresentation.defaults.keys.forEach { key -> val raw=config.getString(key); if(runCatching { RemotePresentation.validate(key,raw) }.isSuccess) { saved[key]=raw; presentationPrefs.edit().putString(key,raw).apply() } }
                presentation.value = RemotePresentation.read(saved)
            }
            config.setConfigSettingsAsync(FirebaseRemoteConfigSettings.Builder().setMinimumFetchIntervalInSeconds(300).setFetchTimeoutInSeconds(8).build())
            config.setDefaultsAsync(mapOf("android_update_manifest_url" to "$BACKEND/downloads/android.json", "vod_enabled" to true, "live_tv_enabled" to true, "sports_enabled" to true, "maintenance_message" to "", "min_android_version" to 0L, "catalogue_api_origin" to CatalogueEndpoint.DEFAULT, "android_local_live_enabled" to true, "live_source_config" to LocalLiveConfig.DEFAULT) + RemotePresentation.defaults).addOnCompleteListener {
                applyValues?.invoke()
                config.fetchAndActivate().addOnCompleteListener { if(it.isSuccessful) applyValues?.invoke() }
                config.addOnConfigUpdateListener(object: ConfigUpdateListener {
                    override fun onUpdate(update: ConfigUpdate) { config.activate().addOnCompleteListener { if(it.isSuccessful) applyValues?.invoke() } }
                    override fun onError(error: FirebaseRemoteConfigException) { /* Keep cached settings; manual refresh remains available. */ }
                })
            }
        }
    }
    suspend fun refresh(force: Boolean = false): Boolean = suspendCancellableCoroutine { continuation ->
        val config=remote
        if(config == null) { continuation.resume(false); return@suspendCancellableCoroutine }
        config.fetch(if(force) 0L else 300L).addOnCompleteListener { fetched ->
            if(!fetched.isSuccessful) { if(continuation.isActive) continuation.resume(false) }
            else config.activate().addOnCompleteListener { activated ->
                if(activated.isSuccessful) applyValues?.invoke()
                if(continuation.isActive) continuation.resume(activated.isSuccessful)
            }
        }
    }
    fun setConsent(enabled: Boolean) {
        appContext?.getSharedPreferences("mj-diagnostics", Context.MODE_PRIVATE)?.edit()?.putBoolean("analytics", enabled)?.apply()
        consent.value = enabled; analytics?.setAnalyticsCollectionEnabled(enabled); crash?.setCrashlyticsCollectionEnabled(enabled)
        if (!enabled) crash?.deleteUnsentReports()
    }
    fun blocked(kind: String): String? {
        val state = flags.value
        if (BuildConfig.VERSION_CODE < state.minimumVersion) return "Please update MJ Play to continue."
        if (state.maintenance.isNotBlank()) return state.maintenance
        return if (when(kind) { "live" -> !state.live; "sport" -> !state.sports; else -> !state.vod }) "This section is temporarily paused for maintenance." else null
    }
    fun event(name: String, kind: String = "unknown", code: Long = 0, duration: Long = 0) {
        if (consent.value != true) return
        val safeKind = kind.takeIf { it in listOf("movie", "tv", "live", "sport", "unknown") } ?: "unknown"
        runCatching { analytics?.logEvent(name, Bundle().apply { putString("content_type", safeKind); if(code > 0) putLong("error_code", code); if(duration > 0) putLong("duration_ms", duration.coerceAtMost(3600000)) }) }
    }
    fun section(name: String) { if(consent.value == true) runCatching { analytics?.logEvent("section_view", Bundle().apply { putString("section", name.takeIf { it in listOf("Home", "Movies", "Shows", "Sports", "Live TV", "Search", "My List") } ?: "Other") }) } }
    fun playbackError(kind: String, code: Int) {
        if (consent.value != true) return
        event("playback_failed", kind, code.toLong())
        // Never forward the original exception: Media3 causes can contain signed URLs.
        runCatching { crash?.recordException(IllegalStateException("Playback failure: ${kind.takeIf { it in listOf("movie", "tv", "live", "sport") } ?: "unknown"}; code=$code")) }
    }
}



