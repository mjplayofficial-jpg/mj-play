package com.mjentertainment.mjplay.android

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.OpenInNew
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

@Composable fun PrivacyDialog(enabled: Boolean, onToggle: (Boolean) -> Unit, close: () -> Unit) {
    val context = LocalContext.current
    var linkFailed by remember { mutableStateOf(false) }
    AlertDialog(onDismissRequest = close, title = { Text("Privacy") }, text = {
        Column(Modifier.heightIn(max = 420.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Share diagnostics", Modifier.weight(1f))
                Switch(checked = enabled, onCheckedChange = onToggle)
            }
            Text(if(enabled) "Optional reporting is on." else "Optional reporting is off.", color = Purple)
            Text("Usage and crash reports help us find app and playback problems. Your choice is saved; you can change it here at any time.")
            Text("Custom reports exclude title names, searches, stream links and credentials. Google Firebase may also receive installation identifiers and technical device and app information. Turning this off stops future optional collection; it does not delete reports already received.", style = MaterialTheme.typography.bodySmall)
            TextButton(onClick = { linkFailed = !RemotePresentation.open(context,"$BACKEND/download/privacy.html") }) { Text("Privacy policy"); Spacer(Modifier.width(8.dp)); Icon(Icons.Outlined.OpenInNew,null) }
            if(linkFailed) Text("Could not open the privacy policy. Please try again.")
        }
    }, confirmButton = { TextButton(onClick = close) { Text("Close") } })
}
