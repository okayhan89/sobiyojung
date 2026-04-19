package kr.co.ggogom.sobiyojung.widget.data

import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.headers
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import kr.co.ggogom.sobiyojung.widget.BuildConfig

class SupabaseApi(
    private val baseUrl: String = BuildConfig.SUPABASE_URL,
    private val anonKey: String = BuildConfig.SUPABASE_ANON_KEY,
) {
    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }

    private val client = HttpClient(OkHttp) {
        engine {
            config {
                retryOnConnectionFailure(true)
            }
        }
        install(ContentNegotiation) {
            json(json)
        }
        expectSuccess = false
    }

    suspend fun widgetSummary(inviteCode: String): Result<List<StoreSummary>> = runCatching {
        val url = "$baseUrl/rest/v1/rpc/widget_summary"
        val response: HttpResponse = client.post(url) {
            contentType(ContentType.Application.Json)
            headers {
                append("apikey", anonKey)
                append("Authorization", "Bearer $anonKey")
                append("Accept-Profile", "sobiyojung")
                append("Content-Profile", "sobiyojung")
            }
            setBody(InviteCodeBody(p_invite_code = inviteCode.trim().uppercase()))
        }
        val body = response.bodyAsText()
        if (response.status.value !in 200..299) {
            throw IllegalStateException("Supabase RPC ${response.status.value}: $body")
        }
        json.decodeFromString<List<StoreSummary>>(body)
    }

    fun close() = client.close()
}

@kotlinx.serialization.Serializable
private data class InviteCodeBody(val p_invite_code: String)
