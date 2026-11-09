package com.mjentertainment.mjplay.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** Runs the actual native resolver/player, in the preview package only. */
class VodProofActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val repo=Repository(applicationContext)
        val item=Title(1434,"tv","Family Guy")
        val season=intent.getIntExtra("season",1); val episode=intent.getIntExtra("episode",1)
        setContent { MaterialTheme(colorScheme=darkColorScheme(primary=Purple,background=Ink,surface=SurfaceInk)) {
            var attempt by remember { mutableIntStateOf(0) }
            var source by remember(attempt) { mutableStateOf<Stream?>(null) }
            var error by remember(attempt) { mutableStateOf<String?>(null) }
            LaunchedEffect(attempt) {
                try { source=withContext(Dispatchers.IO){LocalVodResolver.resolve(item,season,episode)} }
                catch(e:kotlinx.coroutines.CancellationException){throw e}
                catch(e:Exception){error=e.message ?: "Source preparation failed"}
            }
            val ready=source
            if(ready!=null) key(attempt){PlayerScreen(item,ready,repo,season,episode,{finish()},{attempt++},null,null,autoRecovery=false)}
            else Surface(Modifier.fillMaxSize(),color=Ink){Column(Modifier.fillMaxSize().systemBarsPadding().padding(24.dp),verticalArrangement=Arrangement.Center){
                Text("Native Family Guy Â· S18 E2")
                Text(error ?: "Preparing compatible English sourceâ€¦")
                if(error!=null) Button(onClick={attempt++}){Text("Retry")}
                TextButton(onClick={finish()}){Text("Back")}
            }}
        }}
    }
}
