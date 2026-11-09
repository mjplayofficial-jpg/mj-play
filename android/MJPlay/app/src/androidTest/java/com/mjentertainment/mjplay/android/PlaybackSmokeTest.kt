package com.mjentertainment.mjplay.android

import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlaybackException
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.core.app.ActivityScenario
import android.view.SurfaceHolder
import android.view.SurfaceView
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** On-device test. Credentials are provisioned into app-private storage, never test source/APKs. */
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class PlaybackSmokeTest {
    @Test fun realSourcesDecodeAndAdvance() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val repo = Repository(context)
        val credential = File(context.filesDir, "preview-test-password")
        if (credential.exists()) { val password = credential.readText().trim(); credential.delete(); repo.connect(password) }
        check(repo.connected) { "Provision the private preview session before this on-device test." }
        val movies = repo.browse("movie")
        assertTrue("Catalogue should return movie titles", movies.isNotEmpty())
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        lateinit var videoSurface: SurfaceView
        val surfaceReady = CountDownLatch(1)
        scenario.onActivity { activity ->
            videoSurface = SurfaceView(activity)
            videoSurface.holder.addCallback(object : SurfaceHolder.Callback {
                override fun surfaceCreated(holder: SurfaceHolder) { surfaceReady.countDown() }
                override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {}
                override fun surfaceDestroyed(holder: SurfaceHolder) {}
            })
            activity.setContentView(videoSurface)
        }
        assertTrue("A real phone video surface must be ready", surfaceReady.await(15, TimeUnit.SECONDS))
        val cases: List<Pair<String, suspend () -> Stream>> = listOf(
            "movie" to { repo.stream(Title(155, "movie", "The Dark Knight"), 1, 1) },
            "episode" to { repo.stream(Title(1396, "tv", "Breaking Bad"), 1, 1) },
            "live" to { repo.live(Channel(38, "Sky Sports Main Event", "", emptyList())) }
        )
        val failures = mutableListOf<String>()
        for ((name, resolve) in cases) {
            try {
                val source = resolve()
                val latch = CountDownLatch(1)
                var player: ExoPlayer? = null
                var frames = false
                var advanced = false
                var errorCode: String? = null
                instrumentation.runOnMainSync {
                    val factory = DefaultHttpDataSource.Factory().setDefaultRequestProperties(mapOf("Authorization" to repo.authorization!!)).setConnectTimeoutMs(25_000).setReadTimeoutMs(35_000)
                    player = ExoPlayer.Builder(context).setRenderersFactory(DefaultRenderersFactory(context).setEnableDecoderFallback(true)).setMediaSourceFactory(DefaultMediaSourceFactory(factory)).build().apply {
                        addListener(object : Player.Listener {
                            override fun onRenderedFirstFrame() { frames = true }
                            override fun onPlayerError(error: PlaybackException) { val format=(error as? ExoPlaybackException)?.rendererFormat;errorCode = "${error.errorCodeName} codec=${format?.codecs} size=${format?.width}x${format?.height} cause=${error.cause?.javaClass?.simpleName}"; latch.countDown() }
                        })
                        setMediaItem(MediaItem.Builder().setUri(source.url).apply { if (source.hls) setMimeType(MimeTypes.APPLICATION_M3U8) }.build())
                        setVideoSurfaceView(videoSurface)
                        prepare(); playWhenReady = true
                    }
                }
                val deadline = System.currentTimeMillis() + 65_000
                while (System.currentTimeMillis() < deadline && errorCode == null && !advanced) {
                    latch.await(1, TimeUnit.SECONDS)
                    instrumentation.runOnMainSync { advanced = frames && (player?.currentPosition ?: 0) > 2500 }
                }
                instrumentation.runOnMainSync { player?.release() }
                if (!advanced) failures.add("$name: ${errorCode ?: "no advancing video within 65s"}")
            } catch (_: Exception) { failures.add("$name: source preparation failed") }
        }
        scenario.close()
        assertTrue("Playback verification: ${failures.joinToString("; ")}", failures.isEmpty())
    }
}

