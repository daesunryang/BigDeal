package expo.modules.appblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

// 집중 중에 돌아가는 포그라운드 서비스.
// 0.7초마다 지금 화면에 올라온 앱을 확인하고, 차단 앱이면 그 위에 고양이 화면을 덮는다.
class BlockerService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var overlay: View? = null
  private var overlayText: TextView? = null
  private var overlayPkg: String? = null
  private var current: String? = null
  private var lastQuery = 0L
  private var session: BlockerStore.Session? = null

  private val loop = object : Runnable {
    override fun run() {
      tick()
      handler.postDelayed(this, 700)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    session = BlockerStore.load(this)
    val s = session
    if (s == null || s.endAt <= System.currentTimeMillis()) {
      stopSelf()
      return START_NOT_STICKY
    }
    val n = ongoing(s)
    if (Build.VERSION.SDK_INT >= 34) startForeground(NOTI_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    else startForeground(NOTI_ID, n)
    lastQuery = System.currentTimeMillis() - 5000
    handler.removeCallbacks(loop)
    handler.post(loop)
    return START_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(loop)
    hideOverlay()
    super.onDestroy()
  }

  private fun tick() {
    val s = session ?: return stopSelf()
    val now = System.currentTimeMillis()
    if (now >= s.endAt) {
      BlockerStore.clear(this)
      hideOverlay()
      notifyDone(s)
      stopSelf()
      return
    }
    val fg = foregroundPackage(now)
    if (fg != null && fg != current) {
      current = fg
      if (fg in s.packages) {
        BlockerStore.addTry(this, fg)
        listener?.invoke("onBlocked", fg)
        showOverlay(s, fg)
      } else if (fg == packageName || !isOverlayPkg(fg)) {
        hideOverlay()
      }
    }
    overlayText?.text = message(s, overlayPkg ?: "")
  }

  // 시스템 UI(알림창 등)가 잠깐 앞에 와도 덮개를 내리지 않는다
  private fun isOverlayPkg(pkg: String) = pkg == "com.android.systemui"

  private fun foregroundPackage(now: Long): String? {
    val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = try { usm.queryEvents(lastQuery - 2000, now) } catch (_: Exception) { return null }
    lastQuery = now
    var pkg: String? = null
    val e = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      // 1 = ACTIVITY_RESUMED (예전 이름 MOVE_TO_FOREGROUND)
      if (e.eventType == 1) pkg = e.packageName
    }
    return pkg
  }

  private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

  private fun mmss(ms: Long): String {
    val t = ((ms + 999) / 1000).coerceAtLeast(0)
    return String.format("%02d:%02d", t / 60, t % 60)
  }

  private fun message(s: BlockerStore.Session, pkg: String): String {
    val name = s.names[pkg] ?: "이 앱"
    val left = mmss(s.endAt - System.currentTimeMillis())
    return if (s.strict) "${name}은 $left 뒤에 열 수 있어요." else "${name}은 $left 뒤에 열 수 있어요.\n${s.catName}가 기다리고 있어요."
  }

  private fun showOverlay(s: BlockerStore.Session, pkg: String) {
    overlayPkg = pkg
    if (overlay != null) return
    if (!Settings.canDrawOverlays(this)) { openApp(); return }
    val ink = Color.parseColor("#4A3428"); val bg = Color.parseColor("#FBF6EE"); val sub = Color.parseColor("#7A6352")

    val root = object : FrameLayout(this) {
      // 뒤로가기를 눌러도 덮개가 닫히지 않게 막고 집중냥으로 돌려보낸다
      override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) { backToFocus(); return true }
        return super.dispatchKeyEvent(event)
      }
    }
    root.setBackgroundColor(Color.parseColor("#8C2B221D"))
    root.isClickable = true

    val card = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(dp(22), dp(22), dp(22), dp(28))
      background = GradientDrawable().apply { setColor(bg); cornerRadii = floatArrayOf(dp(28).toFloat(), dp(28).toFloat(), dp(28).toFloat(), dp(28).toFloat(), 0f, 0f, 0f, 0f) }
    }
    val img = ImageView(this)
    val res = resources.getIdentifier("jjn_cat_" + s.catImage, "drawable", packageName)
    if (res != 0) img.setImageResource(res)
    card.addView(img, LinearLayout.LayoutParams(dp(110), dp(110)).apply { bottomMargin = dp(14) })

    card.addView(TextView(this).apply {
      text = "지금은 집중 시간이에요"; setTextColor(ink); textSize = 21f; typeface = Typeface.DEFAULT_BOLD; gravity = Gravity.CENTER
    }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(10) })

    val msg = TextView(this).apply { text = message(s, pkg); setTextColor(sub); textSize = 14f; gravity = Gravity.CENTER; setLineSpacing(0f, 1.3f) }
    overlayText = msg
    card.addView(msg, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(16) })

    card.addView(TextView(this).apply {
      text = "집중으로 돌아가기"; setTextColor(bg); textSize = 18f; typeface = Typeface.DEFAULT_BOLD; gravity = Gravity.CENTER
      background = GradientDrawable().apply { setColor(ink); cornerRadius = dp(26).toFloat() }
      setOnClickListener { backToFocus() }
    }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52)))

    if (!s.strict) {
      card.addView(TextView(this).apply {
        text = "그래도 열기 (세션 포기)"; setTextColor(sub); textSize = 13f; gravity = Gravity.CENTER
        paintFlags = paintFlags or android.graphics.Paint.UNDERLINE_TEXT_FLAG
        setPadding(0, dp(14), 0, dp(4))
        setOnClickListener { giveUp() }
      }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT))
    }
    root.addView(card, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM))

    val lp = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      PixelFormat.TRANSLUCENT,
    )
    try {
      (getSystemService(Context.WINDOW_SERVICE) as WindowManager).addView(root, lp)
      overlay = root
    } catch (_: Exception) {
      openApp()
    }
  }

  private fun hideOverlay() {
    val v = overlay ?: return
    try { (getSystemService(Context.WINDOW_SERVICE) as WindowManager).removeView(v) } catch (_: Exception) {}
    overlay = null; overlayText = null; overlayPkg = null
  }

  private fun backToFocus() {
    hideOverlay()
    current = packageName
    openApp()
  }

  private fun giveUp() {
    val pkg = overlayPkg ?: ""
    BlockerStore.markGaveUp(this)
    BlockerStore.clear(this)
    hideOverlay()
    listener?.invoke("onGiveUp", pkg)
    stopSelf()
  }

  private fun openApp() {
    val i = packageManager.getLaunchIntentForPackage(packageName) ?: return
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
    try { startActivity(i) } catch (_: Exception) {}
  }

  private fun channel() {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CHANNEL) == null) {
      nm.createNotificationChannel(NotificationChannel(CHANNEL, "집중 세션", NotificationManager.IMPORTANCE_LOW).apply { description = "집중 중 남은 시간을 보여줘요" })
    }
    if (nm.getNotificationChannel(CHANNEL_DONE) == null) {
      nm.createNotificationChannel(NotificationChannel(CHANNEL_DONE, "집중 완료", NotificationManager.IMPORTANCE_DEFAULT))
    }
  }

  private fun contentIntent(): PendingIntent? {
    val i = packageManager.getLaunchIntentForPackage(packageName) ?: return null
    return PendingIntent.getActivity(this, 0, i, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }

  private fun ongoing(s: BlockerStore.Session): Notification {
    channel()
    return Notification.Builder(this, CHANNEL)
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle("${s.catName}와(과) 집중 중")
      .setContentText("방해 앱 ${s.packages.size}개를 막고 있어요")
      .setOngoing(true)
      .setShowWhen(true)
      .setWhen(s.endAt)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setContentIntent(contentIntent())
      .build()
  }

  private fun notifyDone(s: BlockerStore.Session) {
    channel()
    val n = Notification.Builder(this, CHANNEL_DONE)
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle("집중 완료! 잘했어요")
      .setContentText("${s.catName}가 츄르를 들고 기다리고 있어요")
      .setAutoCancel(true)
      .setContentIntent(contentIntent())
      .build()
    try { (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(NOTI_DONE, n) } catch (_: Exception) {}
  }

  companion object {
    private const val CHANNEL = "jjn_focus"
    private const val CHANNEL_DONE = "jjn_done"
    private const val NOTI_ID = 4821
    private const val NOTI_DONE = 4822

    // 앱(JS)이 살아 있을 때 이벤트를 넘기는 통로
    @Volatile var listener: ((String, String) -> Unit)? = null

    fun start(ctx: Context) {
      val i = Intent(ctx, BlockerService::class.java)
      ctx.startForegroundService(i)
    }

    fun stop(ctx: Context) {
      ctx.stopService(Intent(ctx, BlockerService::class.java))
    }
  }
}
