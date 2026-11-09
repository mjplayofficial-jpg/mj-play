package com.mjentertainment.mjplay.android

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
internal fun WatchEpisodeRows(season: Int, playingEpisode: Int?, episodes: List<Episode>, onEpisode: (Int) -> Unit) {
    if (episodes.isEmpty()) return
    Text("Season $season / Episodes", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp))
    episodes.forEach { entry ->
        val watching = entry.number == playingEpisode
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = SurfaceInk,
            modifier = Modifier.fillMaxWidth().clickable(enabled = !watching) { onEpisode(entry.number) }
        ) {
            Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(entry.number.toString(), color = Purple)
                Column(Modifier.weight(1f)) {
                    Text(entry.title, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    if (watching) Text("Watching", color = Purple, fontSize = 11.sp)
                }
                Icon(if (watching) Icons.Outlined.PlayArrow else Icons.Outlined.ChevronRight, null)
            }
        }
    }
}
