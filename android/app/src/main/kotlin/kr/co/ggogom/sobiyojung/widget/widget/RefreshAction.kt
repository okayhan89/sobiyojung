package kr.co.ggogom.sobiyojung.widget.widget

import android.content.Context
import android.util.Log
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.updateAll
import kr.co.ggogom.sobiyojung.widget.data.StoreRepository

class RefreshAction : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: ActionParameters,
    ) {
        val appContext = context.applicationContext
        val widget = ShoppingListWidget()

        // Re-render immediately so user sees the ↻ tap was received.
        runCatching { widget.update(appContext, glanceId) }

        val result = runCatching { StoreRepository(appContext).refresh() }
        Log.d(TAG, "refresh result: isSuccess=${result.isSuccess} size=${result.getOrNull()?.size}")

        // Re-render again with the freshly fetched data.
        runCatching { widget.updateAll(appContext) }
    }

    private companion object {
        const val TAG = "SobiyojungWidget"
    }
}
