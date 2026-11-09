package com.mjentertainment.mjplay.android

import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import android.content.pm.ActivityInfo
import android.net.Uri
import android.util.Log
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.text.font.FontWeight
import androidx.media3.datasource.HttpDataSource
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.BorderStroke
import kotlinx.coroutines.launch
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.window.DialogWindowProvider
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.media3.common.*
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.PlayerView
import kotlinx.coroutines.delay

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerScreen(item: Title, initialStream: Stream, repo: Repository, season: Int, episode: Int, onBack: () -> Unit, onRetry: () -> Unit, nextLabel: String?, onNext: (() -> Unit)?, onEpisode: (Int) -> Unit = {}, onChannel: (Channel) -> Unit = {}, liveCategory: String = "popular", onLiveCategory: (String) -> Unit = {}, sportsEvent: SportsEvent? = null, onSportsSource: (SportsEvent, SportsSource) -> Unit = { _, _ -> }, autoRecovery: Boolean = true, onMovieTitle: (Title) -> Unit = {}, preparationError: String? = null) {
    var candidateIndex by remember(initialStream) { mutableIntStateOf(0) }
    val candidates = remember(initialStream) { (listOf(initialStream.url) + if(initialStream.localVod) initialStream.alternatives else emptyList()).distinct().take(3) }
    val stream = initialStream.copy(url = candidates[candidateIndex])
    val preparing = stream.url.isBlank()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val activity = context as? ComponentActivity
    var fullscreen by rememberSaveable { mutableStateOf(false) }
    var controls by remember { mutableStateOf(true) }
    var interaction by remember { mutableIntStateOf(0) }
    var settings by remember { mutableStateOf(false) }
    var panel by remember { mutableStateOf("Playback settings") }
    var failure by remember(stream.url) { mutableStateOf<String?>(null) }
    var buffering by remember(stream.url) { mutableStateOf(true) }
    var firstFrameRendered by remember(initialStream) { mutableStateOf(false) }
    var position by remember { mutableLongStateOf(0) }
    var scrub by remember(stream.url) { mutableStateOf<Float?>(null) }
    var duration by remember { mutableLongStateOf(0) }
    var playing by remember { mutableStateOf(true) }
    var autoplay by rememberSaveable { mutableStateOf(repo.autoplayEnabled()) }
    var english by remember { mutableStateOf(repo.englishEnabled() && item.type in listOf("tv", "movie")) }
    var embeddedEnglish by remember { mutableStateOf(false) }
    var captions by remember(stream.url) { mutableStateOf<EnglishCaptions?>(null) }
    var captionBusy by remember { mutableStateOf(false) }
    var captionError by remember { mutableStateOf<String?>(null) }
    var releaseDetails by remember { mutableStateOf(false) }
    var offset by remember(item.key, season, episode) { mutableFloatStateOf(repo.subtitleOffset(item, season, episode)) }
    var episodeList by remember(item.id, season) { mutableStateOf(emptyList<Episode>()) }
    LaunchedEffect(item.id, season) { if (item.type == "tv") episodeList = runCatching { repo.episodes(item, season) }.getOrDefault(emptyList()) }
    var movieCollection by remember(item.key) { mutableStateOf(emptyList<Title>()) }
    var movieRelated by remember(item.key) { mutableStateOf(emptyList<Title>()) }
    var movieSaved by remember(item.key) { mutableStateOf(repo.isSaved(item)) }
    var movieTaste by remember(item.key) { mutableStateOf(repo.taste(item)) }
    LaunchedEffect(item.key) { if(item.type=="movie") kotlinx.coroutines.supervisorScope {
        launch { try { movieCollection=repo.collection(item) } catch(e:kotlinx.coroutines.CancellationException){throw e} catch(_:Exception){} }
        launch { try { movieRelated=repo.related(item).filter { it.key!=item.key }.take(20) } catch(e:kotlinx.coroutines.CancellationException){throw e} catch(_:Exception){} }
    } }
    var guide by remember(item.id) { mutableStateOf(emptyList<Programme>()) }
    var guideExpanded by remember { mutableStateOf(false) }
    var guideBusy by remember { mutableStateOf(false) }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    var marker by remember(stream.url) { mutableStateOf<CreditsMarker?>(null) }
    var introMarker by remember(stream.url) { mutableStateOf<Pair<Long,Long>?>(null) }
    var introDismissed by remember(stream.url) { mutableStateOf(false) }
    LaunchedEffect(duration > 0, stream.url) { if(!preparing && duration>0 && item.type=="tv") introMarker=repo.intro(item,season,episode,duration) }
    var ended by remember(stream.url) { mutableStateOf(false) }
    var nextDismissed by remember(stream.url) { mutableStateOf(false) }
    var transitioned by remember(stream.url) { mutableStateOf(false) }
    var recover by remember { mutableStateOf(false) }
    var recoveryUsed by remember { mutableStateOf(false) }
    val retry by rememberUpdatedState(onRetry)
    var countdown by remember(stream.url) { mutableIntStateOf(10) }
    val nextFocus = remember { FocusRequester() }
    val next by rememberUpdatedState(onNext)
    val auto by rememberUpdatedState(autoplay)
    val channel = remember(item.id) { repo.channels().firstOrNull { it.number == item.id } }
    var favourite by remember(item.id) { mutableStateOf(channel?.let(repo::isFavourite) == true) }
    val player = remember(stream.url) {
        val factory = DefaultHttpDataSource.Factory().setConnectTimeoutMs(25000).setReadTimeoutMs(35000)
        if (stream.localVod) factory.setDefaultRequestProperties(mapOf("Origin" to "https://vidrock.to", "Referer" to "https://vidrock.to/"))
        if (!stream.sample && Uri.parse(stream.url).host == Uri.parse(BACKEND).host) repo.authorization?.let { factory.setDefaultRequestProperties(mapOf("Authorization" to it)) }
        val mediaFactory: androidx.media3.datasource.DataSource.Factory = stream.localChannel?.let { LocalLiveDataSource.Factory(it, LocalLiveConfig.hosts) } ?: androidx.media3.datasource.DefaultDataSource.Factory(context, factory)
        ExoPlayer.Builder(context).setRenderersFactory(DefaultRenderersFactory(context).setEnableDecoderFallback(true)).setMediaSourceFactory(DefaultMediaSourceFactory(mediaFactory)).setSeekBackIncrementMs(10000).setSeekForwardIncrementMs(10000).build().apply {
            if (!preparing) setMediaItem(MediaItem.Builder().setUri(stream.url).apply { if (stream.hls) setMimeType(MimeTypes.APPLICATION_M3U8) }.build())
            if (!stream.live && !stream.sample) seekTo(resumePosition(repo.progress(item),season,episode))
            trackSelectionParameters = trackSelectionParameters.buildUpon().apply { if(stream.localVod) setPreferredAudioLanguage("en") }.setPreferredTextLanguage("en").setTrackTypeDisabled(C.TRACK_TYPE_TEXT, !english).build()
            if (!stream.live) trackSelectionParameters = trackSelectionParameters.buildUpon().setMaxVideoSize(Int.MAX_VALUE, repo.preferredHeight()).build()
            if (!preparing) { playWhenReady = true; prepare() }
        }
    }
    fun save() { if (!preparing && !transitioned && !stream.live && !stream.sample) repo.save(item, player.currentPosition, player.duration, season, episode) }
    fun exit() { save(); onBack() }
    fun toggleFullscreen() { fullscreen = !fullscreen; activity?.requestedOrientation = if (fullscreen) ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE else ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED }
    DisposableEffect(player) {
        var started = false
        var waitingAt = 0L
        val listener = object : Player.Listener {
            override fun onRenderedFirstFrame() { firstFrameRendered = true }
            override fun onIsPlayingChanged(playing: Boolean) { if (playing && !started) { started = true; PublicFirebase.event("playback_started", item.type) } }
            override fun onPlaybackStateChanged(state: Int) {
                buffering = state == Player.STATE_BUFFERING; ended = state == Player.STATE_ENDED
                if (buffering && started && waitingAt == 0L) waitingAt = android.os.SystemClock.elapsedRealtime()
                if (state == Player.STATE_READY && waitingAt > 0) { PublicFirebase.event("playback_buffering", item.type, duration = android.os.SystemClock.elapsedRealtime() - waitingAt); waitingAt = 0 }
                if (ended) { PublicFirebase.event("playback_ended", item.type); if (!stream.live) save() }
            }
            override fun onPlayerError(error: PlaybackException) {
                PublicFirebase.playbackError(item.type, error.errorCode)
                buffering = false; controls = true
                val http = generateSequence(error as Throwable) { it.cause }.filterIsInstance<HttpDataSource.InvalidResponseCodeException>().firstOrNull()?.responseCode
                // Codes only: signed media URLs and authorization headers never enter our diagnostic log.
                Log.w("MJPlayback", "type=${item.type} id=${item.id} code=${error.errorCodeName} http=${http ?: 0}")
                if (stream.localVod && candidateIndex < candidates.lastIndex) { save(); candidateIndex++; return }
                if (autoRecovery && !recoveryUsed && recoverablePlayback(http,error.errorCode)) { recoveryUsed=true; recover=true }
                failure = when (http) {
                    401 -> "Your preview session was not accepted. Reconnect from Browse."
                    403 -> "The stream refused access. Retry to request a fresh connection."
                    404, 410 -> "This stream is no longer available. Retry to check for a fresh source."
                    502, 503, 504 -> "The video source is unavailable right now (HTTP $http)."
                    else -> if (error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED) "Could not reach the video source. Check your connection." else "Playback stopped. Retry to request a fresh stream."
                }
            }
        }
        player.addListener(listener)
        val observer = LifecycleEventObserver { _, event -> if (event == Lifecycle.Event.ON_STOP) { save(); player.pause() } }
        activity?.lifecycle?.addObserver(observer)
        onDispose { save(); activity?.lifecycle?.removeObserver(observer); player.removeListener(listener); player.release() }
    }
    LaunchedEffect(recover) { if(recover) { save(); delay(1200); retry() } }
    fun loadCaptions(alternate: Boolean = false) {
        if (duration <= 0 || captionBusy) return
        captionBusy = true; captionError = null
        scope.launch {
            try { captions = repo.english(item, season, episode, duration, alternate) }
            catch (e: kotlinx.coroutines.CancellationException) { throw e }
            catch (_: Exception) { captionError = "English captions could not load. Retry, or choose a stream track if available." }
            finally { captionBusy = false }
        }
    }
    LaunchedEffect(english, duration > 0, stream.url) {
        player.trackSelectionParameters=player.trackSelectionParameters.buildUpon().setPreferredTextLanguage("en").setTrackTypeDisabled(C.TRACK_TYPE_TEXT,!english).build()
        if(english && duration>0 && !stream.live) {
            delay(1000)
            embeddedEnglish=player.currentTracks.groups.any { g -> g.type==C.TRACK_TYPE_TEXT && (0 until g.length).any { i -> g.isTrackSupported(i) && g.getTrackFormat(i).id != "mj-provider-english" && g.getTrackFormat(i).language in listOf("en","eng") } }
            if(!embeddedEnglish && captions==null)loadCaptions()
        }
    }
    LaunchedEffect(captions,offset) {
        val loaded=captions ?: return@LaunchedEffect
        fun stamp(seconds: Double): String { val ms=(seconds*1000).toLong();return java.lang.String.format(java.util.Locale.US,"%02d:%02d:%02d.%03d",ms/3600000,ms/60000%60,ms/1000%60,ms%1000) }
        val file=kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            java.io.File(context.cacheDir,"native-english-${item.id}-$season-$episode-${loaded.cues.hashCode()}-${offset}.vtt").apply {
                writeText("WEBVTT\n\n"+loaded.cues.joinToString("\n\n") { "${stamp((it.start+offset).coerceAtLeast(0.0))} --> ${stamp((it.end+offset).coerceAtLeast(0.001))}\n${it.text.replace("&","&amp;").replace("<","&lt;")}" })
            }
        }
        val config=MediaItem.SubtitleConfiguration.Builder(Uri.fromFile(file)).setMimeType(MimeTypes.TEXT_VTT).setLanguage("en").setLabel("Provider English").setId("mj-provider-english").setSelectionFlags(C.SELECTION_FLAG_DEFAULT).build()
        player.currentMediaItem?.let { media -> val at=player.currentPosition; val playing=player.playWhenReady; player.setMediaItem(media.buildUpon().setSubtitleConfigurations(listOf(config)).build(),at); player.prepare(); player.playWhenReady=playing }
        player.trackSelectionParameters=player.trackSelectionParameters.buildUpon().clearOverridesOfType(C.TRACK_TYPE_TEXT).setPreferredTextLanguage("en").setTrackTypeDisabled(C.TRACK_TYPE_TEXT,!english).build()
    }
    LaunchedEffect(duration > 0, stream.url) { if (duration > 0 && item.type == "tv") marker = repo.credits(item, season, episode, duration) }
    LaunchedEffect(item.id, stream.live) {
        if (stream.live) while (true) {
            guideBusy = true
            try { guide = repo.guide(item.id) } catch (e: kotlinx.coroutines.CancellationException) { throw e } catch (_: Exception) { }
            finally { guideBusy = false }
            delay(900000)
        }
    }
    LaunchedEffect(Unit) { while (true) { now = System.currentTimeMillis(); delay(30000) } }
    LaunchedEffect(buffering, player) {
        if(buffering && !preparing) { delay(45000); if(buffering && failure==null) {
            save(); player.pause(); buffering=false; controls=true; failure="The source stopped responding. Retry to request a fresh stream."
            if(autoRecovery && !recoveryUsed) { recoveryUsed=true; recover=true }
        } }
    }
    LaunchedEffect(player) { while (true) { position = player.currentPosition; duration = player.duration.coerceAtLeast(0); playing = player.isPlaying; delay(250) } }
    LaunchedEffect(player) { while (true) { delay(5000); save() } }
    LaunchedEffect(controls, interaction, settings, playing, scrub) { if (controls && !settings && playing && scrub == null) { delay(3500); controls = false } }
    DisposableEffect(fullscreen) {
        activity?.window?.let { val controller = WindowCompat.getInsetsController(it, it.decorView); controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE; if (fullscreen) controller.hide(WindowInsetsCompat.Type.systemBars()) else controller.show(WindowInsetsCompat.Type.systemBars()) }
        onDispose { activity?.window?.let { WindowCompat.getInsetsController(it, it.decorView).show(WindowInsetsCompat.Type.systemBars()) } }
    }
    DisposableEffect(Unit) { onDispose { activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED } }
    BackHandler { if (settings) settings = false else if (fullscreen) toggleFullscreen() else exit() }
    val wide = fullscreen || (LocalConfiguration.current.orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE && LocalConfiguration.current.screenWidthDp < 840)
    fun clock(ms: Long): String { val seconds = ms.coerceAtLeast(0) / 1000; return "%d:%02d".format(seconds / 60, seconds % 60) }
    val triggerAt = marker?.let { if (it.hasPostCredits) duration else it.start } ?: (duration - 15000).coerceAtLeast(0)
    val showNext = onNext != null && duration > 0 && (ended || position >= triggerAt) && !nextDismissed && !transitioned && failure == null
    fun advance() { if (!transitioned && next != null) { save(); transitioned = true; next?.invoke() } }
    LaunchedEffect(showNext) { if (showNext) { countdown = 10; nextFocus.requestFocus() } }
    LaunchedEffect(showNext, playing, buffering, settings, autoplay) {
        if (showNext && autoplay && (playing || ended) && !buffering && !settings) {
            while (countdown > 0) { delay(1000); countdown-- }
            advance()
        }
    }
    LaunchedEffect(position < triggerAt - 5000) { if (position < triggerAt - 5000) nextDismissed = false }
    val visibleGuide = guideWindow(guide, now)
    val guideRow: @Composable () -> Unit = {
        if (visibleGuide.isNotEmpty()) LazyRow(Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            items(visibleGuide) { programme -> Column(Modifier.width(155.dp).clip(RoundedCornerShape(12.dp)).background(SurfaceInk).padding(12.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text((if (programme.start <= now) "NOW / " else "UP NEXT / ") + java.time.format.DateTimeFormatter.ofPattern("HH:mm").withZone(java.time.ZoneId.systemDefault()).format(java.time.Instant.ofEpochMilli(programme.start)), fontSize = 10.sp, color = Purple)
                Text(programme.title, fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
            } }
        } else Text(if (guideBusy) "Loading schedule..." else "Schedule unavailable for this channel.", Modifier.padding(12.dp), color = Color.LightGray, fontSize = 12.sp)
    }
    val controlBar: @Composable () -> Unit = {
                Column(Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = .9f)))).padding(horizontal = 16.dp, vertical = 8.dp)) {
                    if (!stream.live && duration > 0) {
                        Slider(value = (scrub ?: position.toFloat()).coerceIn(0f, duration.toFloat()), onValueChange = { scrub = it; interaction++ }, onValueChangeFinished = { scrub?.let { player.seekTo(it.toLong()) }; scrub = null; interaction++ }, valueRange = 0f..duration.toFloat(), modifier = Modifier.height(32.dp),
                            thumb = { Box(Modifier.size(12.dp).background(Purple, CircleShape)) },
                            track = { state -> SliderDefaults.Track(sliderState = state, modifier = Modifier.height(3.dp), thumbTrackGapSize = 0.dp, drawStopIndicator = null) })
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(clock(scrub?.toLong() ?: position), fontSize = 11.sp); Text("-" + clock(duration - (scrub?.toLong() ?: position)), fontSize = 11.sp) }
                    }
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        if (stream.live) Row(Modifier.padding(end = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                            Box(Modifier.size(5.dp).background(Color(0xFFFF5374), CircleShape))
                            Text("LIVE", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                        }
                        FilledIconButton(onClick = { if (player.playWhenReady) player.pause() else player.play(); interaction++ }, enabled = !preparing && !buffering && failure == null, modifier = Modifier.size(48.dp), colors = IconButtonDefaults.filledIconButtonColors(containerColor = SurfaceInk, contentColor = Color.White)) { Icon(if (player.playWhenReady && failure == null) Icons.Outlined.Pause else Icons.Outlined.PlayArrow, "Play or pause") }
                        if (!stream.live) {
                            IconButton(enabled = !preparing, onClick = { player.seekBack(); interaction++ }) { Icon(Icons.Outlined.Replay10, "Back ten seconds") }
                            IconButton(enabled = !preparing, onClick = { player.seekForward(); interaction++ }) { Icon(Icons.Outlined.Forward10, "Forward ten seconds") }
                        } else {
                            if (item.type == "live") IconButton(onClick = { channel?.let { favourite = repo.toggleFavourite(it) }; interaction++ }) { Icon(if (favourite) Icons.Outlined.Favorite else Icons.Outlined.FavoriteBorder, "Favourite", tint = if (favourite) Purple else Color.White) }
                            IconButton(onClick = { save(); onRetry() }) { Icon(Icons.Outlined.Refresh, "Reload") }
                            if (wide) IconButton(onClick = { guideExpanded = !guideExpanded; interaction++ }) { Icon(Icons.Outlined.ViewList, "Upcoming programmes", tint = if (guideExpanded) Purple else Color.White) }
                        }
                        Spacer(Modifier.weight(1f))
                        if (onNext != null) IconButton(onClick = { save(); onNext() }) { Icon(Icons.Outlined.SkipNext, "Next episode") }
                        IconButton(enabled = !preparing, onClick = { panel = "Playback settings"; settings = true }) { Icon(Icons.Outlined.Tune, "Playback settings") }
                        IconButton(onClick = { toggleFullscreen(); interaction++ }) { Icon(if (fullscreen) Icons.Outlined.FullscreenExit else Icons.Outlined.Fullscreen, "Toggle fullscreen") }
                    }
                    if (stream.live && wide && guideExpanded) guideRow()
                }
    }
    Column(Modifier.fillMaxSize().background(if (!wide) Ink else Color.Black).then(if (fullscreen) Modifier else Modifier.systemBarsPadding())) {
        if (!wide) Row(Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { exit() }) { Icon(Icons.Outlined.ArrowBack, "Back") }
            Column(Modifier.weight(1f)) { Text(item.title, maxLines = 2); Text(if (stream.live) "LIVE / MJ PLAYER" else if (item.type == "tv") "Season $season / Episode $episode" else "MJ PLAYER", color = Purple, style = MaterialTheme.typography.labelSmall) }
        }
        Box(if (wide) Modifier.weight(1f).fillMaxWidth() else Modifier.fillMaxWidth().heightIn(max = 360.dp).aspectRatio(16f / 9f)) {
            AndroidView(factory = { PlayerView(it).apply { this.player = player; keepScreenOn = true; useController = false } }, update = { it.player = player }, modifier = Modifier.fillMaxSize())
            Box(Modifier.fillMaxSize().clickable { controls = !controls; interaction++ })
            if (controls) {
                if (wide) Row(Modifier.align(Alignment.TopStart).fillMaxWidth().background(Color.Black.copy(alpha = .4f)), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { if (fullscreen) toggleFullscreen() else exit() }) { Icon(Icons.Outlined.ArrowBack, "Back") }
                    Text(item.title, Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                if (wide) Box(Modifier.align(Alignment.BottomCenter)) { controlBar() }
            }
            val intro = introMarker
            if(intro!=null && !introDismissed && !preparing && !buffering && failure==null && playing && position>=intro.first && position<intro.second) {
                FilledTonalButton(onClick={player.seekTo(intro.second);introDismissed=true;interaction++}, modifier=Modifier.align(Alignment.BottomEnd).padding(end=16.dp,bottom=if(wide) 150.dp else 16.dp), shape=RoundedCornerShape(12.dp)) { Text("Skip intro"); Icon(Icons.Outlined.ChevronRight,null) }
            }
            if (showNext) Surface(Modifier.align(Alignment.TopEnd).padding(12.dp).widthIn(max = 285.dp), color = SurfaceInk, shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, Purple)) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(nextLabel ?: "Next episode", fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Button(onClick = { advance() }, modifier = Modifier.focusRequester(nextFocus)) { Icon(Icons.Outlined.SkipNext, null); Text(if (autoplay) "Next in $countdown" else "Play next") }
                        TextButton(onClick = { nextDismissed = true }) { Text("Stay") }
                    }
                }
            }
            if ((!firstFrameRendered || buffering) && failure == null && preparationError == null && !ended) PlaybackLoading(Modifier.align(Alignment.Center), firstFrameRendered)
            (preparationError ?: failure)?.let { message -> Surface(Modifier.align(Alignment.Center).padding(16.dp), color = SurfaceInk, shape = MaterialTheme.shapes.large) { Column(Modifier.padding(20.dp)) { Text(if(recover) "Reconnecting..." else message); Row { TextButton(onClick = { save(); onRetry() }) { Text("Retry") }; TextButton(onClick = { exit() }) { Text("Back") } } } } }
        }

        if (!wide) {
            controlBar()
            if (item.type == "sport" && sportsEvent != null) SportsWatchBrowse(repo, sportsEvent, item.id, onSportsSource, Modifier.weight(1f))
            if (item.type == "live") LiveWatchBrowse(repo, item.id, visibleGuide, guideBusy, favourite, onChannel, Modifier.weight(1f), liveCategory, onLiveCategory)
        }
        if (!wide && !stream.live) Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(item.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            if (onNext != null) OutlinedButton(onClick = { advance() }) { Icon(Icons.Outlined.SkipNext, null); Text(nextLabel ?: "Next episode") }
            if (item.overview.isNotBlank()) Text(item.overview, fontSize = 14.sp, lineHeight = 21.sp, color = Color.LightGray, maxLines = 3, overflow = TextOverflow.Ellipsis)
            if(item.type=="movie") {
                Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally)) {
                    DetailAction("My List",if(movieSaved) Icons.Outlined.Check else Icons.Outlined.Add,movieSaved) { movieSaved=repo.toggleSaved(item) }
                    DetailAction("Like",Icons.Outlined.ThumbUp,movieTaste=="like") { movieTaste=repo.rate(item,"like") }
                    DetailAction("Not for me",Icons.Outlined.ThumbDown,movieTaste=="dislike") { movieTaste=repo.rate(item,"dislike") }
                }
                if(movieCollection.size>1) TitleRail("In this collection",movieCollection) { movie -> if(movie.key!=item.key) { save(); player.pause(); onMovieTitle(movie) } }
                if(movieRelated.isNotEmpty()) TitleRail("More like this",movieRelated) { movie -> save(); player.pause(); onMovieTitle(movie) }
            }
            WatchEpisodeRows(season, episode, episodeList) { selected -> save(); onEpisode(selected) }
        }
    }
    if (settings) ModalBottomSheet(onDismissRequest = { settings = false }, containerColor = SurfaceInk, sheetMaxWidth = 560.dp, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)) {
        val sheetView = LocalView.current
        DisposableEffect(sheetView, fullscreen) {
            val window = (sheetView.parent as? DialogWindowProvider)?.window
            if(fullscreen && window != null) { val controller=WindowCompat.getInsetsController(window,sheetView);controller.systemBarsBehavior=WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE;controller.hide(WindowInsetsCompat.Type.systemBars()) }
            onDispose { if(fullscreen) activity?.window?.let { WindowCompat.getInsetsController(it,it.decorView).hide(WindowInsetsCompat.Type.systemBars()) } }
        }
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            if(panel != "Playback settings") IconButton(onClick = { panel = "Playback settings" }) { Icon(Icons.Outlined.ArrowBack,"Back to playback settings") }
            Text(panel, Modifier.weight(1f).padding(vertical = 4.dp), fontSize = 19.sp, fontWeight = FontWeight.SemiBold)
            IconButton(onClick = { settings = false }) { Icon(Icons.Outlined.Close,"Close settings") }
        }
        LazyColumn(Modifier.fillMaxWidth().heightIn(max = if(wide) (LocalConfiguration.current.screenHeightDp * .65f).dp else 400.dp), contentPadding = PaddingValues(bottom = 16.dp)) {
            if (panel == "Playback settings") {
                item { ListItem(headlineContent = { Text("Subtitles") }, leadingContent = { Icon(Icons.Outlined.ClosedCaption, null) }, modifier = Modifier.clickable { panel = "Subtitles" }, colors = ListItemDefaults.colors(containerColor = SurfaceInk)) }
                item { ListItem(headlineContent = { Text("Quality") }, supportingContent = { Text("Available stream tracks") }, leadingContent = { Icon(Icons.Outlined.HighQuality, null) }, modifier = Modifier.clickable { panel = "Quality" }, colors = ListItemDefaults.colors(containerColor = SurfaceInk)) }
                if (onNext != null) item { ListItem(headlineContent = { Text("Autoplay next episode") }, trailingContent = { Switch(autoplay, { autoplay = it; repo.setAutoplayEnabled(it) }) }, colors = ListItemDefaults.colors(containerColor = SurfaceInk)) }
            } else if (panel == "Subtitles") {
                item { Row(Modifier.padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    FilterChip(english && !embeddedEnglish, { english = true; embeddedEnglish = false; repo.setEnglishEnabled(true); player.trackSelectionParameters = player.trackSelectionParameters.buildUpon().setPreferredTextLanguage("en").setTrackTypeDisabled(C.TRACK_TYPE_TEXT, false).build() }, label = { Text("English") })
                    FilterChip(!english, { english = false; embeddedEnglish = false; repo.setEnglishEnabled(false); player.trackSelectionParameters = player.trackSelectionParameters.buildUpon().setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true).build() }, label = { Text("Off") })
                } }
                val nativeEnglish = player.currentTracks.groups.firstOrNull { g -> g.type == C.TRACK_TYPE_TEXT && (0 until g.length).any { i -> g.isTrackSupported(i) && g.getTrackFormat(i).id != "mj-provider-english" && g.getTrackFormat(i).language in listOf("en", "eng") } }
                if (nativeEnglish != null) item { TextButton(onClick = {
                    val index = (0 until nativeEnglish.length).first { nativeEnglish.isTrackSupported(it) && nativeEnglish.getTrackFormat(it).language in listOf("en", "eng") }
                    player.trackSelectionParameters = player.trackSelectionParameters.buildUpon().setTrackTypeDisabled(C.TRACK_TYPE_TEXT, false).setOverrideForType(TrackSelectionOverride(nativeEnglish.mediaTrackGroup, index)).build(); english = true; embeddedEnglish = true
                }, modifier = Modifier.padding(horizontal = 12.dp)) { Text("Stream English / matched to this video") } }
                if (captionBusy) item { LinearProgressIndicator(Modifier.fillMaxWidth().padding(20.dp)) }
                captionError?.let { message -> item { Text(message, Modifier.padding(horizontal = 24.dp), color = Color.LightGray); TextButton(onClick = { loadCaptions() }, modifier = Modifier.padding(horizontal = 12.dp)) { Text("Retry English") } } }
                if (captions != null && !embeddedEnglish) {
                    item {
                        Text("English / provider track", Modifier.padding(horizontal = 24.dp, vertical = 8.dp), fontSize = 14.sp)
                        Text("Timing follows the video clock. Adjust only if this release differs.", Modifier.padding(horizontal = 24.dp), fontSize = 12.sp, color = Color.LightGray)
                        TextButton(onClick = { releaseDetails = !releaseDetails }, modifier = Modifier.padding(horizontal = 12.dp)) { Text(if(releaseDetails) "Hide track details" else "Track details") }
                        if(releaseDetails) Text(captions!!.release, Modifier.padding(horizontal = 24.dp, vertical = 4.dp), fontSize = 11.sp, color = Color.LightGray)
                    }
                    item { Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                        TextButton(onClick = { offset = (offset - .5f).coerceAtLeast(-120f); repo.setSubtitleOffset(item, season, episode, offset) }) { Text("Earlier -0.5s") }
                        TextButton(onClick = { offset = 0f; repo.setSubtitleOffset(item, season, episode, offset) }) { Text("${offset}s / Reset") }
                        TextButton(onClick = { offset = (offset + .5f).coerceAtMost(120f); repo.setSubtitleOffset(item, season, episode, offset) }) { Text("Later +0.5s") }
                    } }
                    item { TextButton(onClick = { loadCaptions(true) }, enabled = !captionBusy, modifier = Modifier.padding(horizontal = 12.dp)) { Text("Try another English version") } }
                }
            } else {
                val type = if (panel == "Quality") C.TRACK_TYPE_VIDEO else C.TRACK_TYPE_TEXT
                val groups = player.currentTracks.groups.filter { it.type == type }
                item { TextButton(onClick = { player.trackSelectionParameters = player.trackSelectionParameters.buildUpon().clearOverridesOfType(type).setTrackTypeDisabled(type, type == C.TRACK_TYPE_TEXT).build(); settings = false }) { Text(if (type == C.TRACK_TYPE_VIDEO) "Auto" else "Off") } }
                groups.forEach { group ->
                    items((0 until group.length).filter { group.isTrackSupported(it) }) { index ->
                        val format = group.getTrackFormat(index)
                        val label = if (type == C.TRACK_TYPE_VIDEO) if (format.height > 0) "${format.height}p" else "Video track ${index + 1}" else format.label ?: format.language ?: "Subtitle track ${index + 1}"
                        ListItem(headlineContent = { Text(label) }, trailingContent = { if (group.isTrackSelected(index)) Icon(Icons.Outlined.Check, null, tint = Purple) }, colors = ListItemDefaults.colors(containerColor = SurfaceInk), modifier = Modifier.clickable {
                            player.trackSelectionParameters = player.trackSelectionParameters.buildUpon().setTrackTypeDisabled(type, false).setOverrideForType(TrackSelectionOverride(group.mediaTrackGroup, index)).build(); settings = false
                        })
                    }
                }
                if (groups.isEmpty()) item { Text(if (type == C.TRACK_TYPE_TEXT) "This stream has no included subtitle tracks." else "Quality choices appear when the stream loads.", Modifier.padding(24.dp), color = Color.LightGray) }
            }
        }
    }
}

















@Composable
internal fun PlaybackLoading(modifier: Modifier = Modifier, started: Boolean = false) {
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        CircularProgressIndicator()
        Text(if (started) "Buffering..." else "Preparing playback...", Modifier.padding(12.dp))
    }
}
