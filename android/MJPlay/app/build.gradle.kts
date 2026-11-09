import java.util.Properties

plugins {
    id("com.google.gms.google-services")
    id("com.google.firebase.crashlytics")
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}
android {
    namespace = "com.mjentertainment.mjplay.android"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.mjentertainment.mjplay.android"
        minSdk = 26
        targetSdk = 36
        versionCode = 51
        versionName = "0.1.50"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        // Device-side live transport is default; retain a build override for relay diagnostics.
        buildConfigField("boolean", "LOCAL_LIVE_ENABLED", (providers.gradleProperty("mjLocalLive").orNull != "false").toString())
    }
    val signingFile = rootProject.file("signing.local.properties")
    if (signingFile.exists()) {
        val secrets = Properties().apply { signingFile.inputStream().use { load(it) } }
        signingConfigs.create("publicRelease") {
            storeFile = file(secrets.getProperty("storeFile"))
            storePassword = secrets.getProperty("storePassword")
            keyAlias = secrets.getProperty("keyAlias")
            keyPassword = secrets.getProperty("keyPassword")
        }
    }
    buildTypes {
        debug { applicationIdSuffix = ".debug"; versionNameSuffix = "-preview" }
        release { if (signingFile.exists()) signingConfig = signingConfigs.getByName("publicRelease") }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true; buildConfig = true }
}
dependencies {
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
    implementation(platform("com.google.firebase:firebase-bom:34.4.0"))
    implementation("com.google.firebase:firebase-analytics")
    implementation("com.google.firebase:firebase-crashlytics")
    implementation("com.google.firebase:firebase-config")
    implementation(platform("androidx.compose:compose-bom:2025.10.01"))
    implementation("androidx.activity:activity-compose:1.11.0")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    implementation("io.coil-kt:coil-compose:2.7.0")
    implementation("androidx.media3:media3-exoplayer:1.11.1")
    implementation("androidx.media3:media3-exoplayer-hls:1.11.1")
    implementation("androidx.media3:media3-ui:1.11.1")
    androidTestImplementation("androidx.test:runner:1.7.0")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
}















