package expo.modules.appblocker

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

// 집중 세션 정보를 SharedPreferences에 둔다.
// 앱(JS)이 종료돼도 포그라운드 서비스가 계속 읽을 수 있고, 앱이 다시 열리면 쌓인 기록을 가져간다.
object BlockerStore {
  private const val NAME = "jjn_blocker"

  private fun prefs(ctx: Context): SharedPreferences = ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE)

  data class Session(
    val endAt: Long,
    val packages: Set<String>,
    val names: Map<String, String>,
    val strict: Boolean,
    val catName: String,
    val catImage: String,
  )

  fun save(ctx: Context, s: Session) {
    val names = JSONObject()
    s.names.forEach { (k, v) -> names.put(k, v) }
    prefs(ctx).edit()
      .putBoolean("active", true)
      .putLong("endAt", s.endAt)
      .putString("packages", JSONArray(s.packages.toList()).toString())
      .putString("names", names.toString())
      .putBoolean("strict", s.strict)
      .putString("catName", s.catName)
      .putString("catImage", s.catImage)
      .apply()
  }

  fun load(ctx: Context): Session? {
    val p = prefs(ctx)
    if (!p.getBoolean("active", false)) return null
    val pk = mutableSetOf<String>()
    val arr = JSONArray(p.getString("packages", "[]"))
    for (i in 0 until arr.length()) pk.add(arr.getString(i))
    val nm = mutableMapOf<String, String>()
    val obj = JSONObject(p.getString("names", "{}") ?: "{}")
    obj.keys().forEach { k -> nm[k] = obj.optString(k) }
    return Session(
      p.getLong("endAt", 0L), pk, nm, p.getBoolean("strict", false),
      p.getString("catName", "고양이") ?: "고양이", p.getString("catImage", "cheese") ?: "cheese",
    )
  }

  fun clear(ctx: Context) {
    prefs(ctx).edit().putBoolean("active", false).apply()
  }

  fun isActive(ctx: Context): Boolean {
    val s = load(ctx) ?: return false
    return s.endAt > System.currentTimeMillis()
  }

  fun addTry(ctx: Context, pkg: String) {
    val p = prefs(ctx)
    val obj = JSONObject(p.getString("tries", "{}") ?: "{}")
    obj.put(pkg, obj.optInt(pkg, 0) + 1)
    p.edit().putString("tries", obj.toString()).apply()
  }

  fun markGaveUp(ctx: Context) {
    prefs(ctx).edit().putBoolean("gaveUp", true).apply()
  }

  // 쌓인 방해 시도와 포기 여부를 넘기고 비운다
  fun consume(ctx: Context): Map<String, Any> {
    val p = prefs(ctx)
    val obj = JSONObject(p.getString("tries", "{}") ?: "{}")
    val tries = mutableMapOf<String, Int>()
    obj.keys().forEach { k -> tries[k] = obj.optInt(k, 0) }
    val gaveUp = p.getBoolean("gaveUp", false)
    p.edit().remove("tries").putBoolean("gaveUp", false).apply()
    return mapOf("tries" to tries, "gaveUp" to gaveUp)
  }
}
