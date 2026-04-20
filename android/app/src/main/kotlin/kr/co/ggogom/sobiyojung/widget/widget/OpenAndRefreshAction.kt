package kr.co.ggogom.sobiyojung.widget.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import kr.co.ggogom.sobiyojung.widget.sync.RefreshWorker
import java.util.concurrent.TimeUnit

/**
 * Opens a URL in the browser and schedules a short-delayed background refresh
 * so that when the user returns to the home screen after adding/editing items,
 * the widget has already fetched fresh data.
 */
class OpenAndRefreshAction : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: ActionParameters,
    ) {
        val url = parameters[urlKey]
        if (!url.isNullOrBlank()) {
            runCatching {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            }
        }

        runCatching {
            val wm = WorkManager.getInstance(context.applicationContext)
            val quick = OneTimeWorkRequestBuilder<RefreshWorker>()
                .setInitialDelay(15, TimeUnit.SECONDS)
                .build()
            val slow = OneTimeWorkRequestBuilder<RefreshWorker>()
                .setInitialDelay(45, TimeUnit.SECONDS)
                .build()
            wm.enqueue(listOf(quick, slow))
        }
    }

    companion object {
        val urlKey = ActionParameters.Key<String>("url")
    }
}
