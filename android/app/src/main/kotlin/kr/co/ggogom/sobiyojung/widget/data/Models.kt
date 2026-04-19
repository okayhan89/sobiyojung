package kr.co.ggogom.sobiyojung.widget.data

import kotlinx.serialization.Serializable

@Serializable
data class StoreSummary(
    val store_id: String,
    val name: String,
    val slug: String,
    val icon: String? = null,
    val color: String? = null,
    val sort_order: Int = 0,
    val open_count: Long = 0L,
)
