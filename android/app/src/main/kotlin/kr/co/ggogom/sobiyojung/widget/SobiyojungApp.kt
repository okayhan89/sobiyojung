package kr.co.ggogom.sobiyojung.widget

import android.app.Application
import androidx.glance.appwidget.updateAll
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kr.co.ggogom.sobiyojung.widget.sync.RefreshScheduler
import kr.co.ggogom.sobiyojung.widget.widget.ShoppingListWidget

class SobiyojungApp : Application() {
    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        RefreshScheduler.schedule(this)

        // Re-bind every existing widget instance to the current process on each
        // cold start. This forces Glance to regenerate RemoteViews + PendingIntents
        // so widgets placed before an APK upgrade stop firing the old (broken)
        // callbacks after reinstall.
        appScope.launch {
            runCatching { ShoppingListWidget().updateAll(this@SobiyojungApp) }
        }
    }
}
