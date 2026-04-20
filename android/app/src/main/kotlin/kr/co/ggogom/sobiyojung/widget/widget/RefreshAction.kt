package kr.co.ggogom.sobiyojung.widget.widget

import android.content.Context
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
        runCatching { StoreRepository(context.applicationContext).refresh() }
        runCatching { ShoppingListWidget().updateAll(context.applicationContext) }
    }
}
