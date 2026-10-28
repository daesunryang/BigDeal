package expo.modules.appblocker

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import java.util.Calendar

// 집중냥 실제 앱 차단 모듈 (Android).
// 사용 정보 접근(UsageStats)으로 지금 열린 앱을 확인하고, 다른 앱 위에 표시 권한으로 고양이 화면을 띄운다.
class AppBlockerModule : Module() {
  private val ctx: Context
    get() = requireNotNull(appContext.reactContext) { "React context is not available" }

  override fun definition() = ModuleDefinition {
    Name("AppBlocker")

    Events("onBlocked", "onGiveUp")

    OnCreate {
      BlockerService.listener = { name, pkg -> sendEvent(name, mapOf("pkg" to pkg)) }
    }
    OnDestroy {
      BlockerService.listener = null
    }

    Function("hasUsageAccess") { hasUsageAccess(ctx) }

    Function("canDrawOverlays") { Settings.canDrawOverlays(ctx) }

    Function("openUsageAccessSettings") {
      val direct = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      // Android 10+ 일부 기기는 package URI를 주면 우리 앱 항목으로 바로 연다
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) direct.data = Uri.parse("package:" + ctx.packageName)
      open(direct, Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
    }

    Function("openOverlaySettings") {
      open(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + ctx.packageName)), Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION))
    }

    Function("openAppSettings") {
      open(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + ctx.packageName)), null)
    }

    AsyncFunction("getInstalledApps") { installedApps() }

    Function("startBlocking") { opts: Map<String, Any?> ->
      val pkgs = (opts["packages"] as? List<*>)?.mapNotNull { it as? String }?.toSet() ?: emptySet()
      val names = (opts["names"] as? Map<*, *>)?.entries?.associate { it.key.toString() to (it.value?.toString() ?: "") } ?: emptyMap()
      val session = BlockerStore.Session(
        endAt = (opts["endAt"] as? Number)?.toLong() ?: 0L,
        packages = pkgs,
        names = names,
        strict = opts["strict"] as? Boolean ?: false,
        catName = opts["catName"] as? String ?: "고양이",
        catImage = opts["catImage"] as? String ?: "cheese",
      )
      BlockerStore.save(ctx, session)
      BlockerService.start(ctx)
    }

    Function("stopBlocking") {
      BlockerStore.clear(ctx)
      BlockerService.stop(ctx)
    }

    Function("isBlocking") { BlockerStore.isActive(ctx) }

    Function("consumeEvents") { BlockerStore.consume(ctx) }
  }

  private fun open(primary: Intent, fallback: Intent?) {
    primary.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      ctx.startActivity(primary)
    } catch (e: Exception) {
      if (fallback != null) {
        fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try { ctx.startActivity(fallback) } catch (_: Exception) {}
      }
    }
  }

  private fun installedApps(): List<Map<String, Any>> {
    val pm = ctx.packageManager
    val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val acts = if (Build.VERSION.SDK_INT >= 33) {
      pm.queryIntentActivities(launcher, PackageManager.ResolveInfoFlags.of(0L))
    } else {
      @Suppress("DEPRECATION")
      pm.queryIntentActivities(launcher, 0)
    }
    val usage = usageToday()
    val seen = HashSet<String>()
    val out = ArrayList<Map<String, Any>>()
    for (ri in acts) {
      val pkg = ri.activityInfo?.packageName ?: continue
      if (pkg == ctx.packageName || !seen.add(pkg)) continue
      val label = ri.loadLabel(pm)?.toString() ?: pkg
      val icon = try { iconBase64(ri.loadIcon(pm)) } catch (_: Exception) { "" }
      val minutes = ((usage[pkg] ?: 0L) / 60000L).toInt()
      out.add(mapOf("pkg" to pkg, "name" to label, "icon" to icon, "usageMin" to minutes))
    }
    out.sortWith(compareByDescending<Map<String, Any>> { it["usageMin"] as Int }.thenBy { it["name"] as String })
    return out
  }

  private fun usageToday(): Map<String, Long> {
    if (!hasUsageAccess(ctx)) return emptyMap()
    val usm = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val cal = Calendar.getInstance()
    cal.set(Calendar.HOUR_OF_DAY, 0); cal.set(Calendar.MINUTE, 0); cal.set(Calendar.SECOND, 0); cal.set(Calendar.MILLISECOND, 0)
    return try {
      usm.queryAndAggregateUsageStats(cal.timeInMillis, System.currentTimeMillis()).mapValues { it.value.totalTimeInForeground }
    } catch (_: Exception) {
      emptyMap()
    }
  }

  private fun iconBase64(d: Drawable): String {
    val size = 96
    val bmp: Bitmap = if (d is BitmapDrawable && d.bitmap != null) {
      Bitmap.createScaledBitmap(d.bitmap, size, size, true)
    } else {
      val b = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
      val c = Canvas(b)
      d.setBounds(0, 0, size, size)
      d.draw(c)
      b
    }
    val bos = ByteArrayOutputStream()
    bmp.compress(Bitmap.CompressFormat.PNG, 100, bos)
    return Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP)
  }

  companion object {
    fun hasUsageAccess(ctx: Context): Boolean {
      val ops = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
      } else {
        @Suppress("DEPRECATION")
        ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
      }
      return mode == AppOpsManager.MODE_ALLOWED
    }
  }
}
