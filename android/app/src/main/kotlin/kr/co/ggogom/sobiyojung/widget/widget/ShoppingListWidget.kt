package kr.co.ggogom.sobiyojung.widget.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxHeight
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
        val stores = when {
            inviteCode == null -> emptyList()
            cached.isNotEmpty() -> cached
            else -> StoreRepository(context).refresh() // cold start: block once
        }

        provideContent {
            GlanceTheme {
                WidgetUI(stores = stores, hasInviteCode = inviteCode != null)
            }
        }
    }
}

private const val BG_COLOR = 0xFFFEF7F9.toInt()
private const val TILE_BORDER_COLOR = 0x1F8A1B52.toInt()

@Composable
private fun WidgetUI(stores: List<StoreSummary>, hasInviteCode: Boolean) {
    val context = LocalContext.current

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(Color(BG_COLOR))
            .cornerRadius(20.dp)
            .padding(10.dp),
    ) {
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "🧚‍♀️  소비요정",
                style = TextStyle(
                    color = ColorProvider(Color(0xFF2A1A24)),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                ),
                modifier = GlanceModifier
                    .defaultWeight()
                    .clickable(actionStartActivity<MainActivity>()),
            )
            Text(
                text = "↻",
                style = TextStyle(
                    color = ColorProvider(Color(0xFFA8949C)),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                ),
                modifier = GlanceModifier
                    .padding(horizontal = 6.dp)
                    .clickable(actionStartActivity<MainActivity>()),
            )
        }

        Spacer(modifier = GlanceModifier.height(8.dp))

        if (!hasInviteCode) {
            EmptyMessage(
                text = context.getString(
                    kr.co.ggogom.sobiyojung.widget.R.string.widget_empty
                ),
            )
            return@Column
        }

        if (stores.isEmpty()) {
            EmptyMessage(text = "불러오는 중…")
            return@Column
        }

        val rows = stores.chunked(2)
        rows.forEachIndexed { index, pair ->
            if (index > 0) Spacer(modifier = GlanceModifier.height(6.dp))
            Row(modifier = GlanceModifier.fillMaxWidth()) {
                StoreTile(
                    store = pair[0],
                    modifier = GlanceModifier.defaultWeight().fillMaxHeight(),
                )
                if (pair.size > 1) {
                    Spacer(modifier = GlanceModifier.width(6.dp))
                    StoreTile(
                        store = pair[1],
                        modifier = GlanceModifier.defaultWeight().fillMaxHeight(),
                    )
                } else {
                    // keep grid width even when odd count
                    Spacer(modifier = GlanceModifier.defaultWeight())
                }
            }
        }
    }
}

@Composable
private fun EmptyMessage(text: String) {
    Box(
        modifier = GlanceModifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            style = TextStyle(
                color = ColorProvider(Color(0xFFA8949C)),
                fontSize = 12.sp,
            ),
            modifier = GlanceModifier.clickable(actionStartActivity<MainActivity>()),
        )
    }
}

@Composable
private fun StoreTile(store: StoreSummary, modifier: GlanceModifier = GlanceModifier) {
    val accent = parseHexColor(store.color) ?: Color(0xFFE85A9A)
    val openAction = actionStartActivity(
        Intent(Intent.ACTION_VIEW, Uri.parse("${BuildConfig.SITE_URL}/s/${store.slug}"))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    )

    Box(
        modifier = modifier
            .cornerRadius(14.dp)
            .background(Color.White)
            .padding(10.dp)
            .clickable(openAction),
    ) {
        Column(modifier = GlanceModifier.fillMaxSize()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = GlanceModifier
                        .size(28.dp)
                        .cornerRadius(8.dp)
                        .background(accent.copy(alpha = 0.18f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = store.icon ?: "🛒",
                        style = TextStyle(fontSize = 15.sp),
                    )
                }
                Spacer(modifier = GlanceModifier.width(6.dp))
                if (store.open_count > 0) {
                    Box(
                        modifier = GlanceModifier
                            .cornerRadius(10.dp)
                            .background(accent)
                            .padding(horizontal = 6.dp, vertical = 1.dp),
                    ) {
                        Text(
                            text = store.open_count.toString(),
                            style = TextStyle(
                                color = ColorProvider(Color.White),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                            ),
                        )
                    }
                }
            }
            Spacer(modifier = GlanceModifier.defaultWeight())
            Text(
                text = store.name,
                style = TextStyle(
                    color = ColorProvider(Color(0xFF2A1A24)),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                ),
            )
            Text(
                text = if (store.open_count > 0) "${store.open_count}개 고민중" else "비어있음",
                style = TextStyle(
                    color = ColorProvider(Color(0xFFA8949C)),
                    fontSize = 10.sp,
                ),
            )
        }
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
