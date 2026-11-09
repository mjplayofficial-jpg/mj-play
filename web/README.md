# Current web release status — 28 October 2026

The hosted invitation-only web app includes mobile navigation, direct playback controls, live/sports playback routes, opt-in Firebase analytics and Remote Config. The /download/ landing page, privacy/installation information and /downloads/android.json manifest support signed Android distribution. Streaming APIs remain protected by trial authentication; public download routes are narrowly allowlisted.

Public Android release instructions: ../android/MJPlay/RELEASE.md. Firebase setup: ../cloud/PUBLIC-FIREBASE.md. Run node web/build.mjs, then node tools/prepare-android-download.mjs before packaging a release download. Never copy signing secrets or trial credentials into public assets.

The dated notes below are a historical work log. Statements about localhost-only or one-channel experiments describe those earlier checkpoints, not the current routing.

---
# MJ Play public web preview

Run from C:\LGWebOs:

    npm --prefix web install
    npm --prefix web run build
    npm --prefix web start

Default URL: http://localhost:8081. The current review server uses port 8082.

This is a separate browser build. The TV source and installed app are not changed by the web build. No accounts or profile chooser. Favourites and watch progress belong to the current browser origin.

The backend reads TMDB_READ_TOKEN or TMDB_API_KEY from the environment. For local development only it can also use the TV's existing config.local.js; that file is never copied to public output. Use environment variables when deploying. Only web/public is served. Never use the workspace-wide tools/server.mjs for public hosting.

Protections implemented: fixed-destination catalogue proxy with route allowlist, per-IP request limits, bounded cache, no private configuration or profile images in output, bundled/minified JS with no source maps, response security headers. Minification is not encryption. Do not publish the workspace, config.local.js, sportsCipher.local.js, artifacts, or TV packages.

Playback starts with the existing embedded movie sources. Live TV uses embeds instead of the webOS inspector. Browser embedding restrictions and upstream ads still apply; TV-side request blocking cannot be transplanted into a normal webpage. Encrypted SS/S8 posts need a backend decoding endpoint before those servers can be exposed in the public build. No household backup/account integration is included.

Before public deployment: finish browser playback checks, test small-screen interactions, add durable production rate limiting and TLS at the hosting layer, and choose a hostname/host. This preview is local, not publicly deployed.

## MJ Player browser trial
Settings → Test MJ Player opens the actual MJ Play controls on a labelled Big Buck Bunny sample (10 seconds, 176p). It never substitutes that sample for a selected catalogue title. Play, pause, seek, restart, subtitles and quality menus are shared with the TV UI. Browser fullscreen depends on browser permission/support. MP4 and compatible HLS are supported (hls.js fallback).

The MJ Player server option requests a title-specific direct source from /api/playback/movie/TMDB_ID or /api/playback/tv/TMDB_ID/SEASON/EPISODE. Server-local web/media.local.json can map movie:ID or tv:ID:SEASON:EPISODE to {url, variants:[{url,height}], subtitles:[{url,language:"en"}]}. This file is ignored and never served. Only HTTPS media metadata is returned. No resolver is connected to VidSrc/VSEmbed yet; selecting MJ Player on an unconfigured title displays a direct-source notice and lets you switch to an embed. This is not a TV-inspector capture endpoint or an arbitrary URL proxy.

Verified in the browser: sample decodes, playback clock advances, pause and restart work, click-to-seek reaches 5 seconds. Quality menu correctly reports single quality rather than inventing HD options. Subtitles need an included English track or a separately configured backend service; the sample has no subtitle track.

## Real-movie resolver trial (26 October)
The server now follows VSEmbed's normal movie embed request sequence with referring-page headers, obtains the source metadata through its supplied metadata decoder, and returns the HLS template. The browser obtains its own per-IP stream token from the selected media host. No ad webpage is loaded by the direct path. A backend token+playlist probe succeeded (HTTP 200, Access-Control-Allow-Origin:*). Browser playback is still under verification; do not treat this as production ready. TV episodes are not yet implemented in this resolver. Stream expiry refresh and multi-host fallback remain outstanding.
Browser verification result: MJ Player resolves the real movie and loads its HLS manifest, but video segment loading fails. A fresh independent request reproduced HTTP 200 for master and variant playlists with CORS *, then HTTP 403 for the first segment without CORS headers. Browser reports fragLoadError. Direct real-movie playback is NOT verified and remains experimental; embedded VSEmbed playback remains the working option. Do not claim the resolver alone completes playback or that a relay will necessarily fix the source rejection.

Vidrock trial: The Dark Knight plays at 1920x800 on the provider page. Both English sources were tested independently in MJ Player: Orion and Luna fail with manifestLoadError. Independent requests returned Orion 403 and Luna 404. No Vidrock provider was enabled for users; temporary movie 155 override removed. Added explicit HLS stream-type support for extensionless URLs; web validation tests pass. Provider-page playback does not establish permission/access for a standalone player. The exact origin/session rejection cause remains unproven.

## Restricted localhost relay proof (26 October)
The captured Orion segment returned 200 with provider Origin/Referer headers and 403 with localhost headers. The experimental relay is enabled only with MJ_RELAY_TRIAL=1, for movie 155 from ignored relay.local.json. It accepts localhost clients, opaque expiring resource IDs and one fixed HTTPS media host/path; checks and pins public DNS addresses; rewrites playlist resources; and streams video without exposing an arbitrary URL proxy.

Verified in MJ Player: The Dark Knight decoded at 1920x800, playback advanced, pause worked, and seeking to 1:16:06 resumed with the clock advancing beyond 1:16:16. Segment bytes confirmed MPEG-TS despite upstream .html names. This proves this captured movie works through the local relay, not general catalogue reliability. No subtitle track is attached. Automatic source discovery/renewal, episodes, longer reliability testing and deployment capacity remain unfinished. The relay is not publicly deployed.

## Automatic source resolution
The localhost relay now resolves movie and TV episode metadata on each playback request, discovers the current provider script, and decodes source metadata on the server. It no longer reads relay.local.json or requires a HAR capture. The media allowlist contains four observed Orion hosts with specific path prefixes, public DNS checks and no redirects. Unsupported source hosts return a retry/server-choice error rather than opening an unrestricted proxy.

Live probes verified playlists and MPEG-TS bytes for The Dark Knight, Batman Begins, Breaking Bad S1E1 and Game of Thrones S1E1. Tulsa King S1E1 and S3E2 offered only Luna, which is not supported by this relay. Catalogue-wide coverage is not claimed. Use MJ_RELAY_TRIAL=1 to enable locally; preview port 8083. Mid-playback expiry renewal, subtitles and public hosting are still separate unfinished work.

## HLS recovery
MJ Player now requests fresh title-specific metadata after fatal HLS network/media errors or 25 seconds without playback progress. Restoration retains the playback position and paused state, deduplicates concurrent renewal requests, limits each session to two renewals, and ignores late responses after exit. A renewal that cannot load within 30 seconds surfaces the existing retry/server-choice screen. Unit tests cover simultaneous failures, position/pause preservation, exhausted retries, failed refresh and exit during renewal. A naturally expired upstream link has not yet been observed end to end; subtitle support and public deployment remain outstanding.

## Web English subtitles
The web player now requests parsed English cues from a same-origin server endpoint, with movie/series ID and exact season/episode. Configure MJ_SUBTITLE_KEY (optional MJ_SUBTITLE_TOKEN) on the server; ignored web/subtitles.local.json supports local development only. No subtitle credentials are sent to browsers. Matching rejects other episodes, forced-only and machine/AI translations; title matching does not guarantee release timing. The compact subtitle panel offers English/Off, another release, 0.5-second timing changes, reset and text size. Downloads share pending requests and a bounded in-memory cache; per-client request limits help protect quota. Live API verification returned 771 cues for Breaking Bad S1E1. Anonymous service download quota still applies; public hosting needs appropriate service capacity.

## Direct Live TV trial
Only WS channel 38 uses the new web live player. The backend fetches its fixed player page, obtains the edge playlist token, rewrites media references into short-lived opaque local URLs and decodes the provider's PNG/gzip media containers into MPEG-TS. It does not load the provider's ad scripts or execute its page code. Destinations are fixed to the observed edge/channel and two observed CDN hosts; requests have size limits, timeouts, no redirects and localhost-only clients. This is a one-channel local trial, not general Live TV coverage or a public relay.

The browser uses MJ Play controls/mini-guide and requests unmuted playback. If the browser denies audio autoplay it asks the user to press Play. Decoder tests cover PNG pixel payloads, gzip/raw TS and invalid/oversized input. Five consecutive real segments decoded successfully. Longer live playback stability and more channel hosts remain to be verified.

Chrome verification: channel 38 played at 1920x1080, unmuted, beyond 112 seconds on the media timeline; pause/resume worked. A refresh stall was traced to changing relay addresses for identical segments. Reusing stable segment IDs fixed sequence matching, with a regression test. This evidence applies only to channel 38; other channels retain their existing embedded player.

WS routing now uses the published channel number for both Live TV and Sports, with isolated token/segment registries per channel and a bounded registry pool. The edge is discovered from the fixed provider page and constrained to the provider's observed edge hostname format and exact premium-channel path. Channel 44 also returned five decoded transport-stream segments. This enables WS routing broadly but does not establish availability of every sports source; upstream 404/502 failures were observed for an upcoming match source. SS research found its embed, but no working direct-media integration was verified; SS is not presented as MJ Player-compatible.

