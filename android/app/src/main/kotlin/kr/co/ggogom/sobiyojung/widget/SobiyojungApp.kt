package kr.co.ggogom.sobiyojung.widget

import android.app.Application
import kr.co.ggogom.sobiyojung.widget.sync.RefreshScheduler

class SobiyojungApp : Application() {
    override fun onCreate() {
        super.onCreate()
        RefreshScheduler.schedule(this)
    }
}
