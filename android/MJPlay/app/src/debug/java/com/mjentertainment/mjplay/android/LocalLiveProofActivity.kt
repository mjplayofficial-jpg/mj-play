package com.mjentertainment.mjplay.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Debug-only entry point: live proof does not need a working catalogue backend or password. */
class LocalLiveProofActivity: ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        PublicFirebase.initialize(applicationContext)
        val repo=Repository(applicationContext)
        setContent {
            MaterialTheme(colorScheme=darkColorScheme(primary=Purple,background=Ink,surface=SurfaceInk)) {
                var selected by remember { mutableStateOf<Channel?>(null) }
                var retry by remember { mutableIntStateOf(0) }
                Surface(Modifier.fillMaxSize(),color=Ink,contentColor=Color.White) {
                    val channel=selected
                    if(channel != null) key(channel.number,retry) {
                        PlayerScreen(Title(channel.number,"live",channel.title),Stream("mjlive://channel/${channel.number}/entry.m3u8",live=true,hls=true,localChannel=channel.number),repo,1,1,{ selected=null },{ retry++ },null,null,onChannel={selected=it})
                    } else LazyColumn(Modifier.fillMaxSize().systemBarsPadding().padding(20.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                        item { Text("Local live playback test",style=MaterialTheme.typography.headlineSmall) }
                        item { Text("Experimental device-side WS processing. No automatic cloud relay fallback. Your existing app is separate.") }
                        items(repo.channels(),key={it.number}) { ch -> OutlinedButton(onClick={selected=ch},modifier=Modifier.fillMaxWidth()) { Text(ch.title) } }
                    }
                }
            }
        }
    }
}
