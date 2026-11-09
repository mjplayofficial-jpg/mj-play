# MJ Play remote content

Firebase project **mj-play-web**, Remote Config → Parameters. Published as template version 2; Android support starts in **0.1.17 (18)**. Web and LG TV do not consume these four parameters yet. StreamBrosApp2 is unchanged.

Edit the parameter's String default value as JSON, save, then Publish changes. No APK update is needed for subsequent supported content changes. Android 0.1.19+ listens for published Remote Config changes in real time while foregrounded. Foreground fetches use a five-minute cache; Refresh app content and pull-to-refresh force a fetch with zero cache age. Firebase can still throttle requests or be unavailable; failures retain validated cached settings. Test in the preview build before broad changes; use Firebase Change History to roll back.

## community_links

An ordered array, maximum 8 entries, one per platform. Empty array `[]` hides the group. The following is an example only: replace the destination before publishing.

```json
[{"platform":"telegram","label":"Telegram","url":"https://t.me/YOUR_GROUP","enabled":true}]
```

Supported platform IDs: facebook, instagram, telegram, whatsapp, tiktok, x, youtube, website. Blank URLs or enabled:false hide an entry. URLs must be HTTPS with no credentials or nonstandard ports. These are public links, not secret invite tokens.

## drawer_header

```json
{"tagline":"Your world. Press play.","image_url":""}
```

Empty image_url hides the image. Optional HTTPS image uses a 120dp-tall crop; logo remains underneath. Tagline maximum 100 characters. No meme/banner has been added.

## support_content

```json
{"email":"","help_url":"","text":""}
```

Nonempty email adds Contact support; HTTPS help_url adds Help website. Text appears inside Help & Contact (maximum 700 characters). Empty fields stay hidden.

## announcement

```json
{"enabled":false,"id":"notice-1","title":"MJ Play","message":"Your notice here","url":"","button":"Learn more","dismissible":true,"expires_at_ms":0}
```

Set enabled:true to show a Home banner. Use a new nonempty ID for each distinct notice; dismissal is remembered on the device for that ID. Message maximum 700 characters. Optional HTTPS URL adds a button. expires_at_ms is UTC Unix milliseconds; 0 means no expiry. Expired notices are hidden and rechecked every 30 seconds while Home is shown. Notices never interrupt playback. Disabled by default.

## Failure behavior

Malformed groups retain their last validated configuration, independently of other groups. Last validated content is cached locally for offline startup. Remote values are plain data; no scripts, arbitrary icons or code are downloaded. Links launch only when the user taps. Never put credentials or private backend URLs in Remote Config.

Default quality, subtitle and autoplay preferences remain controlled by the user. Live TV playback/source handling is unchanged.

Android 0.1.19 adds menu and pull-to-refresh for browsing lists. It reloads catalogue rows or the current sports category and rebuilds the bundled channel list and saved library. New channel additions still require a catalogue/app release. Playback and APK updates are separate.

Android 0.1.20 simplifies the drawer: Community is the contact route, Help & Contact is removed, and connection/access lives in About & Updates. support_content remains for older clients but is not displayed by 0.1.20+. Privacy has a persistent diagnostics toggle; the initial consent question is shown only when no choice has been saved.



## Live TV discovery hosts (shared web/Android backend)

Edit `live_source_config` in **MJ Play Web > Remote Config > Client**, keeping its type String:

```json
{"allowed_hosts":["edge.wedd48c.top","edge.cowedd4855ws.sbs"]}
```

Save and **Publish changes**. New playback attempts check Firebase at most once per 60 seconds per running backend. Reload a failed channel after publication. This does not interrupt already playing channels and needs no APK update. This applies to the hosted web/Android relay, not the separate LG embedded player.

Only exact `edge.<name>.sbs` or `edge.<name>.top` hostnames are accepted, maximum 16. Do not enter a URL, wildcard, token or channel path. A source using a different domain family requires code review. The backend still requires HTTPS and the requested channel's `/premium<number>/` path, and disallows redirects and URL credentials. Token acquisition and segment decoding are unchanged.

The backend fetches public configuration using the existing Firebase web registration; no Firebase administrator credentials or viewing data are required. Configuration is public and must never contain secrets. One Firebase installation identifies the backend process, not viewers. Valid configuration is cached in memory and atomically on the server's local disk. Render free storage is ephemeral: deployment/recreation can clear that file, so the verified bundled hosts remain the cold-start fallback. Invalid/missing config and Firebase outages retain the last valid list. Protocol/encryption changes still require a backend update.

## Android Preview live resolver

| Remote Config key | Type | Effect after the app activates the change |
| --- | --- | --- |
| `android_prepared_live_enabled` | Boolean | Defaults to `true`. Set to `false` to return new Preview sessions to the older local resolver. |
| `android_prepared_live_watch_host` | String | Defaults to `thedaddy.li`. Also accepts `thedaddy.pk` or `dlive.sx`. Enter only the exact hostname. |
| `live_source_config` | String | Updates the approved playlist edge hosts using the JSON format above. |

Publish the change, refresh Remote Config in the app, and reopen the channel. The watch hostname and edge list are captured when a Preview session starts. An invalid watch hostname leaves the current valid value in place. A new player domain, session protocol, playlist format, media host family or codec needs an app update and device testing.

The viewer sees a short retry message if playback cannot recover. In ADB, filter for `MJNativePrep` and `MJPlayback` to see the stage, channel ID and HTTP status when available. With diagnostics consent, Firebase Crashlytics receives a nonfatal report with the stage, error code and HTTP status when known. Stage failures also emit the `live_stage_failed` Analytics event. Reports omit URLs, tokens and session keys.
