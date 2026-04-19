package kr.co.ggogom.sobiyojung.widget.data

import android.content.Context

class StoreRepository(private val appContext: Context) {
    private val api = SupabaseApi()

    /**
     * Fetches fresh store summary and caches it. Returns the list on success
     * or the previously cached list on failure (so the widget stays useful
     * offline).
     */
    suspend fun refresh(): List<StoreSummary> {
        val code = Prefs.getInviteCode(appContext)
            ?: return Prefs.getStoreCache(appContext)

        val result = api.widgetSummary(code)
        return result.fold(
            onSuccess = { stores ->
                Prefs.saveStoreCache(appContext, stores)
                stores
            },
            onFailure = {
                Prefs.getStoreCache(appContext)
            },
        )
    }

    suspend fun cached(): List<StoreSummary> = Prefs.getStoreCache(appContext)
}
