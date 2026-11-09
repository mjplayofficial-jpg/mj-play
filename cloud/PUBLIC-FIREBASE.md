# Public MJ Play Firebase

Project: `mj-play-web` (Spark; no billing upgrade).

Web, Android release and Android preview are registered. Household backup stays separate.

## Remote Config

Published client parameters:

| Key | Default | Effect |
| --- | --- | --- |
| vod_enabled | true | Allows new movie/series sessions |
| live_tv_enabled | true | Allows new Live TV sessions |
| sports_enabled | true | Allows new sports sessions |
| maintenance_message | empty | Nonempty pauses new playback and shows maintenance text |
| min_android_version | 0 | Minimum Android versionCode; 0 disables the requirement |

Android 0.1.19+ uses real-time Remote Config updates while open, a five-minute foreground fetch cache, and a zero-cache fetch for manual refresh. Older clients retain their previous fetch interval. Existing playback is not interrupted. Cached/in-app defaults remain usable if Firebase is unavailable. These flags are client behavior controls, not authorization or security boundaries. Never put secrets or private media links in Remote Config.

## Diagnostics

Web analytics starts only after Allow analytics; honours Do Not Track / Global Privacy Control. Change the preference using Privacy & analytics in the footer.

Android analytics and Crashlytics start only after Allow diagnostics. Android 0.1.20+ asks only when no choice is saved, then exposes a Share diagnostics switch in Privacy. The choice survives normal app updates.

Custom events: section_view, playback_requested, playback_started, playback_failed, playback_buffering, playback_ended. Events contain section/content type and bounded timing/error codes, not title names, search queries, account names, media URLs or authorization headers. SDK-generated installation/session/device data is handled by Firebase. Do not forward original Media3 playback exceptions to Crashlytics: their causes can contain signed URLs; nonfatal reports use sanitized codes.

## Verification and operation

Web: deploy build through the existing private Render repository. Inspect Analytics Realtime after opting in. Report dashboards can take time to populate; network/ad blockers can suppress diagnostics without breaking playback.

Android: build with Java 17 (`C:/Users/james/.jdks/ms-17.0.18`), not the installed Studio Java 25 runtime. APK: `android/MJPlay/app/build/outputs/apk/debug/app-debug.apk`, version 0.1.13 (14). Install on a connected phone and opt in. Crashlytics end-to-end delivery still needs device verification; no deliberate crash is triggered in normal app use.

No user authentication, cross-device backup, paid hosting, or Firestore access is introduced by this integration.

## Remote sidebar and announcements
Published Remote Config version 2 adds community_links, drawer_header, support_content and announcement for Android 0.1.17+. Defaults leave links, header image and announcements hidden. See REMOTE-CONTENT.md for editing examples and validation behavior. Web and LG TV adoption remains separate.



