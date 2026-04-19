# Keep Kotlin serialization generated classes
-keepclassmembers class ** {
    *** Companion;
}
-keepclasseswithmembers class ** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep class kr.co.ggogom.sobiyojung.widget.data.** { *; }

# Glance widgets
-keep class androidx.glance.appwidget.** { *; }
