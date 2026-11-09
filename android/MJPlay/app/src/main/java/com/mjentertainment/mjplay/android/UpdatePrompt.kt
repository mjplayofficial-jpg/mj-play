package com.mjentertainment.mjplay.android

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.launch
import java.io.File

@Composable fun UpdatePrompt(checkRequest: Int = 0) {
    val context = LocalContext.current; val scope = rememberCoroutineScope()
    var update by remember { mutableStateOf<AppUpdate?>(null) }
    var busy by remember { mutableStateOf(false) }; var progress by remember { mutableFloatStateOf(0f) }
    var ready by remember { mutableStateOf<File?>(null) }; var error by remember { mutableStateOf<String?>(null) }
    var status by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(checkRequest) { try { update = AppUpdates.check(context); if(checkRequest > 0 && update == null) status = if(BuildConfig.DEBUG) "Updates for this preview are built through Android Studio." else "You have the latest version of MJ Play." } catch (_: Exception) { if(checkRequest > 0) status = "Could not check for updates. Please try again." } }
    status?.let { message -> AlertDialog(onDismissRequest = { status = null }, title = { Text("App updates") }, text = { Text(message) }, confirmButton = { TextButton(onClick = { status = null }) { Text("OK") } }) }
    val flags by PublicFirebase.flags.collectAsState()
    val found = update ?: return
    val current = found.copy(required = found.required || BuildConfig.VERSION_CODE < flags.minimumVersion)
    AlertDialog(onDismissRequest = { if (!busy && !current.required) update = null }, title = { Text("MJ Play ${current.version}") }, text = {
        androidx.compose.foundation.layout.Column {
            Text(if(current.required) "An update is required to continue." else "An update is available. Your saved progress and favourites stay on this device.")
            if(current.notes.isNotBlank()) Text(current.notes)
            if(busy) { LinearProgressIndicator(progress = { progress }); Text("Downloading ${(progress*100).toInt()}%") }
            if(ready != null) Text("Download verified. Android will ask you to confirm installation. If asked, allow updates from MJ Play, then return and tap Install.")
            error?.let { Text(it) }
        }
    }, confirmButton = { TextButton(enabled = !busy, onClick = {
        if(ready != null) runCatching { AppUpdates.install(context, ready!!) }.onFailure { error = "Could not open Android installer. Please retry." }
        else scope.launch { busy = true; error = null; try { ready = AppUpdates.download(context,current) { progress = it }; AppUpdates.install(context,ready!!) } catch (_: Exception) { error = "Could not download or verify the update. Please retry." } finally { busy = false } }
    }) { Text(if(ready != null) "Install update" else if(error != null) "Retry" else "Update now") } }, dismissButton = { if(!current.required && !busy) TextButton(onClick = { update = null }) { Text("Later") } })
}
