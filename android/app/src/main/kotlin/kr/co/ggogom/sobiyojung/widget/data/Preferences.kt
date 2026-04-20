package kr.co.ggogom.sobiyojung.widget.data

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json

private val Context.dataStore by preferencesDataStore(name = "sobiyojung_prefs")

object Prefs {
    private val INVITE_CODE: Preferences.Key<String> = stringPreferencesKey("invite_code")
    private val STORE_CACHE: Preferences.Key<String> = stringPreferencesKey("store_cache_json")
    private val LAST_FETCH_AT: Preferences.Key<Long> = longPreferencesKey("last_fetch_at_ms")

    private val json = Json { ignoreUnknownKeys = true }

    fun inviteCodeFlow(context: Context): Flow<String?> =
        context.dataStore.data.map { it[INVITE_CODE]?.takeIf(String::isNotBlank) }

    suspend fun getInviteCode(context: Context): String? =
        context.dataStore.data.map { it[INVITE_CODE] }.first()?.takeIf(String::isNotBlank)

    suspend fun saveInviteCode(context: Context, code: String) {
        val normalized = code.trim().uppercase()
        context.dataStore.edit { prefs ->
            val previous = prefs[INVITE_CODE]
            prefs[INVITE_CODE] = normalized
            // If the invite code actually changed, drop the cached stores from the
            // old household so the widget never renders the previous data.
            if (previous != normalized) {
                prefs.remove(STORE_CACHE)
                prefs.remove(LAST_FETCH_AT)
            }
        }
    }

    suspend fun clearInviteCode(context: Context) {
        context.dataStore.edit {
            it.remove(INVITE_CODE)
            it.remove(STORE_CACHE)
            it.remove(LAST_FETCH_AT)
        }
    }

    private val listSerializer = ListSerializer(StoreSummary.serializer())

    suspend fun saveStoreCache(context: Context, stores: List<StoreSummary>) {
        val payload = json.encodeToString(listSerializer, stores)
        context.dataStore.edit {
            it[STORE_CACHE] = payload
            it[LAST_FETCH_AT] = System.currentTimeMillis()
        }
    }

    suspend fun getStoreCache(context: Context): List<StoreSummary> {
        val raw = context.dataStore.data.map { it[STORE_CACHE] }.first() ?: return emptyList()
        return runCatching { json.decodeFromString(listSerializer, raw) }.getOrDefault(emptyList())
    }

    suspend fun getLastFetchAt(context: Context): Long? =
        context.dataStore.data.map { it[LAST_FETCH_AT] }.first()
}
