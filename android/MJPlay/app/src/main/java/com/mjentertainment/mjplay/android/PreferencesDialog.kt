package com.mjentertainment.mjplay.android

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable fun PreferencesDialog(repo: Repository, close: () -> Unit) {
    var english by remember { mutableStateOf(repo.englishEnabled()) }
    var autoplay by remember { mutableStateOf(repo.autoplayEnabled()) }
    var height by remember { mutableIntStateOf(repo.preferredHeight()) }
    var cineSrc by remember { mutableStateOf(repo.cineSrcEnabled()) }
    AlertDialog(onDismissRequest = close, title = { Text("Preferences") }, text = {
        Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Defaults for your next movie or episode. You can change these while watching.", style = MaterialTheme.typography.bodySmall)
            Text("Movie and series player")
            FilterChip(selected = !cineSrc, onClick = { cineSrc = false; repo.setCineSrcEnabled(false) }, label = { Text("MJ native player") })
            FilterChip(selected = cineSrc, onClick = { cineSrc = true; repo.setCineSrcEnabled(true) }, label = { Text("CineSrc · Experimental") })
            Row(Modifier.fillMaxWidth()) { Text("English subtitles", Modifier.weight(1f)); Switch(english, { english = it; repo.setEnglishEnabled(it) }) }
            Row(Modifier.fillMaxWidth()) { Text("Autoplay next episode", Modifier.weight(1f)); Switch(autoplay, { autoplay = it; repo.setAutoplayEnabled(it) }) }
            Text("Preferred quality")
            listOf(Int.MAX_VALUE to "Auto", 1080 to "Up to 1080p", 720 to "Up to 720p").forEach { (value, label) ->
                FilterChip(selected = height == value, onClick = { height = value; repo.setPreferredHeight(value) }, label = { Text(label) })
            }
            Text("Subtitle and quality defaults apply to the native player. Live TV uses its own settings.", style = MaterialTheme.typography.bodySmall)
        }
    }, confirmButton = { TextButton(onClick = close) { Text("Done") } })
}
