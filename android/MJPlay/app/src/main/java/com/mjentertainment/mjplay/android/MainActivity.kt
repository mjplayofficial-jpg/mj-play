package com.mjentertainment.mjplay.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.lifecycle.lifecycleScope
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

val Ink = Color(0xFF080B18)
val SurfaceInk = Color(0xFF151829)
val Purple = Color(0xFFBE9AFF)
private data class Playback(val item: Title, val stream: Stream, val season: Int = 1, val episode: Int = 1, val attempt: Long = System.nanoTime(), val cineSrc: Boolean = false)
class MainActivity : ComponentActivity() {
    override fun onStart() { super.onStart(); lifecycleScope.launch { PublicFirebase.refresh() } }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        PublicFirebase.initialize(applicationContext)
        enableEdgeToEdge()
        setContent { MaterialTheme(colorScheme = darkColorScheme(primary = Purple, background = Ink, surface = SurfaceInk, secondary = Color(0xFF8E7CFF))) { Surface(Modifier.fillMaxSize(), color = Ink, contentColor = Color.White) { MJPlay(remember { Repository(applicationContext) }) } } }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MJPlay(repo: Repository) {
    val presentation by PublicFirebase.presentation.collectAsState()
    val appContext = androidx.compose.ui.platform.LocalContext.current
    val diagnosticConsent by PublicFirebase.consent.collectAsState()
    val tips = remember { appContext.getSharedPreferences("mj-onboarding", android.content.Context.MODE_PRIVATE) }
    var showRefreshTip by remember { mutableStateOf(!tips.getBoolean("pull-refresh-seen", false)) }
    if (showRefreshTip && diagnosticConsent != null) AlertDialog(onDismissRequest = { showRefreshTip = false; tips.edit().putBoolean("pull-refresh-seen", true).apply() }, icon = { Icon(Icons.Outlined.SwipeDown, null) }, title = { Text("Keep things fresh") }, text = { Text("At the top of Home, Sports or Live TV, swipe down to refresh the latest titles, matches and channels. Your saved items stay safe.") }, confirmButton = { TextButton(onClick = { showRefreshTip = false; tips.edit().putBoolean("pull-refresh-seen", true).apply() }) { Text("Got it") } })

    var updateCheck by remember { mutableIntStateOf(0) }
    if (diagnosticConsent != null) UpdatePrompt(updateCheck)
    var showPrivacy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val drawer = rememberDrawerState(DrawerValue.Closed)
    var info by remember { mutableStateOf<String?>(null) }
    val columns = if (LocalConfiguration.current.screenWidthDp >= 840) 6 else if (LocalConfiguration.current.screenWidthDp >= 600) 4 else 3
    var tab by rememberSaveable { mutableStateOf("Home") }
    var connected by remember { mutableStateOf(repo.connected) }
    val catalogueOrigin by CatalogueEndpoint.updates.collectAsState()
    val browsingAvailable=connected || catalogueOrigin.isNotBlank()
    var connect by remember { mutableStateOf(false) }
    var password by remember { mutableStateOf("") }
    var connectBusy by remember { mutableStateOf(false) }
    var connectError by remember { mutableStateOf<String?>(null) }
    var titles by remember { mutableStateOf(emptyList<Title>()) }
    var sportsSearch by rememberSaveable { mutableStateOf(false) }
    var liveCategory by rememberSaveable { mutableStateOf("popular") }
    var channelSearch by rememberSaveable { mutableStateOf(false) }
    var searchOrigin by rememberSaveable { mutableStateOf("Home") }
    var searchKind by rememberSaveable { mutableStateOf("Titles") }
    var actor by remember { mutableStateOf<Person?>(null) }
    val peopleState = rememberSaveableStateHolder()
    var trailerBusy by remember { mutableStateOf(false) }
    var actorOrigin by remember { mutableStateOf<Title?>(null) }
    var nextInfo by remember { mutableStateOf<NextEpisode?>(null) }
    var detail by remember { mutableStateOf<Title?>(null) }
    val sportsState = rememberSaveableStateHolder()
    val liveState = rememberSaveableStateHolder()
    var sportsDetail by remember { mutableStateOf<SportsEvent?>(null) }
    var highlight by remember { mutableStateOf<Pair<SportsEvent, SportsSource>?>(null) }
    var recovered by remember { mutableStateOf(setOf<String>()) }
    var playback by remember { mutableStateOf<Playback?>(null) }
    var busy by remember { mutableStateOf(false) }
    var preparingTitle by remember { mutableStateOf<Title?>(null) }
    var preparingSeason by remember { mutableIntStateOf(1) }
    var preparingEpisode by remember { mutableIntStateOf(1) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var retryPlayback by remember { mutableStateOf<(() -> Unit)?>(null) }
    var failedTitle by remember { mutableStateOf("") }
    var query by rememberSaveable { mutableStateOf("") }
    var filter by rememberSaveable { mutableStateOf("all") }
    var genre by rememberSaveable { mutableIntStateOf(0) }
    var rows by remember { mutableStateOf(emptyList<Pair<String, List<Title>>>()) }
    var picked by remember { mutableStateOf(emptyList<Title>()) }
    var libraryRevision by remember { mutableIntStateOf(0) }
    var refresh by remember { mutableIntStateOf(0) }
    var refreshing by remember { mutableStateOf(false) }
    var settingsRefreshed by remember { mutableStateOf(true) }
    var refreshPendingReload by remember { mutableStateOf(false) }
    val refreshMessages = remember { SnackbarHostState() }
    var loadJob by remember { mutableStateOf<Job?>(null) }
    var loadSerial by remember { mutableIntStateOf(0) }
    val homeScroll = rememberLazyListState()
    val moviesScroll = rememberLazyListState()
    val showsScroll = rememberLazyListState()
    val listScroll = rememberLazyListState()
    val continuingScroll = rememberLazyListState()
    val searchScroll = rememberLazyListState()
    val browseScroll = when (tab) { "Movies" -> moviesScroll; "Shows" -> showsScroll; "My List" -> listScroll; "Search" -> searchScroll; else -> homeScroll }
    val channelScroll = rememberLazyListState()
    val channels = remember(refresh) { repo.channels() }
    fun finishRefresh(success: Boolean) {
        if(!refreshing || !refreshPendingReload) return
        refreshing = false
        refreshPendingReload = false
        scope.launch { refreshMessages.showSnackbar(if(!success) "Could not refresh content. Your saved data is unchanged." else if(!settingsRefreshed) "Content refreshed. App settings could not refresh; try again." else "Content refreshed") }
    }
    fun refreshContent() {
        if(refreshing || busy || playback != null || highlight != null) return
        refreshing = true
        refreshPendingReload = false
        scope.launch { settingsRefreshed = runCatching { PublicFirebase.refresh(true) }.getOrDefault(false); refreshPendingReload = true; refresh++ }
    }
    val sample = remember { Title(-1, "sample", "Big Buck Bunny", "A short open movie by the Blender Foundation. This sample tests MJ Player independently of the trial backend.", year = "2008") }
    fun cancelLoad() { loadSerial++; loadJob?.cancel(); busy = false; preparingTitle = null; retryPlayback = null; error = null }
    fun openTitle(item: Title) {
        if (!browsingAvailable) { connect = true; return }
        recovered = emptySet(); detail = item; error = null
        scope.launch { try { val fresh = repo.details(item); if (detail?.key == item.key) detail = fresh } catch (_: Exception) { /* Keep catalogue metadata available on a transient error. */ } }
    }
    fun play(item: Title, season: Int = 1, episode: Int = 1, forceNative: Boolean = false) {
        PublicFirebase.blocked(item.type)?.let { error = it; return }
        PublicFirebase.event("playback_requested", item.type)

        if (!forceNative && repo.cineSrcEnabled() && item.id > 0 && item.type in listOf("movie", "tv") && season > 0 && episode > 0) {
            cancelLoad()
            playback = Playback(item, Stream(""), season, episode, cineSrc = true)
            return
        }
        cancelLoad(); playback = null; preparingTitle = item; preparingSeason = season; preparingEpisode = episode; busy = true; error = null; failedTitle = item.title + if (item.type == "tv") " · S$season E$episode" else ""
        retryPlayback = { play(item, season, episode, forceNative) }
        val serial = loadSerial
        loadJob = scope.launch {
            try {
                val source = kotlinx.coroutines.withTimeout(60000) { if (item.type == "sample") Stream("https://storage.googleapis.com/exoplayer-test-media-0/BigBuckBunny_320x180.mp4", sample = true) else repo.stream(item, season, episode, revalidate = forceNative) }
                if (serial != loadSerial) return@launch
                playback = Playback(item, source, season, episode)
                retryPlayback = null
            } catch (e: kotlinx.coroutines.TimeoutCancellationException) { if(serial == loadSerial) error = "The source took too long. Please retry." } catch (e: CancellationException) { throw e } catch (e: Exception) { if (serial == loadSerial) error = e.message?.takeUnless { it == "Failed requirement." } ?: "The source response was incompatible. Please retry or choose another source." } finally { if (serial == loadSerial) busy = false }
        }
    }
    fun playChannel(channel: Channel) {
        PublicFirebase.blocked("live")?.let { error = it; return }
        PublicFirebase.event("playback_requested", "live")
        if (!connected && !repo.localLiveAvailable) { connect = true; return }
        cancelLoad(); busy = true; error = null; failedTitle = channel.title; retryPlayback = { playChannel(channel) }
        val serial = loadSerial
        loadJob = scope.launch { try { playback = Playback(Title(channel.number, "live", channel.title), repo.live(channel)); retryPlayback = null } catch (e: kotlinx.coroutines.TimeoutCancellationException) { if(serial == loadSerial) error = "The source took too long. Please retry." } catch (e: CancellationException) { throw e } catch (e: Exception) { if (serial == loadSerial) error = e.message } finally { if (serial == loadSerial) busy = false } }
    }
    fun playSports(event: SportsEvent, source: SportsSource) {
        sportsDetail = event
        PublicFirebase.blocked("sport")?.let { error = it; return }
        PublicFirebase.event("playback_requested", "sport")
        if (source.kind == "youtube") { highlight = event to source; return }
        if (!connected && !repo.localLiveAvailable) { connect = true; return }
        if (source.kind != "channel" || source.provider != "WS_DDL" || source.channel <= 0) return
        cancelLoad(); busy = true; failedTitle = event.title
        retryPlayback = { playSports(event, source) }
        val serial = loadSerial
        loadJob = scope.launch {
            try {
                val channel = Channel(source.channel, event.title, "", emptyList())
                val stream = repo.live(channel)
                playback = Playback(Title(source.channel, "sport", event.title, "${source.provider} / Server ${source.serverNumber}"), stream)
                retryPlayback = null
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { if (serial == loadSerial) error = e.message }
            finally { if (serial == loadSerial) busy = false }
        }
    }
    LaunchedEffect(tab, diagnosticConsent) { PublicFirebase.section(tab) }
    if (diagnosticConsent == null) AlertDialog(onDismissRequest = { PublicFirebase.setConsent(false) }, title = { Text("Privacy choices") }, text = { Text("Allow optional usage and crash reports to help us find problems in MJ Play? Custom reports exclude title names, searches, stream links and credentials. This choice is saved and can be changed in Privacy. Playback works either way.") }, confirmButton = { TextButton(onClick = { PublicFirebase.setConsent(true) }) { Text("Allow diagnostics") } }, dismissButton = { TextButton(onClick = { PublicFirebase.setConsent(false) }) { Text("No thanks") } })
    if(showPrivacy) PrivacyDialog(diagnosticConsent == true, PublicFirebase::setConsent) { showPrivacy = false }
    LaunchedEffect(tab, browsingAvailable, catalogueOrigin, filter, genre, refresh) {
        if(tab == "Sports") return@LaunchedEffect
        if (!browsingAvailable || tab == "Live TV") { finishRefresh(true); return@LaunchedEffect }
        loading = true; error = null
        try {
            val kind = if (tab == "Shows") "tv" else if (tab == "Movies") "movie" else filter
            val newTitles = if (tab == "Continue Watching") repo.continueWatching() else if (tab == "My List") repo.myList() else if (genre != 0 && tab != "Search") repo.discover(if (kind == "tv") "tv" else "movie", genre) else repo.browse(kind, if (tab == "Search") query else "")
            if (tab in listOf("Home", "Movies", "Shows") && genre == 0) {
                val newRows = repo.homeRows(if (tab == "Shows") "tv" else if (tab == "Movies") "movie" else "all")
                check(newRows.isNotEmpty() || !refreshPendingReload) { "Could not refresh browsing rows. Please try again." }
                val newPicked = if(tab == "Home") repo.pickedForYou(newRows.flatMap { it.second }) else emptyList()
                rows = newRows; picked = newPicked
            } else { rows = emptyList(); picked = emptyList() }
            titles = newTitles
            finishRefresh(true)
        }
        catch (e: CancellationException) { throw e } catch (e: Exception) { error = e.message; finishRefresh(false) }
        finally { loading = false }
    }
    LaunchedEffect(libraryRevision) {
        if (libraryRevision > 0 && tab == "Home" && browsingAvailable && rows.isNotEmpty()) picked = repo.pickedForYou(rows.flatMap { it.second })
    }
    LaunchedEffect(playback?.item?.key, playback?.season, playback?.episode) {
        nextInfo = null
        val current = playback
        if (current?.item?.type == "tv") try { nextInfo = repo.nextEpisode(current.item, current.season, current.episode) } catch (e: CancellationException) { throw e } catch (_: Exception) { }
    }
    fun openTrailer(item: Title) {
        if (trailerBusy) return
        trailerBusy = true
        scope.launch {
            try {
                val key = repo.trailer(item)
                if (detail?.key != item.key) return@launch
                if (key == null) error = "No trailer is available for this title."
                else highlight = SportsEvent("trailer-${item.id}", item.title + " / Trailer", 1, 2, true, "", SportsTeam("", ""), SportsTeam("", ""), "", emptyList()) to SportsSource("YT", 1, "youtube", 0, key)
            } catch (e: CancellationException) { throw e } catch (_: Exception) { if (detail?.key == item.key) error = "Trailer could not load. Please retry." }
            finally { trailerBusy = false }
        }
    }
    if (highlight != null) {
        HighlightScreen(highlight!!.first, highlight!!.second) { highlight = null }
    } else if (playback != null || (preparingTitle != null && (busy || (error != null && retryPlayback != null)))) {
        val current = playback ?: Playback(preparingTitle!!, Stream(""), preparingSeason, preparingEpisode)
        if (current.cineSrc) {
            key(current.attempt) {
                CineSrcScreen(current.item, repo, current.season, current.episode,
                    onBack = { cancelLoad(); playback = null; libraryRevision++ },
                    onRetry = { play(current.item, current.season, current.episode) },
                    onNative = {
                        recovered = recovered - "${current.item.key}/${current.season}/${current.episode}"
                        play(current.item, current.season, current.episode, forceNative = true)
                    },
                    nextLabel = nextInfo?.let { "S${it.season} E${it.episode} / ${it.title}" },
                    onEpisode = { selectedSeason, selectedEpisode -> play(current.item, selectedSeason, selectedEpisode) },
                    onNext = nextInfo?.let { next -> {
                        repo.queueNext(current.item, next)
                        play(current.item, next.season, next.episode)
                    } }
                )
            }
        } else key(current.item.key, current.season, current.episode, loadSerial) { PlayerScreen(current.item, current.stream, repo, current.season, current.episode, preparationError = if(current.stream.url.isBlank()) error else null, autoRecovery = "${current.item.key}/${current.season}/${current.episode}" !in recovered, onMovieTitle = { movie -> playback = null; libraryRevision++; openTitle(movie) },
            onRetry = {
                recovered = recovered + "${current.item.key}/${current.season}/${current.episode}"
                playback = null
                if (current.item.type == "sport") sportsDetail?.let { event -> event.sources.firstOrNull { it.channel == current.item.id && it.provider == "WS_DDL" }?.let { playSports(event, it) } }
                else if (current.stream.live) channels.firstOrNull { it.number == current.item.id }?.let(::playChannel)
                else play(current.item, current.season, current.episode, forceNative = true)
            },
            onEpisode = { play(current.item, current.season, it) }, liveCategory = liveCategory, onLiveCategory = { liveCategory = it }, sportsEvent = sportsDetail, onSportsSource = ::playSports, onChannel = ::playChannel, onBack = { cancelLoad(); playback = null; libraryRevision++ }, nextLabel = nextInfo?.let { "S${it.season} E${it.episode} / ${it.title}" }, onNext = nextInfo?.let { next -> ({
                repo.queueNext(current.item, next); playback = null; play(current.item, next.season, next.episode)
            }) }) }

    } else ModalNavigationDrawer(
        drawerState = drawer,
        gesturesEnabled = drawer.isOpen,
        drawerContent = {
            ModalDrawerSheet(drawerContainerColor = SurfaceInk, modifier = Modifier.widthIn(max = 310.dp)) {
                Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                if(presentation.header.image.isNotBlank()) AsyncImage(presentation.header.image,null,Modifier.fillMaxWidth().height(120.dp),contentScale=ContentScale.Crop)
                Row(Modifier.fillMaxWidth().padding(start = 24.dp, end = 12.dp, top = 16.dp, bottom = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Image(painterResource(R.drawable.mj_logo), "MJ Play", Modifier.width(145.dp))
                    Spacer(Modifier.weight(1f))
                    IconButton(onClick = { scope.launch { drawer.close() } }) { Icon(Icons.Outlined.Menu,"Close menu") }
                }
                if(presentation.header.tagline.isNotBlank()) Text(presentation.header.tagline, Modifier.padding(horizontal = 24.dp, vertical = 8.dp), color = Color.LightGray)
                HorizontalDivider(Modifier.padding(vertical = 16.dp), color = Color.White.copy(alpha = .1f))
                NavigationDrawerItem(label = { Text("Preferences") }, selected = false, icon = { Icon(Icons.Outlined.Tune, null) }, onClick = { info = "preferences" }, modifier = Modifier.padding(horizontal = 12.dp))
                if(presentation.links.isNotEmpty()) {
                    HorizontalDivider(Modifier.padding(horizontal=24.dp,vertical=16.dp),color=Color.White.copy(alpha=.1f))
                    Text("COMMUNITY",Modifier.padding(horizontal=28.dp,vertical=8.dp),color=Purple,fontSize=11.sp)
                    presentation.links.forEach { link -> NavigationDrawerItem(label={ Text(link.label) },selected=false,icon={ Icon(communityIcon(link.platform),null) },onClick={ scope.launch { drawer.close() }; if(!RemotePresentation.open(appContext,link.url)) info="link-error" },modifier=Modifier.padding(horizontal=12.dp)) }
                }
                HorizontalDivider(Modifier.padding(horizontal = 24.dp, vertical = 16.dp), color = Color.White.copy(alpha = .1f))
                NavigationDrawerItem(label = { Text("Privacy") }, selected = false, icon = { Icon(Icons.Outlined.PrivacyTip, null) }, onClick = { showPrivacy = true }, modifier = Modifier.padding(horizontal = 12.dp))
                NavigationDrawerItem(label = { Text("About") }, selected = false, icon = { Icon(Icons.Outlined.Info, null) }, onClick = { info = "about" }, modifier = Modifier.padding(horizontal = 12.dp))
                NavigationDrawerItem(label = { Text("Updates") }, selected = false, icon = { Icon(Icons.Outlined.SystemUpdate, null) }, onClick = { info = "updates" }, modifier = Modifier.padding(horizontal = 12.dp))
                }
                Text("Version ${BuildConfig.VERSION_NAME}", Modifier.padding(28.dp), fontSize = 12.sp, color = Color.LightGray)
            }
        }
    ) { Scaffold(
        containerColor = Ink,
        snackbarHost = { SnackbarHost(refreshMessages) },
        topBar = { Column(Modifier.background(Ink).statusBarsPadding()) {
            Row(Modifier.fillMaxWidth().height(60.dp).padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { scope.launch { if(drawer.isOpen) drawer.close() else drawer.open() } }) { Icon(Icons.Outlined.Menu, "Open menu") }
                Image(painterResource(R.drawable.mj_logo), "MJ Play home", Modifier.padding(start = 8.dp).width(112.dp).clickable { detail = null; actor = null; actorOrigin = null; tab = "Home"; genre = 0 })
                Spacer(Modifier.weight(1f))
                if(tab != "Live TV" || detail != null || actor != null) IconButton(onClick = {
                    detail = null; actor = null; actorOrigin = null
                    when (tab) {
                        "Sports" -> { sportsDetail = null; sportsSearch = !sportsSearch }
                        "Live TV" -> channelSearch = !channelSearch
                        "Search" -> { tab = searchOrigin }
                        else -> { searchOrigin = tab; tab = "Search" }
                    }
                }) { Icon(Icons.Outlined.Search, when(tab) { "Sports" -> "Search matches"; "Live TV" -> "Search channels"; else -> "Search movies, shows and actors" }) }
            }
            if (detail == null && actor == null && tab in listOf("Home", "Movies", "Shows", "My List")) {
                val sections = listOf("Home" to "Discover", "Movies" to "Movies", "Shows" to "Shows", "My List" to "My List")
                PrimaryTabRow(selectedTabIndex = sections.indexOfFirst { it.first == tab }.coerceAtLeast(0), containerColor = Ink, contentColor = Purple) {
                    sections.forEach { (destination, label) -> Tab(selected = tab == destination, onClick = { if (tab == destination) scope.launch { browseScroll.scrollToItem(0) }; tab = destination; genre = 0; libraryRevision++ }, text = { Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(5.dp)) { Icon(when(destination) { "Home" -> Icons.Outlined.Explore; "Movies" -> Icons.Outlined.Movie; "Shows" -> Icons.Outlined.Tv; else -> Icons.Outlined.BookmarkBorder }, null, Modifier.size(17.dp)); Text(label, maxLines = 1, fontSize = 12.sp) } }) }
                }
            }
        } },
        bottomBar = {
            if (detail == null && actor == null && !busy && retryPlayback == null) NavigationBar(containerColor = SurfaceInk, tonalElevation = 0.dp) {
                listOf("Home" to Icons.Outlined.Home, "Sports" to Icons.Outlined.SportsSoccer, "Live TV" to Icons.Outlined.LiveTv).forEach { (destination, icon) ->
                    val selected = if (destination == "Home") tab in listOf("Home", "Movies", "Shows", "My List", "Continue Watching", "Search") else tab == destination
                    NavigationBarItem(selected = selected, onClick = {
                        detail = null; actor = null; actorOrigin = null; genre = 0; error = null; libraryRevision++
                        if (destination == "Home" && tab == "Home") scope.launch { browseScroll.scrollToItem(0) } else tab = destination
                    }, icon = { Icon(icon, null) }, label = { Text(destination, fontSize = 11.sp, maxLines = 1) }, colors = NavigationBarItemDefaults.colors(selectedIconColor = Purple, selectedTextColor = Purple, indicatorColor = Color(0xFF332541), unselectedIconColor = Color.LightGray, unselectedTextColor = Color.LightGray))
                }
            }
        }

    ) { padding ->
        BackHandler(enabled = drawer.isOpen || detail != null || actor != null || busy || retryPlayback != null || tab != "Home" || genre != 0) { if (drawer.isOpen) scope.launch { drawer.close() } else if (busy || retryPlayback != null) cancelLoad() else if (detail != null) { detail = null; libraryRevision++ } else if (actor != null) { actor = null; detail = actorOrigin; actorOrigin = null } else if (tab == "Search") tab = searchOrigin else if (genre != 0) genre = 0 else tab = "Home" }
        PullToRefreshBox(isRefreshing = refreshing, onRefresh = { if(detail == null && actor == null && sportsDetail == null) refreshContent() }, modifier = Modifier.fillMaxSize().padding(padding).consumeWindowInsets(padding)) {
            when {
                detail != null -> DetailsScreen(detail!!, repo, browsingAvailable, onPlay = { s, e -> play(detail!!, s, e) }, onTitle = ::openTitle, onPerson = { actorOrigin = detail; actor = it; detail = null }, onTrailer = { openTrailer(detail!!) }, trailerBusy = trailerBusy)
                actor != null -> peopleState.SaveableStateProvider("actor-${actor!!.id}") { FilmographyScreen(actor!!, repo, { actor = null; detail = actorOrigin; actorOrigin = null }, ::openTitle) }
                tab == "Search" && searchKind == "Actors" -> Column {
                    Column(Modifier.padding(horizontal = 20.dp)) {
                        Text("Search", fontSize = 30.sp, fontWeight = FontWeight.Bold)
                        OutlinedTextField(query, { query = it }, Modifier.fillMaxWidth().padding(top = 12.dp), label = { Text("Actor name") }, leadingIcon = { Icon(Icons.Outlined.Search, null) }, singleLine = true)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf("Titles", "Actors").forEach { kind -> FilterChip(searchKind == kind, { searchKind = kind }, label = { Text(kind) }) } }
                    }
                    peopleState.SaveableStateProvider("actor-search-$query") { ActorSearch(repo, query) { actorOrigin = null; actor = it } }
                }
                tab == "Live TV" -> liveState.SaveableStateProvider("live-tv") { ChannelsScreen(channels, repo, liveCategory, { liveCategory = it }, channelScroll, channelSearch, { channelSearch = false }, ::playChannel, { channelSearch = !channelSearch }) }
                tab == "Sports" -> sportsState.SaveableStateProvider("sports") { SportsScreen(repo, sportsDetail, { sportsDetail = it }, sportsSearch, { sportsSearch = false }, ::playSports, refresh, ::finishRefresh, ::refreshContent) }
                tab == "Continue Watching" -> LazyColumn(state = continuingScroll, contentPadding = PaddingValues(vertical = 20.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                    item { Text("Continue Watching", Modifier.padding(horizontal = 20.dp), fontSize = 28.sp, fontWeight = FontWeight.Bold) }
                    val continuing = repo.continueWatching()
                    if(continuing.isEmpty()) item { Text("Your unfinished movies and episodes will appear here.", Modifier.padding(20.dp), color = Color.LightGray) }
                    items(continuing, key = { it.key }) { title ->
                        Surface(onClick = { openTitle(title) }, modifier = Modifier.padding(horizontal = 20.dp).fillMaxWidth(), color = SurfaceInk, shape = RoundedCornerShape(16.dp)) {
                            Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                                AsyncImage(title.poster, null, Modifier.width(70.dp).height(100.dp).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
                                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text(title.title, fontWeight = FontWeight.SemiBold)
                                    repo.progress(title)?.let { progress ->
                                        Text(if(title.type == "tv") "S${progress.season} E${progress.episode}" else "Movie", fontSize = 12.sp, color = Color.LightGray)
                                        LinearProgressIndicator(progress = { (progress.position.toFloat() / progress.duration.coerceAtLeast(1)).coerceIn(0f,1f) }, modifier = Modifier.fillMaxWidth())
                                        Text("${((progress.duration-progress.position)/60000).coerceAtLeast(1)} min remaining", fontSize = 12.sp, color = Color.LightGray)
                                    }
                                }
                            }
                        }
                    }
                }
                else -> LazyColumn(state = browseScroll, contentPadding = PaddingValues(bottom = 28.dp), verticalArrangement = Arrangement.spacedBy(26.dp)) {
                    if(tab == "Home" && presentation.announcement.id.isNotBlank()) item("announcement") { AnnouncementBanner(presentation.announcement) }
                    if (tab != "Home") item { Column(Modifier.padding(horizontal = 20.dp)) {
                        if (tab != "Home") Text(tab, fontSize = 30.sp, fontWeight = FontWeight.Bold)
                        if (tab == "Search") OutlinedTextField(query, { query = it }, Modifier.fillMaxWidth().padding(top = 16.dp), label = { Text("Movies and shows") }, trailingIcon = { IconButton(onClick = { refresh++ }) { Icon(Icons.Outlined.Search, "Search") } }, singleLine = true)
                        if (tab == "Search") Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf("Titles", "Actors").forEach { kind -> FilterChip(searchKind == kind, { searchKind = kind }, label = { Text(kind) }) } }
                    } }
                    if (!browsingAvailable) item { Surface(Modifier.padding(horizontal = 20.dp), shape = RoundedCornerShape(18.dp), color = SurfaceInk) { Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Welcome to MJ Play", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                        Text("Connect once with your invitation password. MJ Play remembers this device.", color = Color.LightGray)
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { Button(onClick = { connect = true }) { Text("Connect to MJ Play") }; TextButton(onClick = { play(sample) }) { Text("Play sample") } }
                    } } }
                    if (loading) item { LinearProgressIndicator(Modifier.fillMaxWidth().padding(horizontal = 20.dp)) }
                    if (error != null) item { ErrorCard(error!!, { refresh++ }) }
                    if (titles.isNotEmpty() && tab == "Home") item { Featured(titles.first(), { openTitle(titles.first()) }) }
                    if (tab in listOf("Home", "Movies", "Shows")) item { LazyRow(contentPadding = PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(listOf(18 to "Drama", (if (tab == "Shows") 9648 else 53) to "Thrillers", 80 to "Crime", -1 to "Superhero", 35 to "Comedy", 9648 to "Mystery", 10751 to "Family", 16 to "Animation", 0 to "All genres")) { (id, name) ->
                            Surface(onClick = { genre = id }, shape = RoundedCornerShape(28.dp), color = if (genre == id && id != 0) Color(0xFF493361) else SurfaceInk, border = BorderStroke(1.dp, Color.White.copy(alpha = .17f))) {
                                Text(name, Modifier.padding(horizontal = 26.dp, vertical = 16.dp), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    } }
                    if (tab == "Home") {
                        val continuing = repo.continueWatching()
                        if (continuing.isNotEmpty()) item("continue") { ContinueRail(continuing, repo, ::openTitle) }
                        if (picked.isNotEmpty()) item("picked") { TitleRail("Picked for you", picked, ::openTitle) }
                    }
                    if (rows.isNotEmpty() && genre == 0 && tab in listOf("Home", "Movies", "Shows")) {
                        rows.forEach { (label, entries) -> item(label) { TitleRail(label, entries, ::openTitle) } }
                    } else {
                        item { Text(if (tab == "Search") "Results" else if (tab == "My List") "Saved titles" else "Explore MJ Play", Modifier.padding(horizontal = 20.dp), fontSize = 21.sp, fontWeight = FontWeight.SemiBold) }
                        items(titles.chunked(columns)) { row -> Row(Modifier.padding(horizontal = 20.dp).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.Top) {
                            row.forEach { item -> Poster(item, Modifier.weight(1f), { openTitle(item) }) }; repeat(columns - row.size) { Spacer(Modifier.weight(1f)) }
                        } }
                    }
                    if (browsingAvailable && !loading && titles.isEmpty()) item { Text("No titles found. Try another search or refresh.", Modifier.padding(20.dp), color = Color.LightGray) }
                }
            }
            if (!busy && error != null && retryPlayback != null) Surface(Modifier.fillMaxSize(), color = Ink) {
                Column(Modifier.fillMaxSize().padding(28.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Outlined.PlayCircle, null, tint = Purple, modifier = Modifier.size(48.dp))
                    Text("Playback unavailable", Modifier.padding(top = 20.dp), fontSize = 28.sp, fontWeight = FontWeight.Bold)
                    Text(failedTitle, Modifier.padding(vertical = 16.dp), color = Color.LightGray)
                    Text(error ?: "We couldn't prepare this stream. Try again in a moment.", color = Color.LightGray)
                    Row(Modifier.padding(top = 24.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button(onClick = { retryPlayback?.invoke() }) { Text("Retry") }
                        OutlinedButton(onClick = ::cancelLoad) { Text("Back") }
                    }
                }
            }
            if (busy) Surface(Modifier.fillMaxSize(), color = Ink.copy(alpha = .97f)) { Column(Modifier.fillMaxSize().padding(32.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(); Spacer(Modifier.height(24.dp)); Text("Preparing playback...", fontSize = 22.sp); Spacer(Modifier.height(20.dp)); OutlinedButton(onClick = ::cancelLoad) { Text("Cancel") }
            } }
        }
    }
    if (error != null && retryPlayback == null && (detail != null || tab == "Live TV" || tab == "Sports" || playback != null)) AlertDialog(onDismissRequest = { error = null }, title = { Text("MJ Play") }, text = { Text(error!!) }, confirmButton = { TextButton(onClick = { error = null }) { Text("OK") } })
    }
    if (info == "preferences") PreferencesDialog(repo) { info = null }
    else if(info == "link-error") AlertDialog(onDismissRequest={ info=null },title={ Text("Could not open link") },text={ Text("No app could open this link on your device.") },confirmButton={ TextButton(onClick={ info=null }) { Text("OK") } })
    else if (info == "about") AlertDialog(onDismissRequest = { info = null }, title = { Text("About") }, text = { Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("Why buy her flowers when you can break distribution rights to make her smile?")
        Text("Originally built for my love Maria Mazula. Somehow she wants to share to the world.")
        Text("Developed by: JamesBong", fontWeight = FontWeight.SemiBold)
        Text("© 2026 MJ Play. All rights reserved.")
        Text("Built for the wife. The world just got lucky.", color = Purple)
        Text("This product uses the TMDB API but is not endorsed or certified by TMDB.", style = MaterialTheme.typography.bodySmall, color = Color.LightGray)
    } }, confirmButton = { TextButton(onClick = { info = null }) { Text("Close") } })
    else if (info != null) AlertDialog(onDismissRequest = { info = null }, title = { Text("Updates") }, text = { Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("MJ Play ${BuildConfig.VERSION_NAME}\nMovies, series, sports and live channels.\n\nThis product uses the TMDB API but is not endorsed or certified by TMDB.")
        TextButton(onClick = { info = null; updateCheck++ }) { Icon(Icons.Outlined.SystemUpdate, null); Text(" Check for updates") }
        TextButton(onClick = { info = null; connect = true }) { Icon(Icons.Outlined.CloudDone, null); Text(" Connection & access") }
    } }, confirmButton = { TextButton(onClick = { info = null }) { Text("Close") } })
    if (connect) AlertDialog(onDismissRequest = { if (!connectBusy) connect = false }, title = { Text(if (connected) "Connected to MJ Play" else "Connect MJ Play") }, text = { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Enter the access password from your MJ Play invitation. This is not your Google password.")
        if (!connected) OutlinedTextField(password, { password = it }, label = { Text("Access password") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, enabled = !connectBusy)
        Text("Your connection is encrypted on this device. No Google sign-in is needed.", style = MaterialTheme.typography.bodySmall, color = Color.LightGray)
        connectError?.let { Text(it, color = MaterialTheme.colorScheme.error) }; if (connectBusy) LinearProgressIndicator(Modifier.fillMaxWidth())
    } }, confirmButton = {
        TextButton(enabled = !connectBusy && (connected || password.isNotBlank()), onClick = {
            if (connected) { repo.disconnect(); connected = false; connect = false; titles = emptyList() }
            else { connectBusy = true; connectError = null; scope.launch { try { repo.connect(password); connected = true; password = ""; connect = false; refresh++ } catch (e: Exception) { connectError = e.message } finally { connectBusy = false } } }
        }) { Text(if (connected) "Disconnect" else "Connect") }
    }, dismissButton = { TextButton(enabled = !connectBusy, onClick = { connect = false }) { Text("Close") } })
}

@Composable private fun Featured(item: Title, onClick: () -> Unit) {
    val phone = LocalConfiguration.current.screenWidthDp < 600
    Box(Modifier.padding(horizontal = 16.dp).fillMaxWidth().height(if (phone) 450.dp else 360.dp).clip(RoundedCornerShape(24.dp)).background(SurfaceInk).clickable(onClick = onClick)) {
        AsyncImage(imageUrl(item.backdrop.ifBlank { item.poster }, true), null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Black.copy(alpha = .05f), Ink.copy(alpha = .5f), Ink))))
        Box(Modifier.fillMaxSize().background(Brush.horizontalGradient(listOf(Ink.copy(alpha = .5f), Color.Transparent))))
        Column(Modifier.align(Alignment.BottomStart).padding(24.dp).widthIn(max = 320.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("FEATURED ${if (item.type == "tv") "SERIES" else "MOVIE"} / MJ PLAY", color = Purple, fontSize = 10.sp, letterSpacing = 2.sp)
            Text(item.title, fontSize = 32.sp, lineHeight = 35.sp, fontWeight = FontWeight.Bold, maxLines = 3, overflow = TextOverflow.Ellipsis)
            Text("${item.rating} / ${item.year}", color = Purple, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Text(item.overview, color = Color.LightGray, maxLines = 2, overflow = TextOverflow.Ellipsis, lineHeight = 21.sp, fontSize = 13.sp)
            OutlinedButton(onClick = onClick, border = BorderStroke(1.dp, Color.White.copy(alpha = .3f))) { Text("Explore title", color = Color.White); Spacer(Modifier.width(12.dp)); Icon(Icons.Outlined.NorthEast, null, Modifier.size(16.dp)) }
        }
    }
}
@Composable private fun Poster(item: Title, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(modifier.clickable(onClick = onClick)) {
        AsyncImage(imageUrl(item.poster), item.title, Modifier.fillMaxWidth().aspectRatio(2f / 3).clip(RoundedCornerShape(12.dp)).background(SurfaceInk), contentScale = ContentScale.Crop)
        Text(item.title, Modifier.padding(top = 9.dp).height(22.dp), maxLines = 1, overflow = TextOverflow.Ellipsis, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        Text("${item.year} / ${if (item.type == "tv") "Series" else "Movie"}", color = Color(0xFFAAAAB9), fontSize = 12.sp, maxLines = 1)
    }
}
@Composable internal fun TitleRail(label: String, titles: List<Title>, onClick: (Title) -> Unit) {
    val width = ((LocalConfiguration.current.screenWidthDp - 54) / 2f).coerceIn(130f, 180f).dp
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(label, Modifier.padding(horizontal = 20.dp), fontSize = 21.sp, fontWeight = FontWeight.SemiBold)
        LazyRow(contentPadding = PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.Top) {
            items(titles, key = { it.key }) { item -> Poster(item, Modifier.width(width), { onClick(item) }) }
        }
    }
}
@Composable private fun ContinueRail(titles: List<Title>, repo: Repository, onClick: (Title) -> Unit) {
    val width = ((LocalConfiguration.current.screenWidthDp - 54) / 2f).coerceIn(140f, 190f).dp
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("Continue Watching", Modifier.padding(horizontal = 20.dp), fontSize = 21.sp, fontWeight = FontWeight.SemiBold)
        LazyRow(contentPadding = PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.Top) {
            items(titles, key = { it.key }) { item ->
                val progress = repo.progress(item)
                Column(Modifier.width(width).clickable { onClick(item) }, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(Modifier.fillMaxWidth().aspectRatio(2f / 3).clip(RoundedCornerShape(12.dp)).background(SurfaceInk)) {
                        AsyncImage(imageUrl(item.poster), item.title, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                        Surface(Modifier.align(Alignment.BottomStart).padding(12.dp).size(38.dp), shape = RoundedCornerShape(50), color = Ink.copy(alpha = .75f), border = BorderStroke(1.dp, Color.White.copy(alpha = .4f))) { Box(contentAlignment = Alignment.Center) { Icon(Icons.Outlined.PlayArrow, null) } }
                    }
                    Text(item.title, fontSize = 16.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(if (item.type == "tv") "S${progress?.season ?: 1} E${progress?.episode ?: 1}" + if(progress?.duration == 0L) " · Play next" else "" else "Movie", color = Color.LightGray, fontSize = 12.sp)
                    if (progress != null && progress.duration > 0) {
                        LinearProgressIndicator(progress = { (progress.position.toFloat() / progress.duration.coerceAtLeast(1)).coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth().height(4.dp), color = Purple, trackColor = SurfaceInk)
                        Text("${((progress.duration - progress.position).coerceAtLeast(0) + 59999) / 60000} min remaining", color = Color.LightGray, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
@Composable private fun ErrorCard(message: String, retry: () -> Unit) { Surface(Modifier.padding(horizontal = 20.dp), shape = RoundedCornerShape(16.dp), color = SurfaceInk) { Column(Modifier.padding(18.dp)) { Text(message); TextButton(onClick = retry) { Text("Retry") } } } }

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable private fun ChannelsScreen(channels: List<Channel>, repo: Repository, category: String, onCategory: (String) -> Unit, scroll: androidx.compose.foundation.lazy.LazyListState, showSearch: Boolean, closeSearch: () -> Unit, onPlay: (Channel) -> Unit, onSearch: () -> Unit) {

    var search by rememberSaveable { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val categoryScroll = rememberLazyListState()
    LaunchedEffect(showSearch) { if (!showSearch) search = "" else scroll.scrollToItem(0) }
    BackHandler(enabled = showSearch) { closeSearch() }
    val gridColumns = browseColumns(LocalConfiguration.current.screenWidthDp)
    val shown = channels.filter { (category == "all" || (category == "favourites" && repo.isFavourite(it)) || category in it.categories) && it.title.contains(search, ignoreCase = true) }
    LazyColumn(state = scroll, contentPadding = PaddingValues(bottom = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        stickyHeader { Column(Modifier.fillMaxWidth().background(Ink).padding(vertical = 6.dp)) {
            if (showSearch) OutlinedTextField(search, { search = it }, Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), placeholder = { Text("Find a channel") }, singleLine = true, leadingIcon = { Icon(Icons.Outlined.Search, null) }, shape = RoundedCornerShape(16.dp))
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Bottom) {
                val categories = listOf("popular", "favourites", "news", "sports", "entertainment", "movies", "kids", "educational", "music", "all").map { id -> id to when(id) { "educational" -> "Documentary"; "all" -> "All channels"; else -> id.replaceFirstChar { it.uppercase() } } }
                Box(Modifier.weight(1f)) { SportsPicker("Category", categories.firstOrNull { it.first == category }?.second ?: "Popular", categories) { onCategory(it); search = ""; scope.launch { scroll.scrollToItem(0) } } }
                OutlinedIconButton(onClick = onSearch, modifier = Modifier.size(52.dp), shape = RoundedCornerShape(14.dp)) { Icon(Icons.Outlined.Search, "Search channels") }
            }
        } }
        item { Text("${shown.size} channels", Modifier.padding(horizontal = 16.dp), color = Color.Gray, fontSize = 12.sp) }
        items(shown.chunked(gridColumns)) { row -> Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
            row.forEach { channel -> Surface(Modifier.weight(1f).clickable { onPlay(channel) }, shape = RoundedCornerShape(16.dp), color = SurfaceInk) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(Modifier.fillMaxWidth().height(90.dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFFF3F2F8)), contentAlignment = Alignment.Center) {
                        AsyncImage(channel.logo, channel.title, Modifier.fillMaxSize().padding(10.dp), contentScale = ContentScale.Fit)
                    }
                    Text(channel.title, Modifier.height(44.dp), fontWeight = FontWeight.SemiBold, fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
            } }
            repeat(gridColumns - row.size) { Spacer(Modifier.weight(1f)) }
        } }
        if (shown.isEmpty()) item { Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(if (category == "favourites") "Your favourite channels go here" else "No channels found", fontWeight = FontWeight.SemiBold)
            Text(if (category == "favourites") "Tap the heart while watching to save a channel." else "Try another category or channel name.", color = Color.LightGray)
        } }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun DetailsScreen(item: Title, repo: Repository, connected: Boolean, onPlay: (Int, Int) -> Unit, onTitle: (Title) -> Unit, onPerson: (Person) -> Unit, onTrailer: () -> Unit, trailerBusy: Boolean) {
    var cast by remember(item.key) { mutableStateOf(emptyList<Person>()) }
    LaunchedEffect(item.key) { try { cast = repo.cast(item) } catch (e: CancellationException) { throw e } catch (_: Exception) { } }
    var related by remember(item.key) { mutableStateOf(emptyList<Title>()) }
    LaunchedEffect(item.key) { try { related = repo.related(item) } catch (e: CancellationException) { throw e } catch (_: Exception) { } }
    var savedProgress by remember(item.key) { mutableStateOf(repo.progress(item)) }
    var season by remember(item.key) { mutableIntStateOf(savedProgress?.season ?: item.seasons.firstOrNull() ?: 1) }
    var episodes by remember(item.key) { mutableStateOf(emptyList<Episode>()) }
    var episodeError by remember { mutableStateOf<String?>(null) }
    var picker by remember { mutableStateOf(false) }
    var saved by remember(item.key) { mutableStateOf(repo.isSaved(item)) }
    var taste by remember(item.key) { mutableStateOf(repo.taste(item)) }
    LaunchedEffect(item.key, season, connected) { if (connected && item.type == "tv") { episodes = emptyList(); episodeError = null; try { episodes = repo.episodes(item, season) } catch (e: CancellationException) { throw e } catch (e: Exception) { episodeError = e.message } } }
    LazyColumn(contentPadding = PaddingValues(bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        item { Box(Modifier.fillMaxWidth().height(220.dp)) { AsyncImage(imageUrl(item.backdrop, true), null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop); Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Ink)))) } }
        item { Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text(if (item.type == "tv") "SERIES · MJ PLAY" else "MOVIE · MJ PLAY", color = Purple, fontSize = 11.sp, letterSpacing = 2.sp)
            Text(item.title, fontSize = 32.sp, fontWeight = FontWeight.Bold); Text("${item.year} · ${item.rating}", color = Color.LightGray)
            Text(item.overview, color = Color.LightGray, lineHeight = 23.sp, maxLines = 5, overflow = TextOverflow.Ellipsis)
            savedProgress?.takeIf { it.position > 0 && it.duration > 0 }?.let { LinearProgressIndicator(progress = { (it.position.toFloat() / it.duration).coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth()) }
            Button(onClick = { onPlay(savedProgress?.season ?: season, savedProgress?.episode ?: 1) }, Modifier.fillMaxWidth().height(52.dp)) { Icon(Icons.Outlined.PlayArrow, null); Text(if (savedProgress != null) "Resume" else "Play") }
            OutlinedButton(onClick = onTrailer, modifier = Modifier.fillMaxWidth().height(48.dp), enabled = !trailerBusy) { Icon(Icons.Outlined.SmartDisplay, null); Text(if (trailerBusy) " Loading trailer..." else " Watch trailer") }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = if(savedProgress == null) Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally) else Arrangement.SpaceEvenly) {
                DetailAction("My List", if (saved) Icons.Outlined.Check else Icons.Outlined.Add, saved) { saved = repo.toggleSaved(item) }
                DetailAction("Like", Icons.Outlined.ThumbUp, taste == "like") { taste = repo.rate(item, "like") }
                DetailAction("Not for me", Icons.Outlined.ThumbDown, taste == "dislike") { taste = repo.rate(item, "dislike") }
                if (savedProgress != null) DetailAction("Remove", Icons.Outlined.DeleteOutline) { repo.removeProgress(item); savedProgress = null }
            }
        } }
        if (cast.isNotEmpty()) item { Column(verticalArrangement = Arrangement.spacedBy(8.dp)) { Text("Cast", Modifier.padding(horizontal = 20.dp), fontWeight = FontWeight.SemiBold); LazyRow(contentPadding = PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) { items(cast) { person -> SuggestionChip(onClick = { onPerson(person) }, label = { Text(person.name) }) } } } }
        if (item.type == "tv") {
            item { Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) { Text("Episodes", fontSize = 22.sp, fontWeight = FontWeight.Bold); Box { OutlinedButton(onClick = { picker = true }) { Text("Season $season"); Icon(Icons.Outlined.ExpandMore, null) }; DropdownMenu(picker, { picker = false }, Modifier.heightIn(max = 320.dp)) { (item.seasons.ifEmpty { listOf(1) }).forEach { n -> DropdownMenuItem(text = { Text("Season $n") }, onClick = { season = n; picker = false }) } } } } }
            episodeError?.let { message -> item { Text(message, Modifier.padding(horizontal = 20.dp), color = MaterialTheme.colorScheme.error) } }
            items(episodes) { ep -> Surface(Modifier.padding(horizontal = 16.dp).fillMaxWidth().clickable { onPlay(season, ep.number) }, shape = RoundedCornerShape(14.dp), color = SurfaceInk) { Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) { AsyncImage(imageUrl(ep.image), null, Modifier.width(110.dp).height(70.dp), contentScale = ContentScale.Crop); Column(Modifier.weight(1f)) { Text("${ep.number}. ${ep.title}", fontWeight = FontWeight.SemiBold); Text(ep.overview, fontSize = 12.sp, color = Color.LightGray, maxLines = 2, overflow = TextOverflow.Ellipsis) } } } }
        }
        if (related.isNotEmpty()) item { TitleRail("More like this", related, onTitle) }
    }
}
@Composable internal fun DetailAction(label: String, icon: ImageVector, selected: Boolean = false, onClick: () -> Unit) {
    Column(Modifier.width(72.dp).clickable(onClick = onClick).padding(vertical = 10.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Icon(icon, contentDescription = label, tint = if (selected) Purple else Color.White, modifier = Modifier.size(25.dp))
        Text(label, fontSize = 10.sp, color = if (selected) Purple else Color.LightGray, maxLines = 1)
    }
}

















