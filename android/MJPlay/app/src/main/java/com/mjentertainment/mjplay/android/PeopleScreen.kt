package com.mjentertainment.mjplay.android

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.platform.LocalConfiguration
import kotlinx.coroutines.launch
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.distinctUntilChanged

@Composable fun ActorSearch(repo: Repository, query: String, onPerson: (Person) -> Unit) {
    var people by remember(query) { mutableStateOf(emptyList<Person>()) }
    var page by remember(query) { mutableIntStateOf(1) }
    var retry by remember(query) { mutableIntStateOf(0) }
    var more by remember(query) { mutableStateOf(false) }
    var loading by remember(query) { mutableStateOf(false) }
    var error by remember(query) { mutableStateOf<String?>(null) }
    val scroll = rememberLazyListState()
    LaunchedEffect(query, page, retry) {
        if (query.isBlank()) return@LaunchedEffect
        loading = true; error = null
        try { if (page == 1) delay(350); val result = repo.people(query, page); people = (people + result.people).distinctBy { it.id }; more = result.hasMore }
        catch (e: CancellationException) { throw e }
        catch (_: Exception) { error = "Actors could not load. Please retry." }
        finally { loading = false }
    }
    LaunchedEffect(scroll, query) {
        snapshotFlow { (scroll.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: -1) >= people.size - 4 && more && !loading && error == null }.distinctUntilChanged().collect { nearEnd -> if (nearEnd) page++ }
    }
    LazyColumn(state = scroll, contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (query.isBlank()) item { Text("Search an actor to explore their movies and series.", color = Color.LightGray) }
        items(people, key = { it.id }) { person -> Surface(Modifier.fillMaxWidth().clickable { onPerson(person) }, color = SurfaceInk, shape = RoundedCornerShape(18.dp)) {
            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                AsyncImage(imageUrl(person.image), null, Modifier.size(64.dp).clip(RoundedCornerShape(12.dp)).background(Ink), contentScale = ContentScale.Crop)
                Column(Modifier.weight(1f)) { Text(person.name, fontWeight = FontWeight.SemiBold); Text("View filmography", color = Purple, fontSize = 12.sp) }
                Icon(Icons.Outlined.ChevronRight, null)
            }
        } }
        if (loading) item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
        error?.let { message -> item { Text(message); TextButton(onClick = { retry++ }) { Text("Retry") } } }
        if (!loading && error == null && people.isEmpty() && query.isNotBlank()) item { Text("No actors found.", color = Color.LightGray) }
    }
}

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable fun FilmographyScreen(person: Person, repo: Repository, onBack: () -> Unit, onTitle: (Title) -> Unit) {
    BackHandler(onBack = onBack)
    var entries by remember(person.id) { mutableStateOf(emptyList<Title>()) }
    var loading by remember(person.id) { mutableStateOf(true) }
    var error by remember(person.id) { mutableStateOf(false) }
    var retry by remember { mutableIntStateOf(0) }
    var kind by rememberSaveable(person.id) { mutableStateOf("All") }
    var newest by rememberSaveable(person.id) { mutableStateOf(false) }
    var sortOpen by remember { mutableStateOf(false) }
    val scroll = rememberLazyListState()
    val scope = rememberCoroutineScope()
    val width = LocalConfiguration.current.screenWidthDp
    val columns = if (width >= 840) 6 else if (width >= 600) 4 else 3
    LaunchedEffect(person.id, retry) {
        loading = true; error = false
        try { entries = repo.filmography(person) } catch (e: CancellationException) { throw e } catch (_: Exception) { error = true } finally { loading = false }
    }
    val shown = entries.filter { kind == "All" || it.type == if (kind == "Movies") "movie" else "tv" }.let { if (newest) it.sortedByDescending { title -> title.year } else it }
    val sortControl: @Composable () -> Unit = {
        Box {
            TextButton(onClick = { sortOpen = true }, contentPadding = PaddingValues(horizontal = 8.dp)) {
                Text(if (newest) "Newest" else "Popular", fontSize = 12.sp)
                Icon(Icons.Outlined.ExpandMore, null, Modifier.size(18.dp))
            }
            DropdownMenu(expanded = sortOpen, onDismissRequest = { sortOpen = false }) {
                listOf(false to "Popular", true to "Newest").forEach { (value, label) -> DropdownMenuItem(text = { Text(label) }, trailingIcon = { if (newest == value) Icon(Icons.Outlined.Check, null, tint = Purple) }, onClick = { newest = value; sortOpen = false; scope.launch { scroll.scrollToItem(2) } }) }
            }
        }
    }
    LazyColumn(state = scroll, contentPadding = PaddingValues(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.Outlined.ArrowBack, "Back to results") }
            Text("Filmography", fontSize = 13.sp, color = Color.LightGray)
        } }
        item { Row(Modifier.padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            AsyncImage(imageUrl(person.image), null, Modifier.width(72.dp).height(96.dp).clip(RoundedCornerShape(14.dp)).background(SurfaceInk), contentScale = ContentScale.Crop)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(person.name, fontSize = 24.sp, lineHeight = 28.sp, maxLines = 3, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold)
                Text("Movies, series and appearances", fontSize = 12.sp, color = Color.LightGray)
            }
        } }
        stickyHeader { Column(Modifier.fillMaxWidth().background(Ink).padding(horizontal = 12.dp, vertical = 4.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("All", "Movies", "Series").forEach { value -> FilterChip(kind == value, { kind = value; scope.launch { scroll.scrollToItem(2) } }, label = { Text(value, fontSize = 12.sp) }) }
                if (width >= 360) { Spacer(Modifier.weight(1f)); sortControl() }
            }
            if (width < 360) Box(Modifier.align(Alignment.End)) { sortControl() }
        } }
        if (loading) item { LinearProgressIndicator(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) }
        if (error) item { Column(Modifier.padding(horizontal = 16.dp)) { Text("Filmography could not load."); TextButton(onClick = { retry++ }) { Text("Retry") } } }
        items(shown.chunked(columns)) { row -> Row(Modifier.padding(horizontal = 16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Top) {
            row.forEach { title -> Column(Modifier.weight(1f).clickable { onTitle(title) }) {
                AsyncImage(imageUrl(title.poster), title.title, Modifier.fillMaxWidth().aspectRatio(2f / 3).clip(RoundedCornerShape(10.dp)).background(SurfaceInk), contentScale = ContentScale.Crop)
                Text(title.title, Modifier.padding(top = 7.dp), maxLines = 2, minLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, lineHeight = 16.sp)
                Text("${title.year} / ${if (title.type == "tv") "Series" else "Movie"}", color = Color.LightGray, fontSize = 10.sp, maxLines = 1)
            } }
            repeat(columns - row.size) { Spacer(Modifier.weight(1f)) }
        } }
        if (!loading && !error && shown.isEmpty()) item { Text("No credits in this category.", Modifier.padding(16.dp), color = Color.LightGray) }
    }
}
