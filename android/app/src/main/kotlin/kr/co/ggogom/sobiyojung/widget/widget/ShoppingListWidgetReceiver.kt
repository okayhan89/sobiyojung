package kr.co.ggogom.sobiyojung.widget.widget

import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

/**
 * Minimal receiver. Glance's docs are explicit:
 *   > If you override any of the methods of this class, you must call the
 *   > super implementation, and you must not call AppWidgetProvider.goAsync,
 *   > as it will be called by the super implementation.
 *
 * A previous revision overrode `onUpdate` and fired off an extra `updateAll`
 * from a detached `CoroutineScope(Dispatchers.IO)`. That ran in parallel with
 * the super's own `goAsync` + `update(appWidgetId)` flow and competed for the
 * same `GlanceSessionManager` lock. Whichever session lost the race left stale
 * `RemoteViews` on the host with PendingIntents that pointed at the
 * already-closed session — which is a textbook way to make `actionRunCallback`
 * taps silently no-op even though the manifest receiver is correctly wired.
 *
 * Opportunistic refresh is handled by `RefreshWorker` (WorkManager) + user
 * taps (`RefreshAction`). No extra override needed here.
 */
class ShoppingListWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = ShoppingListWidget()
}
