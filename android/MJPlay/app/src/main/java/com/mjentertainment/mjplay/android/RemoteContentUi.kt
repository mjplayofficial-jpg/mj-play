package com.mjentertainment.mjplay.android

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

fun communityIcon(platform: String) = when(platform) {
    "facebook" -> Icons.Outlined.Facebook
    "instagram" -> Icons.Outlined.CameraAlt
    "telegram" -> Icons.Outlined.Send
    "whatsapp" -> Icons.Outlined.Chat
    "tiktok" -> Icons.Outlined.MusicNote
    "youtube" -> Icons.Outlined.SmartDisplay
    "x" -> Icons.Outlined.Close
    else -> Icons.Outlined.Language
}

@Composable fun SupportLinks(support: SupportContent) {
    val context=LocalContext.current
    var failed by remember { mutableStateOf(false) }
    if(support.text.isNotBlank()) Text(support.text)
    if(support.helpUrl.isNotBlank()) TextButton(onClick = { failed = !RemotePresentation.open(context,support.helpUrl) }) { Icon(Icons.Outlined.HelpOutline,null); Text(" Help website") }
    if(support.email.isNotBlank()) TextButton(onClick = { failed = runCatching { context.startActivity(Intent(Intent.ACTION_SENDTO,Uri.fromParts("mailto",support.email,null))) }.isFailure }) { Icon(Icons.Outlined.Email,null); Text(" Contact support") }
    if(failed) Text("No app could open this link.", fontSize = 12.sp)
}

@Composable fun AnnouncementBanner(notice: Announcement) {
    val context=LocalContext.current
    val prefs=remember { context.getSharedPreferences("mj-announcements",android.content.Context.MODE_PRIVATE) }
    var dismissed by remember(notice.id) { mutableStateOf(prefs.getString("dismissed","") == notice.id) }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(notice.id) { while(true) { now=System.currentTimeMillis(); kotlinx.coroutines.delay(30000) } }
    var failed by remember(notice.id) { mutableStateOf(false) }
    if(notice.id.isBlank() || dismissed || notice.expires > 0 && notice.expires <= now) return
    Surface(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), color = SurfaceInk, shape = MaterialTheme.shapes.large) {
        Column(Modifier.padding(16.dp)) {
            Row { Text(notice.title,Modifier.weight(1f),color=Purple); if(notice.dismissible) IconButton(onClick = { dismissed=true; prefs.edit().putString("dismissed",notice.id).apply() },modifier=Modifier.size(28.dp)) { Icon(Icons.Outlined.Close,"Dismiss announcement") } }
            Text(notice.message,fontSize=14.sp)
            if(notice.url.isNotBlank()) TextButton(onClick = { failed = !RemotePresentation.open(context,notice.url) }) { Text(notice.button) }
            if(failed) Text("No app could open this link.",fontSize=12.sp)
        }
    }
}
