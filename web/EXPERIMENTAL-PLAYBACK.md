# Experimental web playback integration

This is a local staging integration, not a deployed production update. LG and native Android source/package files are unchanged. Phase21 direct playback and Phase23/24 research remain separate.

## Run

In PowerShell at the workspace root:

```powershell
$env:MJ_WEB_STAGING='1'
$env:MJ_WEB_EXPERIMENTAL_EMBEDS='1'
node web/build.mjs
$env:PORT='8150'
$env:HOST='0.0.0.0'
node web/server.mjs
```

Build output is `web/staging-public`, separate from `web/public`. Normal builds do not enable the experiment, even if a browser previously selected it. No deployment was performed.

Open http://127.0.0.1:8150/ on the laptop or http://192.168.1.3:8150/ on the same Wi-Fi. Preferences → Experimental web playback → VidRift with MJ controls. Browse/search normally, open details and press Play. The default remains MJ direct playback.

## Integrated behavior

* Uses the real catalogue/detail/Play flow and existing MJ controls.
* Fixed provider origin and exact TMDB movie/TV/season/episode routes; validates message origin, iframe window, reported identity and progress bounds.
* MJ-owned screen input. The iframe receives no ordinary pointer clicks. No ad-blocker, sandbox bypass, script injection or popup interception.
* Provider-reported quality, audio and subtitle choices in MJ's options panel. Selection is not proof of subtitle timing or alternate-track audio quality.
* Shared viewing progress/resume storage; existing next-episode callback invoked on provider completion when autoplay is enabled. These integration paths need further live validation.
* Explicit startup timeout, manual Retry and Use MJ direct player. Switching to direct disposes iframe/listeners before mounting the existing direct transport. No automatic retry loop.
* Parent fullscreen and F shortcut; unsupported/denied fullscreen is explained. Physical installed-iPhone-PWA fullscreen remains unverified.

The provider controls resolution, decoding, availability and media delivery. This integration does not route continuous video through MJ's server. It does not guarantee advertisement suppression or free supplier capacity.

## Validation on 2026-11-02

Relevant policy, identity, preference gate, browser history, shortcut, diagnostics, direct-source filtering and recovery checks passed. Staging built successfully; no source directory or tested private markers appeared in the bundled output. Build warnings about duplicate `restarted` fields originate in the existing PlayerPage source, which was not changed for TV.

Chrome exercised real search → The Dark Knight (2008) → Details → Play → integrated VidRift transport. Preference selection survived close/reopen and page reload. The iframe had a 1280×622 display area. The live provider did **not** deliver advancing playback within the bounded startup window; MJ displayed the expected startup error and recovery choices. Matching the research URL's exact query serialization did not establish a successful integrated playback result. The user also reported playback unavailable in the phone browser's experimental mode.

Therefore the integration code is available for staging, but real integrated playback is **not yet validated**. Do not promote it to production or describe earlier isolated-player successes as successful app integration. The next issue is determining why the provider initializes inconsistently in the integrated flow. No further blind retries are warranted without new diagnostics.

## Startup follow-up
The earlier failure above is superseded by two successful foreground Chrome app sessions using explicit MJ activation and a disposable playback portal. See research/phase24/INTEGRATION-STARTUP-FIX.md for actual decoded-video, pause, seek, resume and cleanup evidence and remaining mobile/fullscreen limitations. Press Play on the ready screen. This remains local experimental staging, not a production release.
