package com.mjentertainment.mjplay.android

import java.net.URI

internal object CatalogueEndpoint {
    const val DEFAULT="https://mjplay-catalogue.jmssika1997.workers.dev"
    val updates=kotlinx.coroutines.flow.MutableStateFlow(DEFAULT)
    var origin: String
        get()=updates.value
        set(value) { updates.value=value }
    fun validate(raw: String): String {
        if(raw.isBlank())return ""
        val u=URI(raw)
        require(u.scheme=="https" && u.rawUserInfo==null && u.port==-1 && u.rawQuery==null && u.rawFragment==null && u.path in listOf("","/"))
        require(u.host?.matches(Regex("mjplay-catalogue(?:-[a-z0-9-]+)?\\.[a-z0-9-]+\\.workers\\.dev"))==true)
        return "https://${u.host}"
    }
}
