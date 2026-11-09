package com.mjentertainment.mjplay.android

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.activity.ComponentActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun CineSrcScreen(
    item: Title,
    repo: Repository,
    season: Int,
    episode: Int,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onNative: () -> Unit,
    onNext: (() -> Unit)?,
    nextLabel: String?,
    onEpisode: (Int, Int) -> Unit
) {
    val context = LocalContext.current
    val activity = context as? ComponentActivity
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val next by rememberUpdatedState(onNext)
    var fullscreen by rememberSaveable { mutableStateOf(false) }
    val wide = fullscreen || (LocalConfiguration.current.orientation == Configuration.ORIENTATION_LANDSCAPE &&
        LocalConfiguration.current.screenWidthDp < 840)
    val wideNow by rememberUpdatedState(wide)
    var controls by remember { mutableStateOf(true) }
    var settings by remember { mutableStateOf(false) }
    var episodePicker by remember { mutableStateOf(false) }
    var browseSeason by remember { mutableIntStateOf(season) }
    var episodeList by remember { mutableStateOf(emptyList<Episode>()) }
    var episodeError by remember { mutableStateOf(false) }
    var autoplay by remember { mutableStateOf(repo.autoplayEnabled()) }
    var saved by remember { mutableStateOf(repo.isSaved(item)) }
    var taste by remember { mutableStateOf(repo.taste(item)) }
    var speed by remember { mutableDoubleStateOf(1.0) }
    var position by remember { mutableLongStateOf(0) }
    var duration by remember { mutableLongStateOf(0) }
    var scrub by remember { mutableStateOf<Float?>(null) }
    var paused by remember { mutableStateOf(true) }
    var muted by remember { mutableStateOf(true) }
    var started by remember { mutableStateOf(false) }
    var failure by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(browseSeason) {
        if (item.type != "tv") return@LaunchedEffect
        episodeList = emptyList()
        episodeError = false
        try {
            episodeList = repo.episodes(item, browseSeason)
        } catch (e: CancellationException) {
            throw e
        } catch (_: Exception) {
            episodeError = true
        }
    }
    val page = remember {
        val url = Uri.Builder().scheme("https").authority("cinesrc.st")
            .appendPath("embed").appendPath(item.type).appendPath(item.id.toString()).apply {
                if (item.type == "tv") {
                    appendQueryParameter("s", season.toString())
                    appendQueryParameter("e", episode.toString())
                }
            }.appendQueryParameter("controls", "false")
            .appendQueryParameter("autoplay", "true").appendQueryParameter("muted", "true")
            .appendQueryParameter("autonext", "false").appendQueryParameter("continueprompt", "false")
            .build()
        val resume = repo.progress(item)?.takeIf {
            it.season == season && it.episode == episode && it.position >= 10_000 &&
                it.duration - it.position > 15_000
        }?.position ?: 0L
        val config = JSONObject().put("url", url.toString()).put("id", item.id)
            .put("type", item.type).put("season", season).put("episode", episode)
            .put("resume", resume / 1000.0)
        context.assets.open("cinesrc.html").bufferedReader().use { it.readText() }
            .replace("__MJ_CONFIG__", config.toString())
    }
    val view = remember {
        WebView(context).apply {
            setBackgroundColor(android.graphics.Color.BLACK)
            keepScreenOn = true
            this.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                mediaPlaybackRequiresUserGesture = false
                setSupportMultipleWindows(false)
                javaScriptCanOpenWindowsAutomatically = false
            }
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                    request.isForMainFrame || request.url.scheme != "https"
            }
            loadDataWithBaseURL("https://appassets.androidplatform.net/mj-player/", page, "text/html", "UTF-8", null)
        }
    }
    fun toggleFullscreen() {
        fullscreen = !fullscreen
        controls = true
        activity?.requestedOrientation = if (fullscreen) ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            else ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    }
    fun seekTo(ms: Long) {
        if (duration > 0) view.evaluateJavascript("window.mjSeek?.(${ms.coerceIn(0, duration) / 1000.0})", null)
    }
    fun clock(ms: Long): String {
        val seconds = ms.coerceAtLeast(0) / 1000
        return "%d:%02d".format(seconds / 60, seconds % 60)
    }
    BackHandler {
        if (settings) settings = false else if (episodePicker) episodePicker = false
        else if (fullscreen) toggleFullscreen() else onBack()
    }
    DisposableEffect(fullscreen) {
        val window = activity?.window
        val insets = window?.let { WindowCompat.getInsetsController(it, it.decorView) }
        if (fullscreen) {
            insets?.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            insets?.hide(WindowInsetsCompat.Type.systemBars())
        }
        onDispose { if (fullscreen) insets?.show(WindowInsetsCompat.Type.systemBars()) }
    }
    DisposableEffect(activity) {
        onDispose { if (fullscreen) activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED }
    }
    DisposableEffect(view, lifecycle) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_PAUSE -> {
                    view.evaluateJavascript("window.mjPause?.()", null)
                    view.onPause()
                }
                Lifecycle.Event.ON_RESUME -> view.onResume()
                else -> Unit
            }
        }
        lifecycle.addObserver(observer)
        onDispose {
            lifecycle.removeObserver(observer)
            view.stopLoading()
            view.destroy()
        }
    }
    LaunchedEffect(view) {
        var lastSaved = -1L
        var advancing = false
        var surfaceTaps = 0
        while (true) {
            delay(1000)
            if (!lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) continue
            view.evaluateJavascript("window.mjSnapshot?.()") { result ->
                val state = runCatching { JSONObject(result ?: "") }.getOrNull() ?: return@evaluateJavascript
                if (!isActive || advancing || !lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) return@evaluateJavascript
                val seconds = state.optDouble("position")
                val total = state.optDouble("duration")
                if (seconds.isFinite() && total.isFinite() && total in 1.0..86_400.0 && seconds in 0.0..total) {
                    position = (seconds * 1000).toLong()
                    duration = (total * 1000).toLong()
                    if (state.optBoolean("canSave") && position >= 1000 && position != lastSaved) {
                        repo.save(item, position, duration, season, episode)
                        lastSaved = position
                    }
                }
                paused = state.optBoolean("paused", true)
                muted = state.optBoolean("muted", true)
                started = state.optBoolean("started")
                failure = if (state.isNull("error")) null else state.optString("error")
                val taps = state.optInt("surfaceTaps")
                if (taps != surfaceTaps) {
                    surfaceTaps = taps
                    if (wideNow) controls = !controls else view.evaluateJavascript("window.mjToggle?.()", null)
                }
                val advance = next
                if (state.optBoolean("ended") && repo.autoplayEnabled() && advance != null) {
                    advancing = true
                    advance()
                }
            }
        }
    }
    val header: @Composable () -> Unit = {
        Row(Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { if (fullscreen) toggleFullscreen() else onBack() }) {
                Icon(Icons.Outlined.ArrowBack, "Back")
            }
            Column(Modifier.weight(1f)) {
                Text(item.title, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(if (item.type == "tv") "Season $season / Episode $episode" else "MJ PLAYER",
                    color = Purple, style = MaterialTheme.typography.labelSmall)
            }
        }
    }
    val controlBar: @Composable () -> Unit = {
        Column(Modifier.fillMaxWidth().background(Color.Black.copy(alpha = .9f)).padding(horizontal = 16.dp, vertical = 8.dp)) {
            if (duration > 0) {
                val displayed = (scrub ?: position.toFloat()).coerceIn(0f, duration.toFloat())
                Slider(value = displayed, onValueChange = { scrub = it },
                    onValueChangeFinished = { scrub?.let { seekTo(it.toLong()) }; scrub = null },
                    valueRange = 0f..duration.toFloat(), modifier = Modifier.height(32.dp),
                    thumb = { Box(Modifier.size(12.dp).background(Purple, CircleShape)) },
                    track = { state -> SliderDefaults.Track(sliderState = state, modifier = Modifier.height(3.dp),
                        thumbTrackGapSize = 0.dp, drawStopIndicator = null) })
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(clock(displayed.toLong()), fontSize = 11.sp)
                    Text("-" + clock(duration - displayed.toLong()), fontSize = 11.sp)
                }
            }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                FilledIconButton(onClick = { view.evaluateJavascript("window.mjToggle?.()", null) },
                    modifier = Modifier.size(48.dp),
                    colors = IconButtonDefaults.filledIconButtonColors(containerColor = SurfaceInk, contentColor = Color.White)) {
                    Icon(if (paused) Icons.Outlined.PlayArrow else Icons.Outlined.Pause, "Play or pause")
                }
                IconButton(onClick = { seekTo(position - 10_000) }, enabled = duration > 0) {
                    Icon(Icons.Outlined.Replay10, "Back ten seconds")
                }
                IconButton(onClick = { seekTo(position + 10_000) }, enabled = duration > 0) {
                    Icon(Icons.Outlined.Forward10, "Forward ten seconds")
                }
                Spacer(Modifier.weight(1f))
                if (onNext != null) IconButton(onClick = onNext) { Icon(Icons.Outlined.SkipNext, "Next episode") }
                IconButton(onClick = { settings = true }) { Icon(Icons.Outlined.Tune, "Playback settings") }
                IconButton(onClick = ::toggleFullscreen) {
                    Icon(if (fullscreen) Icons.Outlined.FullscreenExit else Icons.Outlined.Fullscreen, "Toggle fullscreen")
                }
            }
        }
    }
    val episodes: @Composable () -> Unit = {
        val seasons = (item.seasons + season).distinct().sorted()
        if (seasons.size > 1) Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            seasons.forEach { value ->
                FilterChip(value == browseSeason, { browseSeason = value }, label = { Text("Season $value") })
            }
        }
        if (episodeError) Text("Could not load this season's episodes.", color = Color.LightGray)
        WatchEpisodeRows(browseSeason, episode.takeIf { browseSeason == season }, episodeList) {
            onEpisode(browseSeason, it)
        }
    }
    Column(Modifier.fillMaxSize().background(if (wide) Color.Black else Ink)
        .then(if (fullscreen) Modifier else Modifier.systemBarsPadding())) {
        if (!wide) header()
        Box(if (wide) Modifier.weight(1f).fillMaxWidth() else Modifier.fillMaxWidth().heightIn(max = 360.dp).aspectRatio(16f / 9f)) {
            AndroidView(factory = { view }, modifier = Modifier.fillMaxSize())
            if (wide && controls) {
                Box(Modifier.align(Alignment.TopStart).background(Color.Black.copy(alpha = .4f))) { header() }
                Box(Modifier.align(Alignment.BottomCenter)) { controlBar() }
            }
            if (!started && failure == null) PlaybackLoading(Modifier.align(Alignment.Center))
            failure?.let { message ->
                Surface(Modifier.align(Alignment.Center).padding(12.dp), color = SurfaceInk, shape = MaterialTheme.shapes.large) {
                    Column(Modifier.padding(12.dp)) {
                        Text(message)
                        Row {
                            TextButton(onClick = onRetry) { Text("Retry") }
                            TextButton(onClick = onNative) { Text("Use MJ native player") }
                        }
                    }
                }
            }
        }
        if (!wide) {
            controlBar()
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(item.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                if (onNext != null) OutlinedButton(onClick = onNext) {
                    Icon(Icons.Outlined.SkipNext, null)
                    Text(nextLabel ?: "Next episode")
                }
                if (item.overview.isNotBlank()) Text(item.overview, fontSize = 14.sp, lineHeight = 21.sp,
                    color = Color.LightGray, maxLines = 3, overflow = TextOverflow.Ellipsis)
                if (item.type == "tv") episodes()
                if (item.type == "movie") Row(Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally)) {
                    DetailAction("My List", if (saved) Icons.Outlined.Check else Icons.Outlined.Add, saved) { saved = repo.toggleSaved(item) }
                    DetailAction("Like", Icons.Outlined.ThumbUp, taste == "like") { taste = repo.rate(item, "like") }
                    DetailAction("Not for me", Icons.Outlined.ThumbDown, taste == "dislike") { taste = repo.rate(item, "dislike") }
                }
            }
        }
    }
    if (settings || episodePicker) ModalBottomSheet(
        onDismissRequest = { settings = false; episodePicker = false },
        containerColor = SurfaceInk,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ) {
        Column(Modifier.fillMaxWidth().heightIn(max = (LocalConfiguration.current.screenHeightDp * .65f).dp)
            .verticalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 8.dp)) {
            Text(if (episodePicker) "Episodes" else "Playback settings", style = MaterialTheme.typography.titleLarge)
            if (episodePicker) {
                episodes()
            } else {
                if (item.type == "tv") TextButton(onClick = { settings = false; episodePicker = true }) { Text("Episodes") }
                TextButton(onClick = { view.evaluateJavascript("window.mjMute?.()", null) }) { Text(if (muted) "Unmute" else "Mute") }
                Text("Playback speed")
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(.75, 1.0, 1.25, 1.5, 2.0).forEach { rate ->
                        FilterChip(speed == rate, {
                            speed = rate
                            view.evaluateJavascript("window.mjSpeed?.($rate)", null)
                        }, label = { Text(if (rate == 1.0) "Normal" else "${rate}×") })
                    }
                }
                if (item.type == "tv") ListItem(
                    headlineContent = { Text("Autoplay next episode") },
                    trailingContent = { Switch(autoplay, { autoplay = it; repo.setAutoplayEnabled(it) }) },
                    colors = ListItemDefaults.colors(containerColor = SurfaceInk)
                )
                TextButton(onClick = onRetry) { Text("Retry CineSrc") }
                TextButton(onClick = onNative) { Text("Use MJ native player") }
            }
        }
    }
}
