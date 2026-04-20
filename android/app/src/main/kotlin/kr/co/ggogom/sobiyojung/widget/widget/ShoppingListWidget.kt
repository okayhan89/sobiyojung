package kr.co.ggogom.sobiyojung.widget.widget

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.action.actionParametersOf
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import kr.co.ggogom.sobiyojung.widget.BuildConfig
import kr.co.ggogom.sobiyojung.widget.MainActivity
import kr.co.ggogom.sobiyojung.widget.data.Prefs
import kr.co.ggogom.sobiyojung.widget.data.StoreRepository
import kr.co.ggogom.sobiyojung.widget.data.StoreSummary

class ShoppingListWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact
    override val stateDefinition: GlanceStateDefinition<*> =
        PreferencesGlanceStateDefinition

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val inviteCode = Prefs.getInviteCode(context)
        val cached = Prefs.getStoreCache(context)
        val lastFetchAt = Prefs.getLastFetchAt(context)
        val now = System.currentTimeMillis()
        val stale = lastFetchAt == null || (now - lastFetchAt) > STALE_THRESHOLD_MS

        val stores = when {
            inviteCode == null -> emptyList()
            cached.isEmpty() || stale -> StoreRepository(context).refresh()
            else -> cached
        }
        val effectiveLastFetch = Prefs.getLastFetchAt(context)

        provideContent {
            GlanceTheme {
                WidgetUI(
                    stores = stores,
                    hasInviteCode = inviteCode != null,
                    lastFetchAt = effectiveLastFetch,
                )
            }
        }
    }
}

private const val BG_COLOR = 0xFFFEF7F9.toInt()
private const val ITEM_LIMIT = 3
private const val STALE_THRESHOLD_MS = 30 * 1000L

@Composable
private fun WidgetUI(
    stores: List<StoreSummary>,
    hasInviteCode: Boolean,
    lastFetchAt: Long?,
) {
    val context = LocalContext.current
    val openSetup = actionStartActivity(
        Intent(context, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
    )
    val openWeb = actionRunCallback<OpenAndRefreshAction>(
        actionParametersOf(OpenAndRefreshAction.urlKey to BuildConfig.SITE_URL),
    )
    val headerAction = if (hasInviteCode) openWeb else openSetup
    val refresh = actionRunCallback<RefreshAction>()

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(Color(BG_COLOR))
            .cornerRadius(18.dp)
            .padding(horizontal = 8.dp, vertical = 8.dp),
    ) {
        Row(
            modifier = GlanceModifier
                .fillMaxWidth()
                .padding(bottom = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "🧚‍♀️ 소비요정",
                style = TextStyle(
                    color = ColorProvider(Color(0xFF2A1A24)),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                ),
                modifier = GlanceModifier.defaultWeight().clickable(headerAction),
            )
            Text(
                text = formatLastFetch(lastFetchAt),
                style = TextStyle(
                    color = ColorProvider(Color(0xFFA8949C)),
                    fontSize = 9.sp,
                ),
                modifier = GlanceModifier.padding(end = 6.dp),
            )
            Text(
                text = "↻",
                style = TextStyle(
                    color = ColorProvider(Color(0xFFA8949C)),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                ),
                modifier = GlanceModifier
                    .padding(horizontal = 4.dp)
                    .clickable(refresh),
            )
        }

        if (!hasInviteCode) {
            EmptyMessage(
                text = context.getString(
                    kr.co.ggogom.sobiyojung.widget.R.string.widget_empty,
                ),
                onClick = headerAction,
            )
            return@Column
        }

        if (stores.isEmpty()) {
            EmptyMessage(text = "불러오는 중…", onClick = headerAction)
            return@Column
        }

        stores.forEachIndexed { index, store ->
            if (index > 0) Spacer(modifier = GlanceModifier.height(4.dp))
            StoreBlock(store = store)
        }
    }
}

@Composable
private fun EmptyMessage(text: String, onClick: androidx.glance.action.Action) {
    Box(
        modifier = GlanceModifier.fillMaxSize().clickable(onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            style = TextStyle(
                color = ColorProvider(Color(0xFFA8949C)),
                fontSize = 11.sp,
            ),
        )
    }
}

@Composable
private fun StoreBlock(store: StoreSummary) {
    val accent = parseHexColor(store.color) ?: Color(0xFFE85A9A)
    val openAction = actionRunCallback<OpenAndRefreshAction>(
        actionParametersOf(
            OpenAndRefreshAction.urlKey to "${BuildConfig.SITE_URL}/s/${store.slug}",
        ),
    )

    val previewItems = store.open_items.take(ITEM_LIMIT)
    val overflow = (store.open_count - previewItems.size).coerceAtLeast(0L)
    val itemsText = when {
        store.open_count == 0L -> "비어있음"
        previewItems.isEmpty() -> "${store.open_count}개 있음"
        overflow > 0L ->
            previewItems.joinToString("\n") { "· $it" } + "\n+ ${overflow}개 더"
        else -> previewItems.joinToString("\n") { "· $it" }
    }

    Box(
        modifier = GlanceModifier
            .fillMaxWidth()
            .cornerRadius(12.dp)
            .background(Color.White)
            .padding(horizontal = 9.dp, vertical = 7.dp)
            .clickable(openAction),
    ) {
        Column(modifier = GlanceModifier.fillMaxWidth()) {
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = GlanceModifier
                        .size(22.dp)
                        .cornerRadius(7.dp)
                        .background(accent.copy(alpha = 0.18f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = store.icon ?: "🛒",
                        style = TextStyle(fontSize = 12.sp),
                    )
                }
                Spacer(modifier = GlanceModifier.width(6.dp))
                Text(
                    text = store.name,
                    style = TextStyle(
                        color = ColorProvider(Color(0xFF2A1A24)),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                    ),
                    modifier = GlanceModifier.defaultWeight(),
                )
                if (store.open_count > 0L) {
                    Box(
                        modifier = GlanceModifier
                            .cornerRadius(9.dp)
                            .background(accent)
                            .padding(horizontal = 6.dp, vertical = 1.dp),
                    ) {
                        Text(
                            text = store.open_count.toString(),
                            style = TextStyle(
                                color = ColorProvider(Color.White),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                            ),
                        )
                    }
                }
            }
            Spacer(modifier = GlanceModifier.height(3.dp))
            Text(
                text = itemsText,
                style = TextStyle(
                    color = ColorProvider(
                        if (store.open_count == 0L) Color(0xFFA8949C) else Color(0xFF6A5560),
                    ),
                    fontSize = 11.sp,
                ),
                maxLines = ITEM_LIMIT + 1,
            )
        }
    }
}

private fun formatLastFetch(lastFetchAt: Long?): String {
    if (lastFetchAt == null) return ""
    val diffSec = (System.currentTimeMillis() - lastFetchAt) / 1000L
    return when {
        diffSec < 10 -> "방금"
        diffSec < 60 -> "${diffSec}초 전"
        diffSec < 3600 -> "${diffSec / 60}분 전"
        diffSec < 86_400 -> "${diffSec / 3600}시간 전"
        else -> "${diffSec / 86_400}일 전"
    }
}

private fun parseHexColor(hex: String?): Color? {
    if (hex.isNullOrBlank()) return null
    val trimmed = hex.trim().removePrefix("#")
    if (trimmed.length != 6) return null
    return runCatching {
        Color(
            red = trimmed.substring(0, 2).toInt(16) / 255f,
            green = trimmed.substring(2, 4).toInt(16) / 255f,
            blue = trimmed.substring(4, 6).toInt(16) / 255f,
            alpha = 1f,
        )
    }.getOrNull()
}
