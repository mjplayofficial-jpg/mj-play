package com.mjentertainment.mjplay.android

import android.annotation.SuppressLint
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.activity.ComponentActivity
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.platform.LocalContext
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import coil.compose.AsyncImage
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

val sportsCategories = listOf("Match" to "For You", "Highlights" to "Highlights", "football" to "Football", "basketball" to "Basketball", "tennis" to "Tennis", "cricket" to "Cricket", "baseball" to "Baseball", "rugby" to "Rugby", "american-football" to "American Football", "ice-hockey" to "Ice Hockey", "ufc" to "UFC", "motorsport" to "Motorsport")
private fun matchTime(event: SportsEvent, full: Boolean = false): String = DateTimeFormatter.ofPattern(if (full) "EEE d MMM / HH:mm" else "EEE HH:mm").withZone(ZoneId.systemDefault()).format(Instant.ofEpochMilli(event.starts))
private fun SportsSource.androidPlayable() = kind == "channel" && provider == "WS_DDL" && channel > 0 || kind == "youtube" && videoKey.matches(Regex("[-\\w]{11}"))
private fun SportsEvent.availability() = when {
    sources.any { it.androidPlayable() } -> if (highlight) "Highlights available" else "${sources.count { it.androidPlayable() }} stream${if (sources.count { it.androidPlayable() } == 1) "" else "s"} listed"
    sources.isEmpty() -> "Streams not posted yet"
    else -> "No Android streams yet"
}

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
fun SportsScreen(repo: Repository, selected: SportsEvent?, onSelected: (SportsEvent?) -> Unit, showSearch: Boolean, closeSearch: () -> Unit, onPlay: (SportsEvent, SportsSource) -> Unit, refreshRequest: Int = 0, onRefreshFinished: (Boolean) -> Unit = {}, onRequestRefresh: (() -> Unit)? = null) {
    var category by rememberSaveable { mutableStateOf("Match") }
    var filter by rememberSaveable { mutableStateOf("All matches") }
    var search by rememberSaveable { mutableStateOf("") }
    LaunchedEffect(showSearch) { if (!showSearch) search = "" }
    var refresh by remember { mutableIntStateOf(0) }
    var events by remember { mutableStateOf(emptyList<SportsEvent>()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    val scroll = rememberLazyListState()
    val categoryScroll = rememberLazyListState()
    val scope = rememberCoroutineScope()
    LaunchedEffect(showSearch) { if (showSearch) scroll.scrollToItem(0) }
    LaunchedEffect(Unit) { while (true) { now = System.currentTimeMillis(); delay(30000) } }
    LaunchedEffect(category, refresh, refreshRequest) {
        loading = true; error = null
        try { events = repo.sports(category); onRefreshFinished(true) }
        catch (e: CancellationException) { throw e }
        catch (_: Exception) { error = "Sports could not load. Check your connection and retry."; onRefreshFinished(false) }
        finally { loading = false }
    }
    BackHandler(enabled = selected != null || showSearch) { if (selected != null) onSelected(null) else { closeSearch(); search = "" } }
    if (selected != null) { MatchDetails(selected!!, now, { onSelected(null) }, onPlay); return }
    val shown = events.filter { event ->
        val status = event.status(now)
        val matchesFilter = when (filter) { "Live now" -> status == "Live now"; "Upcoming" -> status == "Upcoming"; "Recent" -> status == "Finished" || event.highlight; else -> true }
        matchesFilter && (event.highlight || event.ends > now - 86400000) && (event.title + " " + event.league).contains(search, true)
    }.sortedWith(compareBy<SportsEvent> { when(it.status(now)) { "Live now" -> 0; "Upcoming" -> 1; "Finished" -> 2; else -> 3 } }.thenBy { if (it.starts <= now) -it.starts else it.starts })
    LazyColumn(state = scroll, contentPadding = PaddingValues(top = 12.dp, bottom = 28.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        stickyHeader { Column(Modifier.fillMaxWidth().background(Ink).padding(vertical = 4.dp)) {
            if (showSearch) OutlinedTextField(search, { search = it }, Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), placeholder = { Text("Team, event or competition") }, singleLine = true, shape = RoundedCornerShape(16.dp))
            Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                SportsPicker("Sport", sportsCategories.firstOrNull { it.first == category }?.let { if(it.first == "Match") "All sports" else it.second } ?: "All sports", sportsCategories.map { it.first to if(it.first == "Match") "All sports" else it.second }) { id -> category = id; if(id == "Highlights") filter = "All matches"; events = emptyList(); scope.launch { scroll.scrollToItem(0) } }
                SportsPicker("Matches", filter, listOf("All matches", "Live now", "Upcoming", "Recent").map { it to it }) { filter = it; scope.launch { scroll.scrollToItem(0) } }
            }
        } }
        if (loading) item { LinearProgressIndicator(Modifier.fillMaxWidth().padding(horizontal = 20.dp)) }
        error?.let { message -> item { Column(Modifier.padding(horizontal = 20.dp)) { Text(message, color = Color.LightGray); TextButton(onClick = { refresh++ }) { Text("Retry") } } } }
        item { Text("${shown.size} ${if (category == "Highlights") "highlights" else "matches"} / local time", Modifier.padding(horizontal = 20.dp), fontSize = 12.sp, color = Color.LightGray) }
        items(shown, key = { it.id }) { event -> MatchCard(event, now) { onSelected(event) } }
        if (!loading && error == null && shown.isEmpty()) item { Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) { Text("No matches here yet", fontWeight = FontWeight.SemiBold); Text("Try another category or filter, or refresh for the latest events.", color = Color.LightGray) } }
    }
}

private fun sportGraphic(name: String) = when(name) {
"Football" -> Icons.Outlined.SportsSoccer
"Basketball" -> Icons.Outlined.SportsBasketball
"Tennis" -> Icons.Outlined.SportsTennis
"Cricket" -> Icons.Outlined.SportsCricket
"Baseball" -> Icons.Outlined.SportsBaseball
"Rugby" -> Icons.Outlined.SportsRugby
"American Football" -> Icons.Outlined.SportsFootball
"Ice Hockey" -> Icons.Outlined.SportsHockey
"UFC" -> Icons.Outlined.SportsMma
"Motorsport" -> Icons.Outlined.SportsMotorsports
"Highlights" -> Icons.Outlined.PlayCircleOutline
else -> Icons.Outlined.EmojiEvents
}
@Composable internal fun SportsPicker(label: String, selected: String, options: List<Pair<String, String>>, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    var fieldWidth by remember { mutableIntStateOf(0) }
    val density = LocalDensity.current
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, color = Color.LightGray, fontSize = 12.sp)
        Box(Modifier.fillMaxWidth().onSizeChanged { fieldWidth = it.width }) {
            OutlinedButton(onClick = { expanded = true }, modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp), shape = RoundedCornerShape(14.dp), border = BorderStroke(1.dp, Color.White.copy(alpha = .2f)), colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White, containerColor = SurfaceInk)) {
                if(label == "Sport") { Icon(sportGraphic(selected), null, Modifier.size(21.dp), tint = Purple); Spacer(Modifier.width(10.dp)) }
                Text(selected, Modifier.weight(1f), textAlign = androidx.compose.ui.text.style.TextAlign.Start)
                Icon(Icons.Outlined.ExpandMore, null)
            }
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }, modifier = Modifier.width(with(density) { fieldWidth.toDp() }).heightIn(max = 360.dp)) {
                options.forEach { (id, text) -> DropdownMenuItem(leadingIcon = { if(label == "Sport") Icon(sportGraphic(text), null, Modifier.size(21.dp)) }, text = { Text(text, color = if(text == selected) Purple else Color.White) }, trailingIcon = { if(text == selected) Icon(Icons.Outlined.Check, null, tint = Purple) }, onClick = { expanded = false; onSelect(id) }) }
            }
        }
    }
}

@Composable private fun Teams(event: SportsEvent, large: Boolean = false) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        listOf(event.home, event.away).forEachIndexed { index, team ->
            if (index == 1) Text("VS", color = Purple, fontSize = 12.sp)
            Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                if (team.logo.isNotBlank()) AsyncImage(team.logo, null, Modifier.size(if (large) 72.dp else 52.dp), contentScale = ContentScale.Fit)
                else Icon(Icons.Outlined.Sports, null, Modifier.size(44.dp), tint = Purple)
                Text(team.name.ifBlank { if (index == 0) "Home" else "Away" }, fontWeight = FontWeight.SemiBold, fontSize = if (large) 18.sp else 15.sp, maxLines = 2, minLines = 2, overflow = TextOverflow.Ellipsis, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            }

        }
    }
}

@Composable private fun MatchCard(event: SportsEvent, now: Long, onClick: () -> Unit) {
    Surface(onClick = onClick, modifier = Modifier.padding(horizontal = 16.dp).fillMaxWidth(), shape = RoundedCornerShape(18.dp), color = SurfaceInk, border = BorderStroke(1.dp, Color.White.copy(alpha = .08f))) {
        Column {
            Row(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Outlined.Sports, null, Modifier.size(18.dp), tint = Purple)
                Text(event.league.ifBlank { "Match day" }, Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                if (event.highlight) Icon(Icons.Outlined.PlayCircle, "Highlights", Modifier.size(20.dp), tint = Purple)
            }
            HorizontalDivider(color = Color.White.copy(alpha = .08f))
            Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(event.home, event.away).forEachIndexed { index, team ->
                    if (index == 1) Column(Modifier.width(72.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        val status = event.status(now)
                        Text(if (status == "Live now") "LIVE" else if (event.highlight) "Highlights" else if (status == "Finished") "Finished" else {
                            val day = Instant.ofEpochMilli(event.starts).atZone(ZoneId.systemDefault()).toLocalDate()
                            if (day == java.time.LocalDate.now()) "Today" else DateTimeFormatter.ofPattern("EEE d").format(day)
                        }, color = if (status == "Live now") Color(0xFF73E5BB) else Purple, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        if (!event.highlight) Text(DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.systemDefault()).format(Instant.ofEpochMilli(event.starts)), color = Color.LightGray, fontSize = 13.sp)
                    }
                    Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(9.dp)) {
                        if (team.logo.isNotBlank()) AsyncImage(team.logo, null, Modifier.size(54.dp), contentScale = ContentScale.Fit) else Icon(Icons.Outlined.Sports, null, Modifier.size(54.dp), tint = Purple)
                        Text(team.name.ifBlank { if (index == 0) "Home" else "Away" }, Modifier.heightIn(min = 36.dp), fontWeight = FontWeight.Medium, fontSize = 13.sp, lineHeight = 17.sp, maxLines = 2, overflow = TextOverflow.Ellipsis, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                    }
                }
            }
            Text(event.availability(), Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 12.dp), color = if(event.sources.any { it.androidPlayable() }) Purple else Color.LightGray, fontSize = 11.sp)
        }
    }
}

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable private fun MatchDetails(event: SportsEvent, now: Long, onBack: () -> Unit, onPlay: (SportsEvent, SportsSource) -> Unit) {
    val playableSources = event.sources.filter { it.androidPlayable() }
    val first = playableSources.firstOrNull()
    val detailScroll = rememberLazyListState()
    LazyColumn(state = detailScroll, contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { TextButton(onClick = onBack) { Icon(Icons.Outlined.ArrowBack, null); Text(" Sports") } }
        item { Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(SurfaceInk)) {
            if (event.image.isNotBlank()) AsyncImage(event.image, null, Modifier.matchParentSize(), contentScale = ContentScale.Crop, alpha = .24f)
            Box(Modifier.matchParentSize().background(Brush.verticalGradient(listOf(Ink.copy(alpha = .65f), SurfaceInk.copy(alpha = .94f), Ink))))
            Column(Modifier.fillMaxWidth().padding(20.dp), verticalArrangement = Arrangement.spacedBy(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(event.league, color = Purple, fontSize = 12.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                Text(event.title, fontSize = 24.sp, fontWeight = FontWeight.Bold, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                Teams(event, true)
                Text(event.status(now) + " / " + matchTime(event, true), color = Color.LightGray, fontSize = 12.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                if (first != null) Button(onClick = { onPlay(event, first) }, modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp)) { Icon(Icons.Outlined.PlayArrow, null); Text(if (event.highlight) "Watch highlights" else "Open stream") }
            }
        } }
        stickyHeader {
            if(detailScroll.firstVisibleItemIndex >= 2) Column(Modifier.fillMaxWidth().background(Ink).padding(vertical = 10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) { Text(event.title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis); Text(event.status(now) + " / " + matchTime(event), color = Purple, fontSize = 12.sp) }
        }
        item { Text(if (event.highlight) "Highlights" else "Available streams", fontSize = 23.sp, fontWeight = FontWeight.Bold) }
        if (first == null) item { Surface(shape = RoundedCornerShape(16.dp), color = SurfaceInk) { Column(Modifier.fillMaxWidth().padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(event.availability(), fontWeight = FontWeight.SemiBold)
            Text(if(event.sources.isEmpty()) "Check again closer to the start. No streams have been posted for this event." else "The listed providers are not available in MJ Player on Android. Try another event with a stream listed.", color = Color.LightGray, fontSize = 13.sp)
            TextButton(onClick = onBack) { Text("Browse other matches") }
        } } }
        items(playableSources) { source ->
            val playable = true
            Surface(onClick = { onPlay(event, source) }, enabled = playable, shape = RoundedCornerShape(18.dp), color = SurfaceInk, border = BorderStroke(1.dp, Color.White.copy(alpha = .12f))) {
                Row(Modifier.fillMaxWidth().padding(18.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    Icon(if (playable) Icons.Outlined.PlayCircle else Icons.Outlined.Info, null, tint = if (playable) Purple else Color.Gray)
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        Text("${source.provider} / Server ${source.serverNumber}", fontWeight = FontWeight.SemiBold)
                        Text(if (!playable) "This provider is not supported in Android yet" else if (source.kind == "youtube") "YouTube highlights" else "MJ Player / Live stream", color = Color.LightGray, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable fun HighlightScreen(event: SportsEvent, source: SportsSource, onBack: () -> Unit) {
    val activity = LocalContext.current as? ComponentActivity
    var fullView by remember { mutableStateOf<android.view.View?>(null) }
    var fullCallback by remember { mutableStateOf<WebChromeClient.CustomViewCallback?>(null) }
    fun closeFullscreen() { fullView = null; fullCallback?.onCustomViewHidden(); fullCallback = null }
    BackHandler { if (fullView != null) closeFullscreen() else onBack() }
    var webView by remember { mutableStateOf<WebView?>(null) }
    DisposableEffect(fullView != null) {
        activity?.window?.let { if (fullView != null) WindowCompat.getInsetsController(it, it.decorView).hide(WindowInsetsCompat.Type.systemBars()) }
        onDispose { activity?.window?.let { WindowCompat.getInsetsController(it, it.decorView).show(WindowInsetsCompat.Type.systemBars()) } }
    }
    DisposableEffect(Unit) { onDispose { fullCallback?.onCustomViewHidden(); webView?.stopLoading(); webView?.destroy(); webView = null } }
    Box(Modifier.fillMaxSize().background(Color.Black)) {
    Column(Modifier.fillMaxSize().background(Color.Black).systemBarsPadding()) {
        Row(Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) { IconButton(onClick = onBack) { Icon(Icons.Outlined.ArrowBack, "Back") }; Text(event.title, Modifier.weight(1f), maxLines = 2, overflow = TextOverflow.Ellipsis) }
        AndroidView(modifier = Modifier.fillMaxWidth().weight(1f), factory = { context -> WebView(context).apply {
            webView = this; setBackgroundColor(android.graphics.Color.BLACK)
            settings.javaScriptEnabled = true; settings.domStorageEnabled = true; settings.allowFileAccess = false; settings.allowContentAccess = false; settings.javaScriptCanOpenWindowsAutomatically = false; settings.setSupportMultipleWindows(false); settings.mediaPlaybackRequiresUserGesture = true
            webChromeClient = object : WebChromeClient() {
                override fun onShowCustomView(view: android.view.View?, callback: CustomViewCallback?) { fullView = view; fullCallback = callback }
                override fun onHideCustomView() { closeFullscreen() }
            }
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean = request?.isForMainFrame != false
                override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                    val host = request?.url?.host ?: return null
                    val allowed = listOf("youtube-nocookie.com", "youtube.com", "ytimg.com", "googlevideo.com", "gstatic.com", "google.com").any { host == it || host.endsWith(".$it") }
                    return if (allowed) null else WebResourceResponse("text/plain", "utf-8", java.io.ByteArrayInputStream(ByteArray(0)))
                }
            }
            if (source.videoKey.matches(Regex("[-\\w]{11}"))) loadDataWithBaseURL("https://com.mjentertainment.mjplay.android/", "<html style='height:100%'><meta name='referrer' content='strict-origin-when-cross-origin'><meta name='viewport' content='width=device-width,initial-scale=1'><body style='margin:0;height:100%;background:black'><iframe style='border:0;width:100%;height:100%' src='https://www.youtube-nocookie.com/embed/${source.videoKey}?playsinline=1&rel=0&origin=https%3A%2F%2Fcom.mjentertainment.mjplay.android' referrerpolicy='strict-origin-when-cross-origin' allow='autoplay;encrypted-media;fullscreen' allowfullscreen></iframe></body></html>", "text/html", "utf-8", null)
        } })
    }
    fullView?.let { custom -> AndroidView(factory = { custom }, modifier = Modifier.fillMaxSize()) }
    }
}


@Composable fun SportsWatchBrowse(repo: Repository, event: SportsEvent, current: Int, onPlay: (SportsEvent, SportsSource) -> Unit, modifier: Modifier = Modifier) {
    var others by remember { mutableStateOf(emptyList<SportsEvent>()) }
    var loaded by remember { mutableStateOf(false) }
    LaunchedEffect(event.id) { try { others = repo.sports("Match").filter { it.id != event.id && it.status(System.currentTimeMillis()) == "Live now" && it.sources.any { s -> s.kind == "channel" && s.provider == "WS_DDL" } }.take(8) } catch (_: Exception) {} finally { loaded = true } }
    LazyColumn(modifier.fillMaxWidth(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text(event.title, fontWeight = FontWeight.Bold, fontSize = 18.sp); Text(event.league + " / " + matchTime(event, true), color = Purple, fontSize = 12.sp); Text("Live channels may show other programmes before kickoff.", color = Color.LightGray, fontSize = 12.sp) }
        item { Text("Available streams", fontWeight = FontWeight.SemiBold) }
        items(event.sources.filter { it.kind == "channel" && it.provider == "WS_DDL" }) { source ->
            OutlinedButton(onClick = { if(source.channel != current) onPlay(event, source) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), border = BorderStroke(1.dp, if(source.channel == current) Purple else Color.White.copy(alpha = .15f))) { Column(Modifier.fillMaxWidth().padding(8.dp)) { Text("WS_DDL / Server ${source.serverNumber}"); Text(if(source.channel == current) "Watching" else "Switch stream", fontSize = 12.sp, color = Purple) } }
        }
        item { Text("Other live matches", fontWeight = FontWeight.SemiBold) }
        if(others.isEmpty()) item { Text(if(loaded) "No other live matches with streams right now." else "Loading matches…", color = Color.LightGray, fontSize = 12.sp) }
        items(others) { match -> OutlinedButton(onClick = { match.sources.firstOrNull { it.kind == "channel" && it.provider == "WS_DDL" }?.let { onPlay(match, it) } }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp)) { Text(match.title) } }
    }
}
