package com.mjentertainment.mjplay.android

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
fun LiveWatchBrowse(repo: Repository, current: Int, guide: List<Programme>, loading: Boolean, favourite: Boolean, onChannel: (Channel) -> Unit, modifier: Modifier = Modifier, category: String = "popular", onCategory: (String) -> Unit = {}) {

    val gridColumns = browseColumns(androidx.compose.ui.platform.LocalConfiguration.current.screenWidthDp)
    val channels = remember { repo.channels() }
    // Favourite is an input so saving the current channel immediately refreshes this list.
    val shown = remember(category, current, favourite) { channels.filter { category == "all" || category in it.categories || category == "favourites" && repo.isFavourite(it) } }
    val time = remember { DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.systemDefault()) }
    LazyColumn(modifier.fillMaxWidth(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Surface(shape = RoundedCornerShape(16.dp), color = SurfaceInk) {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    if (guide.isEmpty()) Text(if (loading) "Loading schedule…" else "Programme information unavailable", color = Color.LightGray, fontSize = 13.sp)
                    guide.take(2).forEach { programme ->
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text((if (programme.start <= System.currentTimeMillis()) "NOW" else "NEXT") + " · " + time.format(Instant.ofEpochMilli(programme.start)) + "–" + time.format(Instant.ofEpochMilli(programme.end)), color = Purple, fontSize = 11.sp)
                            Text(programme.title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            }
        }
        item { Text("Channels", style = MaterialTheme.typography.titleMedium) }
        item {
            val options = listOf("popular", "favourites", "news", "sports", "entertainment", "movies", "kids", "educational", "music", "all").map { id -> id to when(id) { "educational" -> "Documentary"; "all" -> "All channels"; else -> id.replaceFirstChar { it.uppercase() } } }
            SportsPicker("Category", options.first { it.first == category }.second, options) { onCategory(it) }
        }
        if (shown.isEmpty()) item { Text(if(category == "favourites") "No saved channels yet. Tap Favourite while watching to add one." else "No channels in this category. Try another category.", color = Color.LightGray, fontSize = 13.sp) }
        items(shown.chunked(gridColumns), key = { it.first().number }) { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                row.forEach { channel ->
                    Surface(Modifier.weight(1f).clickable { if (channel.number != current) onChannel(channel) }, shape = RoundedCornerShape(14.dp), color = SurfaceInk, border = if (channel.number == current) BorderStroke(1.dp, Purple) else null) {
                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(Modifier.fillMaxWidth().height(64.dp).background(Color(0xFFF1F0F5), RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) {
                                AsyncImage(channel.logo, null, Modifier.fillMaxSize().padding(8.dp), contentScale = ContentScale.Fit)
                            }
                            Text(channel.title, fontSize = 13.sp, maxLines = 2, minLines = 2, overflow = TextOverflow.Ellipsis)
                            if (channel.number == current) Text("Watching", color = Purple, fontSize = 11.sp)
                        }
                    }
                }
                repeat(gridColumns - row.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}



