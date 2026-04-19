package kr.co.ggogom.sobiyojung.widget.sync

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kr.co.ggogom.sobiyojung.widget.data.StoreRepository
import kr.co.ggogom.sobiyojung.widget.widget.ShoppingListWidget

class RefreshWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val repo = StoreRepository(applicationContext)
        runCatching { repo.refresh() }
        // Whether or not the fetch succeeded, push the latest (cached) state
        // into every installed widget instance.
        runCatching {
            GlanceAppWidgetManager(applicationContext)
            ShoppingListWidget().updateAll(applicationContext)
        }
        return Result.success()
    }
}
