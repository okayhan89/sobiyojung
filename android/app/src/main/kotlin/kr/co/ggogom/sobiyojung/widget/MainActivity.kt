package kr.co.ggogom.sobiyojung.widget

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll
import kotlinx.coroutines.launch
import kr.co.ggogom.sobiyojung.widget.data.Prefs
import kr.co.ggogom.sobiyojung.widget.data.StoreRepository
import kr.co.ggogom.sobiyojung.widget.widget.ShoppingListWidget

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { OnboardingScreen() }
    }
}

@Composable
private fun OnboardingScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var code by remember { mutableStateOf("") }
    var status by remember { mutableStateOf<Status>(Status.Idle) }

    LaunchedEffect(Unit) {
        Prefs.getInviteCode(context)?.let { code = it }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFFFFD5E3),
                        Color(0xFFFEF7F9),
                    ),
                )
            )
            .padding(24.dp),
    ) {
        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .background(Color(0xFFFFD5E3), RoundedCornerShape(24.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text(text = "🧚‍♀️", fontSize = 36.sp)
            }

            Spacer(Modifier.height(20.dp))

            Text(
                text = stringRes(R.string.onboarding_title),
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp,
                color = Color(0xFF2A1A24),
            )

            Spacer(Modifier.height(6.dp))

            Text(
                text = stringRes(R.string.onboarding_subtitle),
                fontSize = 14.sp,
                color = Color(0xFF6A5560),
            )

            Spacer(Modifier.height(24.dp))

            OutlinedTextField(
                value = code,
                onValueChange = { code = it.uppercase().filter(Char::isLetterOrDigit).take(8) },
                label = { Text(stringRes(R.string.invite_code_hint)) },
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White,
                    focusedIndicatorColor = Color(0xFFE85A9A),
                ),
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(12.dp))

            Button(
                onClick = {
                    val cleaned = code.trim().uppercase()
                    if (cleaned.length < 4) {
                        status = Status.Invalid
                        return@Button
                    }
                    status = Status.Saving
                    scope.launch {
                        Prefs.saveInviteCode(context, cleaned)
                        StoreRepository(context).refresh()
                        ShoppingListWidget().updateAll(context)
                        GlanceAppWidgetManager(context) // warm the manager
                        status = Status.Saved
                    }
                },
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFE85A9A),
                    contentColor = Color.White,
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
            ) {
                Text(
                    text = when (status) {
                        Status.Saving -> "저장 중…"
                        else -> stringRes(R.string.save_code)
                    },
                    fontWeight = FontWeight.SemiBold,
                )
            }

            Spacer(Modifier.height(12.dp))

            OutlinedButton(
                onClick = {
                    startActivity(
                        context,
                        Intent(Intent.ACTION_VIEW, Uri.parse(BuildConfig.SITE_URL)),
                    )
                },
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
            ) {
                Text(text = stringRes(R.string.open_web))
            }

            Spacer(Modifier.height(16.dp))

            when (status) {
                Status.Saved -> StatusBanner(
                    message = stringRes(R.string.saved_code),
                    color = Color(0xFF16803C),
                )

                Status.Invalid -> StatusBanner(
                    message = stringRes(R.string.invalid_code),
                    color = Color(0xFFE5484D),
                )

                else -> Unit
            }
        }
    }
}

@Composable
private fun StatusBanner(message: String, color: Color) {
    Text(
        text = AnnotatedString(message),
        color = color,
        fontSize = 13.sp,
    )
}

@Composable
private fun stringRes(id: Int): String {
    val context = LocalContext.current
    return context.getString(id)
}

private fun startActivity(context: android.content.Context, intent: Intent) {
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
}

private sealed interface Status {
    data object Idle : Status
    data object Saving : Status
    data object Saved : Status
    data object Invalid : Status
}
