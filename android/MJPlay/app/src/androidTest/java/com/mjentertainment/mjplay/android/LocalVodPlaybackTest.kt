package com.mjentertainment.mjplay.android

import android.view.SurfaceHolder
import android.view.SurfaceView
import androidx.media3.common.*
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

/** No Repository/API credentials used. Explicit experiment, not part of routine unit tests. */
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class LocalVodPlaybackTest {
    @Test fun devicePlaysTitleWithoutBackend() {
        val instrumentation=InstrumentationRegistry.getInstrumentation()
        val args=InstrumentationRegistry.getArguments()
        val channel=args.getString("channel")?.toIntOrNull() ?: 339
        val seconds=(args.getString("seconds")?.toLongOrNull() ?: 65L).coerceIn(35,5400)
        val scenario=ActivityScenario.launch(LocalLiveProofActivity::class.java)
        val ready=CountDownLatch(1); lateinit var surface: SurfaceView
        var player: ExoPlayer?=null; val frames=AtomicBoolean(); val failure=AtomicReference<String?>()
        val stream=LocalVodResolver.resolve(Title(args.getString("titleId")?.toIntOrNull() ?: 1434,"tv","Playback test"),1,1)
        val captions=ProviderSubtitles.english(Title(args.getString("titleId")?.toIntOrNull() ?: 1434,"tv","Playback test"),1,1,false)
        assertTrue("Provider English cues",captions.cues.isNotEmpty())
        val subtitleFile=java.io.File(instrumentation.targetContext.cacheDir,"subtitle-proof.vtt").apply { writeText("WEBVTT\n\n00:00:02.000 --> 00:00:06.000\nSubtitle clock proof\n\n00:00:10.000 --> 00:00:20.000\nSeek clock proof\n") }
        val seen=java.util.concurrent.ConcurrentHashMap.newKeySet<String>()
        val transport=androidx.media3.datasource.DefaultHttpDataSource.Factory().setDefaultRequestProperties(mapOf("Origin" to "https://vidrock.to","Referer" to "https://vidrock.to/"))
        var playingMs=0L
        try {
            scenario.onActivity { activity ->
                activity.window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                surface=SurfaceView(activity)
                surface.holder.addCallback(object: SurfaceHolder.Callback {
                    override fun surfaceCreated(holder: SurfaceHolder) { ready.countDown() }
                    override fun surfaceChanged(holder: SurfaceHolder,format: Int,width: Int,height: Int) {}
                    override fun surfaceDestroyed(holder: SurfaceHolder) {}
                }); activity.setContentView(surface)
            }
            assertTrue("Video surface ready",ready.await(15,TimeUnit.SECONDS))
            instrumentation.runOnMainSync {
                player=ExoPlayer.Builder(instrumentation.targetContext)
                    .setMediaSourceFactory(DefaultMediaSourceFactory(androidx.media3.datasource.DefaultDataSource.Factory(instrumentation.targetContext,transport)))
                    .build().apply {
                        setVideoSurfaceView(surface)
                        addListener(object: Player.Listener {
                            override fun onCues(cueGroup: androidx.media3.common.text.CueGroup) { cueGroup.cues.forEach { seen.add(it.text.toString()) } }
                            override fun onRenderedFirstFrame() { frames.set(true) }
                            override fun onPlayerError(error: PlaybackException) { failure.set(error.errorCodeName) }
                        })
                        setMediaItem(MediaItem.Builder().setUri(stream.url).setMimeType(MimeTypes.APPLICATION_M3U8).setSubtitleConfigurations(listOf(MediaItem.SubtitleConfiguration.Builder(android.net.Uri.fromFile(subtitleFile)).setMimeType(MimeTypes.TEXT_VTT).setLanguage("en").setSelectionFlags(C.SELECTION_FLAG_DEFAULT).build())).build())
                        prepare(); play()
                    }
            }
            val deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(seconds)
            var nextReport=0L
            while(System.nanoTime()<deadline && failure.get()==null) {
                Thread.sleep(500)
                instrumentation.runOnMainSync { if(player?.isPlaying==true) playingMs+=500 }
                if(System.nanoTime()>nextReport) {
                    nextReport=System.nanoTime()+TimeUnit.SECONDS.toNanos(10)
                    instrumentation.runOnMainSync { android.util.Log.i("MJLocalLive", "tick positionMs=${player?.currentPosition} state=${player?.playbackState} playing=${player?.isPlaying} ready=${player?.playWhenReady} bufferedMs=${player?.totalBufferedDuration}") }
                }
            }
            instrumentation.runOnMainSync { player?.pause() }; Thread.sleep(300)
            var pausedAt=0L; instrumentation.runOnMainSync { pausedAt=player!!.currentPosition }; Thread.sleep(800)
            instrumentation.runOnMainSync { assertEquals("Pause holds subtitle clock",pausedAt,player!!.currentPosition);  assertTrue("Native renderer timed both subtitle cues",seen.contains("Subtitle clock proof") && seen.contains("Seek clock proof")); seen.clear(); val updated=player!!.currentMediaItem!!.buildUpon().setSubtitleConfigurations(listOf(MediaItem.SubtitleConfiguration.Builder(android.net.Uri.fromFile(subtitleFile)).setMimeType(MimeTypes.TEXT_VTT).setLanguage("en").setId("mj-provider-english").setSelectionFlags(C.SELECTION_FLAG_DEFAULT).build())).build(); player!!.setMediaItem(updated,pausedAt); player!!.prepare(); assertTrue("Subtitle attachment preserves position",kotlin.math.abs(player!!.currentPosition-pausedAt)<1000); player!!.seekTo(12000); player!!.play() }
            val seekDeadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(15)
            while(!seen.contains("Seek clock proof") && System.nanoTime()<seekDeadline)Thread.sleep(100)
            assertTrue("Seeking restores correct cue",seen.contains("Seek clock proof"))
            var position=0L
            var state=""
            val stats=Triple(0,0,0)
            instrumentation.runOnMainSync { position=player?.currentPosition ?: 0; state="positionMs=$position playingMs=$playingMs state=${player?.playbackState} playing=${player?.isPlaying} bufferedMs=${player?.totalBufferedDuration} frames=${player?.videoDecoderCounters?.renderedOutputBufferCount} sourceBytes=${stats.first} segments=${stats.second} tokenRefreshes=${stats.third}" }
            instrumentation.sendStatus(0,android.os.Bundle().apply { putString("stream","Local playback: $state\n") })
            assertNull("Local media playback failed",failure.get())
            assertTrue("Device must render video",frames.get())

            assertTrue("Must actually play beyond initial token lifetime: $state",playingMs>30_000)

        } finally {
            instrumentation.runOnMainSync { player?.release() }
            scenario.close()
        }
    }
}






