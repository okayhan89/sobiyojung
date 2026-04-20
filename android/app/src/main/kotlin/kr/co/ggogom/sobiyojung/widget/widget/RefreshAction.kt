package kr.co.ggogom.sobiyojung.widget.widget

import android.content.Context
import android.util.Log
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.updateAll
import kr.co.ggogom.sobiyojung.widget.data.Prefs
import kr.co.ggogom.sobiyojung.widget.data.StoreRepository

/**
 * Handles ↻ refresh taps.
 *
 * Glance dispatches ActionCallback via a broadcast whose PendingIntent fires on
 * the internal `ActionCallbackBroadcastReceiver`. That receiver wraps us in
 * `goAsync` (≤10s budget) and only after `onAction` returns does the system
 * release the receiver. If we do heavy I/O AND multiple session updates inside
 * that window, we race Glance's own `SessionManager` lock and the whole chain
 * can appear to no-op.
 *
 * Fixes applied here:
 * 1. Nudge `LAST_FETCH_AT` first so the next render always has a fresh "방금"
 *    timestamp — that's the user-visible proof the callback fired, even on an
 *    API/network failure.
 * 2. Do the network refresh WITHOUT calling `update` in the middle; only issue
 *    a single `updateAll` at the end. This avoids concurrent session
 *    acquisitions against the same glanceId.
 */
class RefreshAction : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: ActionParameters,
    ) {
        val appContext = context.applicationContext
        Log.d(TAG, "RefreshAction.onAction fired for $glanceId")

        // 1) Immediately mark "just refreshed" and kick the widget so the
        // timestamp flips to 방금. This is the user-visible proof that the
        // broadcast callback actually fired — independent of network result.
        runCatching { Prefs.markRefreshAttempt(appContext) }
        runCatching { ShoppingListWidget().updateAll(appContext) }

        // 2) Do the actual network fetch. On success this rewrites the cache
        // AND bumps LAST_FETCH_AT again; on failure the cache is preserved.
        val result = runCatching { StoreRepository(appContext).refresh() }
        Log.d(
            TAG,
            "refresh result: isSuccess=${result.isSuccess} size=${result.getOrNull()?.size}",
        )

        // 3) Final render with whatever fresh data we managed to fetch.
        runCatching { ShoppingListWidget().updateAll(appContext) }
    }

    private companion object {
        const val TAG = "SobiyojungWidget"
    }
}
