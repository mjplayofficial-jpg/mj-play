# MJ Play

MJ Entertainment's TV-first packaged LG webOS app, developed for the LG 65UR80506LK at 1920×1080. Version 1.1.1 implements the authorized Phase 2 features. See [PHASE-2-STATUS.md](PHASE-2-STATUS.md) for scope, verification and remaining physical-TV checks. Earlier phase notes are historical.

## Features

Live TMDB Home shelves, movies/series, search with media filters, details, seasons/episodes, IMDb external IDs, spatial remote navigation, My List, local Continue Watching, and Settings for VidSrc/Demo playback selection. Series use Choose Episode and Open last episode when history exists. Continue Watching remembers the last opened title/episode, without claiming playback-time resume or completion.

VidSrc is the user-supplied Phase 1.6 iframe test provider. Movie and TV templates live only in `src/config/playback.js`. DemoProvider retains the public W3Schools Big Buck Bunny video for diagnostics; demo playback does not modify real-title history. Third-party iframe menus require the Magic Remote pointer; MJ Play reclaims keyboard focus for remote BACK. Provider prompts and ads remain provider-controlled.

## Structure

`src/app.js` connects routing and actions; `router.js` preserves opener focus/scroll. `services/tmdb.js` centralizes catalogue requests with a five-minute bounded memory cache and shared in-flight requests. `providers/` separates URL construction from the UI. `components/` contains cards, labels, iframe creation and remote focus ownership. `navigation/FocusManager.js` handles directional navigation. `storage/library.js` stores validated, minimal local metadata. `pages/` contains Home, Browse, Search, Details, Player, My List and Settings. `styles/main.css` holds the TV layout. Runtime assets and the provided logo live in `assets/`. `tests/` and `tools/` are not packaged.

No runtime framework or npm dependencies. Node 22.22.0, npm 10.9.4 and webOS CLI 3.2.3 were used.

## Windows setup

Install Node.js LTS from its official site if Node/npm are missing, then install LG's CLI if needed:

```powershell
npm install -g @webos-tools/cli
ares -V
ares-config --profile tv
```

Use `npm.cmd` and `ares-*.cmd` if PowerShell blocks script shims. Your prepared TV is already configured as `mjtv`, host `192.168.1.11`, port `9922`, user `prisoner`. Check connectivity with:

```powershell
ares-device --system-info --device mjtv
```

If the IP changes, update its host with `ares-setup-device --modify mjtv --info host=NEW_IP`. If authentication actually fails, run `ares-novacom --device mjtv --getkey` and enter the TV's temporary passphrase interactively. Keep credentials out of source code/chat. Avoid posting raw device lists, which can expose saved passphrases.

## TMDB configuration

The ignored `src/config/config.local.js` contains your local credential. To set up a fresh checkout, copy `config.example.js` to `config.local.js` and set either `tmdbApiKey` (v3 key) or `tmdbReadToken` (read token). Empty configuration uses the labeled demo catalogue. Failed live requests show an error instead of silently switching catalogues.

Client-side credentials are included in the private TV package; do not publish configured IPKs or the local configuration file. TMDB supplies metadata, not video. The app includes its API attribution; public distribution would also require review of applicable branding/provider requirements.

## Preview, check and deploy

```powershell
npm start
# Open http://127.0.0.1:8080
npm test
npm run validate
npm run package
ares-package --check dist/app
ares-launch --device mjtv --close com.mjentertainment.mjplay
ares-install --device mjtv dist/com.mjentertainment.mjplay_1.1.1_all.ipk
ares-launch --device mjtv com.mjentertainment.mjplay
```

Packaging stages only runtime files in `dist/app`. CLI 3.2.3's default minifier failed on the app syntax; the packaging script uses the supported `--no-minify` option. Repackage after configuration or source changes.

Use arrows, Enter and Escape/Backspace to simulate remote navigation in the browser. On TV, BACK keycode 461 is handled internally with `disableBackHistoryAPI: true`. After all navigation history is exhausted at Home, BACK opens a Close MJ Play confirmation. Keep Watching or BACK cancels; Close App exits. The search box is a navigable button; click or OK opens the native input. Enter submits, blurs the input and focuses Search. BACK dismisses editing without leaving Search. RIGHT moves from the box to Search and Clear.

## Playback and storage

`src/config/playback.js` defaults to VidSrc, overridden by a locally saved Settings selection. `createPlaybackProvider` retains generic embed support for future explicitly supplied HTTPS templates. Supported substitutions: `{imdbId}`, `{tmdbId}`, `{season}`, `{episode}`. Invalid IDs, insecure URLs, host substitution, credentials and unknown placeholders are rejected.

Sandboxing is configurable per provider. VidSrc explicitly uses `useSandbox: false`, completely omitting the sandbox attribute. Future generic providers default to sandboxing; configured sandbox flags remain supported. Media permissions include autoplay, fullscreen, encrypted-media and picture-in-picture.

The player has loading/error/retry handling and disposes media and the remote focus timer when leaving. Cross-origin iframe load indicates a document opened, not proof of successful video or absence of embedding restrictions. The app cannot inspect cross-origin video progress. No scraping, underlying stream extraction, token reversal, authentication bypass or iframe script injection is implemented.

LocalStorage keys: `mjplay.favorites.v1`, `mjplay.recent.v1`, `mjplay.provider.v1`. My List retains up to 200 titles; history up to 40. Metadata is validated on read. Storage failures don't prevent playback and save actions report failure. Clearing TV application data or uninstalling may erase it. Accounts/profiles/cloud sync remain Phase 3 work.

## Debugging

```powershell
ares-inspect --device mjtv com.mjentertainment.mjplay
ares-device --system-info --device mjtv
ares-launch --help
ares-install --help
```

Use the inspector URL returned by the installed CLI. Share only redacted errors; authenticated requests/configuration can contain secrets. For slow or blocked players, use retry/back or Settings → Demo to distinguish provider behavior from app playback. Provider prompts and the previously reported isolated unexpected exit require provider-specific observation; an ad cause has not been confirmed.

