# Android public release

Public package: `com.mjentertainment.mjplay.android`. Android Studio preview: `.debug` (separate app and signing identity).

## Signing key

The permanent key is ignored at `C:/LGWebOs/deployment/android-signing/mjplay-release.jks`. A second local copy is in that folder; this is **not an off-device disaster-recovery backup**. Password and Gradle properties are local ignored files. Never upload this directory, the password or `signing.local.properties` to the website or GitHub. Copy the key and password to your own secure offline backup before wider distribution. Losing the key prevents updates to installed public apps.

## Publish a release

1. Increase `versionCode` and `versionName` in `app/build.gradle.kts`.
2. Build `:app:assembleRelease` with Java 17. Release signing reads `signing.local.properties`.
3. Run Android SDK `apksigner verify --print-certs` on `app/build/outputs/apk/release/app-release.apk`. Check the certificate matches the first public release.
4. From the workspace root: `node web/build.mjs`, then `node tools/prepare-android-download.mjs`.
5. Review `web/public/downloads/android.json`; the script publishes only the release APK, its size, SHA-256 and metadata. Adjust release notes and `minVersionCode` as appropriate. A required update needs a working published download first.
6. Run `node web/prepareRender.mjs`; review and deploy only the allowlisted web files in the isolated private Render checkout. Keep previous versioned APKs while existing downloads may be in progress.

## Update flow

Public builds check the fixed HTTPS manifest on launch after the diagnostics choice. Preview builds never install public APKs. Newer releases show Update now / Later. Downloaded files must match the manifest size/hash, current package, exact advertised version and existing signing certificate. Only the download directory on the configured backend is accepted; redirects are rejected. Android always asks for installation confirmation. If installation permission is needed, grant it in Android settings, return, and tap Install update. Optional errors never block ordinary use; Firebase minimum-version policy can require an update.

## Current distribution state

The public download/installation/privacy pages and update metadata do not require trial credentials. Catalogue and playback API access still require a private-trial invitation. No trial password is compiled into either APK. This is an invitation-only pilot, not an unrestricted public streaming launch.

Test before wider release: install public v15 on a phone, retain favourites/progress, publish a higher signed test version, update it through the prompt, decline installation once, retry, confirm data remains. No connected device was available during initial release preparation, so end-to-end installer/data-retention testing is pending.

Public release notes must explain changes useful to viewers in plain language. Keep Firebase, hosting, signing, configuration schemas and other implementation details in developer documentation, not in the update manifest notes. Describe only changes actually delivered.

