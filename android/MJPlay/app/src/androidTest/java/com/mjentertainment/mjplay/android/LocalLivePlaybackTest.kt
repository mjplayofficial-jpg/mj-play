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
class LocalLivePlaybackTest {
    @Test fun deviceProcessesLiveMedia() = playLive(false)

    @Test fun devicePlaysDirectHls() = playLive(true)

    private fun playLive(direct: Boolean) {
        val instrumentation=InstrumentationRegistry.getInstrumentation()
        val args=InstrumentationRegistry.getArguments()
        val channel=args.getString("channel")?.toIntOrNull() ?: 339
        val seconds=(args.getString("seconds")?.toLongOrNull() ?: 65L).coerceIn(35,5400)
        val scenario=ActivityScenario.launch(LocalLiveProofActivity::class.java)
        val ready=CountDownLatch(1); lateinit var surface: SurfaceView
        var player: ExoPlayer?=null; val frames=AtomicBoolean(); val failure=AtomicReference<String?>()
        val transport=LocalLiveDataSource.Factory(channel,LocalLiveConfig.hosts)
        val url = if (direct) args.getString("directHls") ?: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/master.m3u8"
            else "mjlive://channel/$channel/entry.m3u8"
        val windows = mutableSetOf<Long>()
        var audioBuffers = 0
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
                    .setMediaSourceFactory(if (direct) DefaultMediaSourceFactory(instrumentation.targetContext) else DefaultMediaSourceFactory(transport))
                    .build().apply {
                        setVideoSurfaceView(surface)
                        addListener(object: Player.Listener {
                            override fun onRenderedFirstFrame() { frames.set(true) }
                            override fun onPlayerError(error: PlaybackException) { failure.set(error.errorCodeName) }
                        })
                        setMediaItem(MediaItem.Builder().setUri(url).setMimeType(MimeTypes.APPLICATION_M3U8).build())
                        prepare(); play()
                    }
            }
            val deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(seconds)
            var nextReport=0L
            while(System.nanoTime()<deadline && failure.get()==null) {
                Thread.sleep(500)
                instrumentation.runOnMainSync {
                    player?.let { current ->
                        if (current.isPlaying) playingMs += 500
                        audioBuffers = current.audioDecoderCounters?.renderedOutputBufferCount ?: 0
                        val timeline = current.currentTimeline
                        if (!timeline.isEmpty) windows.add(timeline.getWindow(current.currentMediaItemIndex, Timeline.Window()).positionInFirstPeriodMs)
                    }
                }
                if(System.nanoTime()>nextReport) {
                    nextReport=System.nanoTime()+TimeUnit.SECONDS.toNanos(10)
                    instrumentation.runOnMainSync { android.util.Log.i("MJLocalLive", "tick positionMs=${player?.currentPosition} state=${player?.playbackState} playing=${player?.isPlaying} ready=${player?.playWhenReady} bufferedMs=${player?.totalBufferedDuration}") }
                }
            }
            var position=0L
            var state=""
            val stats=transport.proofStats()
            instrumentation.runOnMainSync { position=player?.currentPosition ?: 0; state="positionMs=$position playingMs=$playingMs state=${player?.playbackState} playing=${player?.isPlaying} bufferedMs=${player?.totalBufferedDuration} frames=${player?.videoDecoderCounters?.renderedOutputBufferCount} sourceBytes=${stats.first} segments=${stats.second} tokenRefreshes=${stats.third} audioBuffers=$audioBuffers liveWindows=${windows.size}" }
            instrumentation.sendStatus(0,android.os.Bundle().apply { putString("stream","Local playback: $state\n") })
            assertNull("Local media playback failed",failure.get())
            assertTrue("Device must render video",frames.get())
            assertTrue("Must actually play beyond initial token lifetime: $state",playingMs>30_000)
            if (direct) {
                assertTrue("Must decode audio: $state", audioBuffers > 0)
                assertTrue("Live playlist window must advance: $state", windows.size > 1)
            } else assertTrue("Must renew the source token: $state",stats.third>=2)
        } finally {
            instrumentation.runOnMainSync { player?.release() }
            scenario.close()
        }
    }
}
