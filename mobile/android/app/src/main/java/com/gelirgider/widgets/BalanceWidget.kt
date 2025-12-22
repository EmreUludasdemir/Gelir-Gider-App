package com.gelirgider.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import androidx.core.content.ContextCompat
import com.gelirgider.R
import java.text.NumberFormat
import java.util.Locale

/**
 * Balance Widget for Android
 * Shows current balance, income, and expense
 */
class BalanceWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update each widget instance
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Enter relevant functionality for when the first widget is created
    }

    override fun onDisabled(context: Context) {
        // Enter relevant functionality for when the last widget is disabled
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_UPDATE_WIDGET -> {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val appWidgetIds = appWidgetManager.getAppWidgetIds(
                    android.content.ComponentName(context, BalanceWidget::class.java)
                )
                onUpdate(context, appWidgetManager, appWidgetIds)
            }
        }
    }

    companion object {
        private const val ACTION_UPDATE_WIDGET = "com.gelirgider.ACTION_UPDATE_WIDGET"

        internal fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            // Fetch data from SharedPreferences
            val prefs = context.getSharedPreferences("BalanceWidgetData", Context.MODE_PRIVATE)
            val balance = prefs.getFloat("balance", 24567.89f).toDouble()
            val income = prefs.getFloat("income", 35420.0f).toDouble()
            val expense = prefs.getFloat("expense", 10852.11f).toDouble()

            // Get widget size to determine layout
            val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
            val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)

            val layoutId = when {
                minWidth >= 250 && minHeight >= 250 -> R.layout.widget_balance_large
                minWidth >= 250 -> R.layout.widget_balance_medium
                else -> R.layout.widget_balance_small
            }

            // Construct the RemoteViews object
            val views = RemoteViews(context.packageName, layoutId)

            // Update widget content
            views.setTextViewText(R.id.widget_balance_value, formatCurrency(balance))
            views.setTextViewText(R.id.widget_income_value, formatCurrency(income))
            views.setTextViewText(R.id.widget_expense_value, formatCurrency(expense))

            // Set up click intent to open app
            val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val pendingIntent = android.app.PendingIntent.getActivity(
                context,
                0,
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            // Update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun formatCurrency(amount: Double): String {
            val formatter = NumberFormat.getCurrencyInstance(Locale("tr", "TR"))
            formatter.currency = java.util.Currency.getInstance("TRY")
            return formatter.format(amount)
        }

        fun updateWidgetData(context: Context, balance: Double, income: Double, expense: Double) {
            // Save data to SharedPreferences
            val prefs = context.getSharedPreferences("BalanceWidgetData", Context.MODE_PRIVATE)
            prefs.edit().apply {
                putFloat("balance", balance.toFloat())
                putFloat("income", income.toFloat())
                putFloat("expense", expense.toFloat())
                apply()
            }

            // Trigger widget update
            val intent = Intent(context, BalanceWidget::class.java)
            intent.action = ACTION_UPDATE_WIDGET
            context.sendBroadcast(intent)
        }
    }
}

/**
 * Widget Update Worker - for periodic updates
 */
class WidgetUpdateWorker(
    private val context: Context,
    params: androidx.work.WorkerParameters
) : androidx.work.Worker(context, params) {

    override fun doWork(): Result {
        // Fetch latest data from API
        // For now, we'll just trigger a widget update
        val intent = Intent(context, BalanceWidget::class.java)
        intent.action = "com.gelirgider.ACTION_UPDATE_WIDGET"
        context.sendBroadcast(intent)

        return Result.success()
    }
}
