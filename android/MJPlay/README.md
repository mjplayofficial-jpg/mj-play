# MJ Play Android — 0.1.20

Native Kotlin / Jetpack Compose UI with Media3 playback. Public package: com.mjentertainment.mjplay.android. Android Studio preview adds .debug.

## Build

Open C:/LGWebOs/android/MJPlay in Android Studio. Use Microsoft JDK 17 at C:/Users/james/.jdks/ms-17.0.18 for Gradle; the installed Studio Java 25 runtime is incompatible with this Gradle/Kotlin combination. Android 8.0 or later.

- Preview: gradlew.bat :app:assembleDebug
- Signed public edition: gradlew.bat :app:assembleRelease
- APKs: app/build/outputs/apk/debug/app-debug.apk and app/build/outputs/apk/release/app-release.apk
- Signing and publication instructions: RELEASE.md. Keep signing.local.properties and the signing key private.

## Current capabilities

Home, Movies, Shows, Sports, Live TV, My List, contextual search, genre browsing, actor filmographies, title details, season/episode selection, local progress and favourites, playback controls, subtitles/quality options, fullscreen and lifecycle handling. Firebase Analytics and Crashlytics are opt-in; Remote Config has safe local defaults. Public builds include a verified in-app APK updater; preview builds do not install public APKs.

## Pilot access and limits

The backend remains an invitation-only Render trial. Connect using the trial invitation; credentials are stored with Android Keystore, never compiled into an APK. Downloading the signed app does not grant playback access. Public landing page: /download/ on the existing web service. No public profiles or cross-device backup. Local data can be lost on uninstall/clear-data. Private LG webOS and its household backup are separate.

Phone/tablet builds are available. Android TV remote/Leanback support is still a later milestone. No device was connected during release preparation; real-device Firebase delivery and updating an existing public installation while preserving data still need verification.

## Historical implementation notes

The entries below describe earlier builds, not current missing features.
### 0.1.2

Mobile-web-style compact title actions, clamped description, full-width Play/Resume and restart. Likes/dislikes save locally. Source preparation retries one transient HTTP 502/503/504 once, then displays Playback unavailable with Retry/Back instead of a generic OK-only dialog. A failed request remains a source failure; this change does not claim all real streams are available. Build passes; no new cloud/backend deployment is required.


### 0.1.3 - mobile interface (2026-10-28)

Android now uses a left logo/Home shortcut, Search, and a swipe-dismiss Browse menu instead of bottom tabs. Browse includes Movies and My List. Genre filters use real catalogue queries; Home includes a show rail. Title details include More like this; browse and channel scroll positions survive opening playback/details. Live TV starts on Popular and supports locally saved favourites.

The native player now has touch-to-reveal controls, separated ten-second seeking buttons, fullscreen, and a swipe-dismiss settings sheet. Quality and subtitle options reflect Media3's actual supported tracks, including Auto/Off. Live controls include favourite/reload. Back closes a sheet, then fullscreen, then returns from playback. Auto-next clears the previous player before preparing the following episode.

Build verified. ADB had no connected devices at delivery, so this update was not installed or visually verified on the phone. This is not full web feature parity: external subtitle lookup, EPG, sports, trailers, and cloud sync remain unconnected in Android. Backend/source availability remains independent of interface changes.


### 0.1.4 - Home parity

Tall static featured hero with overview and Explore title; rounded genre strip; Continue Watching cards with episode, saved progress and remaining minutes. One Picked for you rail alternates movies and shows, prioritizing recommendations from watched/liked titles and omitting disliked or already-progressed titles. Separate real catalogue feeds power Trending, Popular Movies/Shows, Top Rated Movies/Series and Now Playing. Failed secondary feeds do not discard the primary catalogue. Poster dimensions and title rows remain consistent; descriptions stay off browsing cards. Browse is an opaque two-column popup, with Back/outside dismissal and a selected destination.

Build: assembleDebug offline passed. No backend changes or deployment required. Android keeps local history and preferences; it does not import browser storage or claim cloud sync.


Device delivery: v0.1.4 installed on the connected Hisense phone using adb install -r (existing app data retained). Launch succeeded and AndroidRuntime reported no crash in the checked log window. Screenshot captures returned black, so visual phone QA could not be completed; do not treat installation/build success as visual verification.


### 0.1.5 - player recovery and portrait polish

Retry and Live Reload call the source resolver again rather than preparing an expired/failed URL. The current watch position is saved before refreshing. Playback failures log only title IDs/error/status codes to MJPlayback and show HTTP-specific guidance. Preparation errors no longer claim the server is asleep; they retain the actual source status. Portrait controls sit below the video; landscape controls overlay it. The seek track is 3dp with a round thumb, and dragging seeks once on release. Removed repeated title and redundant fullscreen link; the fullscreen icon remains. Settings retain swipe dismissal with a smaller heading.

Validation: assembleDebug offline passed; v0.1.5 installed via adb -r. Backend probes: Family Guy S1E1 returned 200 for source, two playlists and media. BBC Four setup returned 200 but playlist returned 502; the local relay reproduced ENOTFOUND at the provider playlist-token hostname. Provider HTML still declares the same failing EDGE hostname. Clayface preparation returned 502. These two sources remain unavailable; the Android recovery/UI changes do not make unavailable upstream media playable. No backend deployment performed.


### 0.1.6 - Sports

Browse now includes Sports. The native section consumes the same authenticated /api/sports catalogue as the web edition, including all twelve categories, match search, live/upcoming/recent filters, local-time schedules, centered team badges, thumbnails, match details, and original provider/server numbers. WS_DDL choices use the existing native MJ Player and its fresh-source Retry/Reload flow. Match selection and category/filter scroll state survive returning from playback. YouTube highlights use an in-app official embed with user-initiated playback, restricted navigation and fullscreen support. SS remains omitted by the shared backend. S8 entries are visibly unsupported in this native build; no misleading native-playback promise or unsolicited external website launch.

The server-side stream outage documented under 0.1.5 also affects sports WS routes; catalogue integration does not fix unavailable upstream streams. Browser history/cloud profiles are not imported into native app storage.


0.1.6 validation: app and AndroidTest APK builds passed. Both installed successfully on the connected Hisense phone. SportsCatalogueTest.matchesAndHighlightsUseTheExistingWebCatalogue passed on-device (1 test), covering native parsing, unique post IDs, valid WS channel routes, YouTube highlight keys, timestamps, and hidden SS parity. Separate hosted API probes returned 72 Match events / 135 WS entries, 150 highlights, and 37 football events / 63 WS entries. These counts reflect the test time and are not fixed application data. End-to-end sports media/highlight playback and visual layout have not been verified on-device.


### 0.1.7 - combined mobile feature pass

English captions use the existing authenticated subtitle backend with title/episode/runtime matching, six-entry in-memory and seven-day device caching, English/Off, alternate release selection, and per-episode earlier/later/reset controls. An English track included in the stream can be chosen directly when available. External captions are drawn against native player time with the requested offset; matching is by title/edition hints, not guaranteed frame-perfect synchronization.

Live playback adds Upcoming beside Reload. Its compact horizontal mini-guide uses the existing public GitHub Pages programme feeds, correct local times, freshness checks and cached fallback. It does not add a large guide panel to the mobile catalogue.

Title pages add in-app official YouTube trailers and tappable cast. Search includes Actors with debounced requests and automatic additional pages. Filmographies combine movie/TV credits, deduplicate titles, filter by type, sort Popular/Newest and preserve browsing position around title navigation. YouTube playback remains subject to each video's embedding restrictions.

Next-episode metadata is prepared before the transition and can cross into the next available season. Known future-air-date entries are excluded. A focused Play next countdown appears at validated credits markers or falls back to the last 15 seconds; markers with post-credit content defer until the end. Pause, buffering and settings pause the countdown; Stay cancels it; the transition is guarded against duplicate starts. Community markers are hints and may be unavailable.

Backend probes during development: actor search found Jack Black; 297 filmography credits returned; Family Guy returned two YouTube trailer/teaser entries and 433 English cues. BBC Four and channel 38 guides returned 23 and 21 current/future programmes. Existing video-source outages are independent of these additions. No new hosting deployment or client-side API secrets required.


0.1.7 delivery verification: APK and instrumentation APK installed successfully with existing data retained. PlaybackFeaturesTest passed all four tests on the connected physical phone: caption offsets/backward seeks, expired/current/upcoming guide logic, real actor/trailer/filmography APIs plus Family Guy S1 final episode -> S2E1 lookup, and English subtitle/cloud-guide retrieval. These are integration and logic checks; they do not verify every visual interaction, trailer embedding permission, caption synchronization for every source cut, or end-to-end automatic playback across a season boundary.


### 0.1.8 - Android navigation redesign

Android-first navigation inspired by the supplied screenshots, retaining MJ Play's dark/purple styling. Root browsing now has a four-item bottom bar: Home, Search, Sports, Live TV. Home has Discover, Movies, Shows, My List top tabs. Discover retains the static feature and horizontal rails; Movies/Shows/My List use aligned poster grids with titles beneath. The left hamburger opens a native opaque side drawer for Preview connection, Help, About; it no longer duplicates primary destinations. Back dismisses the drawer before leaving the page. Bottom navigation is hidden during detail/actor screens, source preparation/errors and playback. Android-only change; mobile web and TV are untouched.


0.1.8 validation: assembleDebug passed. Reconnected the phone through its discovered wireless ADB endpoint and installed the APK successfully with adb install -r. A screenshot taken afterward showed another app in foreground, so visual navigation QA remains unverified. No web/TV changes or backend deployment.


### 0.1.9 - contextual search

Bottom navigation now contains Home, Sports, Live TV only. The top search icon opens match/team/competition search within Sports and channel search within Live TV, instead of routing both to title search. Home retains movie/show/actor search. Closing a section search clears its temporary filter; Back from Home search returns to the originating Discover/Movies/Shows/My List tab. Removed the duplicate in-body Sports search icon. Updated Help/About. Android-only.


### 0.1.10 - compact browsing

Sports cards now use a compact league header and centered team badges/names with LIVE or local kickoff date/time between them. Removed the oversized Sports heading; categories and live/upcoming/recent filters remain pinned while scrolling. Live TV uses uniform two-column cards with a fixed-height light logo area and two-line name area; channel categories/search remain pinned. Movies/Shows and title result grids use three phone columns (four/six at larger widths); Discover keeps horizontal rails. Home, Movies, Shows, My List and search retain separate scroll positions. Live TV state is saved around playback so its chosen category survives returning. Existing native Back, fullscreen, search close and match-detail return paths retained.

WS checks: BBC Four (359), Sky Sports Main Event (38), and BBC One (356) all returned setup HTTP 200 but media playlist HTTP 502. Local relay diagnosis reproduced ENOTFOUND for the provider playlist-token hostname. This confirms the tested WS path is unavailable upstream, not a grid/layout regression; it does not establish the state of every WS service. Family Guy playlist/segment checks returned HTTP 200. Build assembleDebug passed; no web/TV/backend changes.


### 0.1.11 - restore browsing shelves

Restored horizontal browsing rows for Movies and Shows: Trending This Week, Popular Right Now, Critically Acclaimed (TMDB top_rated); Movies also retains Now Playing. Three-column grids are used when filtering a genre, not as a replacement for the default shelves. Superhero is available beside Crime in Discover/Movies/Shows and resolves the exact superhero keyword through the catalogue, matching the web implementation rather than substituting Action. The keyword-based movie and TV queries both returned HTTP 200 and 20 results during verification. Android-only.


### 0.1.12 - mobile filmography

Compact actor portrait/name header and top Back arrow. All/Movies/Series filters remain pinned while scrolling, with a Popular/Newest dropdown aligned alongside where width permits and below on narrow screens. Replaced the separate sorting chip row. Phone filmography uses three aligned columns, four/six on larger screens, with two-line reserved title areas and metadata beneath. Existing filmography data sorting, deduplication and saved scroll position remain. Android-only.







