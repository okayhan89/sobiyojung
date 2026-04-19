plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.kotlinAndroid)
    alias(libs.plugins.kotlinSerialization)
    alias(libs.plugins.kotlinCompose)
}

android {
    namespace = "kr.co.ggogom.sobiyojung.widget"
    compileSdk = 35

    defaultConfig {
        applicationId = "kr.co.ggogom.sobiyojung.widget"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    // Inject Supabase public config at build time from gradle.properties / env.
    // Both are public values (URL + anon/publishable key) and safe to ship.
    defaultConfig {
        val supabaseUrl: String =
            (project.findProperty("SUPABASE_URL") as String?)
                ?: System.getenv("SUPABASE_URL")
                ?: "https://xqvdwkfitftqnmceuzlp.supabase.co"
        val supabaseAnonKey: String =
            (project.findProperty("SUPABASE_ANON_KEY") as String?)
                ?: System.getenv("SUPABASE_ANON_KEY")
                ?: "sb_publishable_556-MSrP8wx1pYN7fp6opw_7BWss8YL"
        val siteUrl: String =
            (project.findProperty("SITE_URL") as String?)
                ?: System.getenv("SITE_URL")
                ?: "https://sobiyojung.ggogom.co.kr"

        buildConfigField("String", "SUPABASE_URL", "\"$supabaseUrl\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"$supabaseAnonKey\"")
        buildConfigField("String", "SITE_URL", "\"$siteUrl\"")
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)

    implementation(libs.androidx.glance.appwidget)
    implementation(libs.androidx.glance.material3)

    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.androidx.datastore.preferences)

    implementation(libs.ktor.client.core)
    implementation(libs.ktor.client.okhttp)
    implementation(libs.ktor.client.content.negotiation)
    implementation(libs.ktor.serialization.json)

    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)
}
