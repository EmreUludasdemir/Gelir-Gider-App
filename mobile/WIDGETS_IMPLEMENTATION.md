# 📱 iOS & Android Widgets Implementation Guide

## Overview

The Gelir-Gider app includes native widgets for both iOS and Android platforms, allowing users to quickly view their financial balance without opening the app.

---

## 🍎 iOS Widgets (WidgetKit)

### Features
- **3 Widget Sizes**: Small, Medium, Large
- **Auto-Update**: Refreshes every 15 minutes
- **Gradient Design**: Beautiful purple-pink gradient matching app theme
- **Data Sync**: Uses App Groups for data sharing

### Sizes

#### Small Widget (2x2)
- Current balance
- Income indicator
- Compact view

#### Medium Widget (4x2)
- Current balance with update time
- Income and expense side-by-side
- More detailed stats

#### Large Widget (4x4)
- App branding
- Large balance display
- Income/Expense cards with icons
- Last update timestamp

### Implementation Steps

1. **Add Widget Extension to Xcode Project**
   ```bash
   File -> New -> Target -> Widget Extension
   Name: GelirGiderWidget
   ```

2. **Configure App Groups**
   ```
   Identifier: group.com.gelirgider.app

   Enable in:
   - Main App Target
   - Widget Extension Target
   ```

3. **Copy Widget Code**
   ```
   Copy: mobile/ios/GelirGiderWidget/GelirGiderWidget.swift
   To: Your project's widget extension
   ```

4. **Update Data from React Native**
   ```typescript
   import SharedGroupPreferences from 'react-native-shared-group-preferences';

   const appGroupIdentifier = 'group.com.gelirgider.app';

   async function updateWidgetData(balance: number, income: number, expense: number) {
     try {
       await SharedGroupPreferences.setItem('balance', balance, appGroupIdentifier);
       await SharedGroupPreferences.setItem('income', income, appGroupIdentifier);
       await SharedGroupPreferences.setItem('expense', expense, appGroupIdentifier);

       // Trigger widget update
       WidgetKit.reloadAllTimelines();
     } catch (error) {
       console.error('Failed to update widget:', error);
     }
   }
   ```

5. **Required Dependencies**
   ```bash
   npm install react-native-shared-group-preferences
   npm install react-native-widget-kit
   ```

---

## 🤖 Android Widgets (Jetpack Glance)

### Features
- **3 Widget Sizes**: Small (2x2), Medium (4x2), Large (4x4)
- **Adaptive Layout**: Automatically adjusts based on size
- **Material You**: Supports dynamic colors on Android 12+
- **Click Action**: Opens app when tapped

### Layouts

#### Small Widget
- Balance only
- Income indicator
- Minimal design

#### Medium Widget
- Balance + update time
- Income and expense with icons
- Horizontal layout

#### Large Widget
- Full app branding
- Large balance
- Income/Expense cards
- Update timestamp

### Implementation Steps

1. **Add Widget Files**
   ```
   Copy these files to your Android project:
   - BalanceWidget.kt
   - widget_balance_small.xml
   - widget_balance_medium.xml
   - widget_balance_large.xml
   ```

2. **Register Widget in AndroidManifest.xml**
   ```xml
   <receiver
       android:name=".widgets.BalanceWidget"
       android:exported="true">
       <intent-filter>
           <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
       </intent-filter>
       <meta-data
           android:name="android.appwidget.provider"
           android:resource="@xml/balance_widget_info" />
   </receiver>
   ```

3. **Create Widget Info XML**
   ```xml
   <!-- res/xml/balance_widget_info.xml -->
   <?xml version="1.0" encoding="utf-8"?>
   <appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
       android:minWidth="180dp"
       android:minHeight="110dp"
       android:updatePeriodMillis="900000"
       android:previewImage="@drawable/widget_preview"
       android:initialLayout="@layout/widget_balance_small"
       android:resizeMode="horizontal|vertical"
       android:widgetCategory="home_screen" />
   ```

4. **Create Drawable Resources**
   ```xml
   <!-- res/drawable/widget_background_gradient.xml -->
   <shape xmlns:android="http://schemas.android.com/apk/res/android">
       <gradient
           android:angle="135"
           android:startColor="#6366F1"
           android:centerColor="#8B5CF6"
           android:endColor="#EC4899"
           android:type="linear" />
       <corners android:radius="16dp" />
   </shape>

   <!-- res/drawable/widget_card_background.xml -->
   <shape xmlns:android="http://schemas.android.com/apk/res/android">
       <solid android:color="#26FFFFFF" />
       <corners android:radius="12dp" />
   </shape>
   ```

5. **Update Widget from React Native**
   ```typescript
   import { NativeModules } from 'react-native';

   const { WidgetModule } = NativeModules;

   async function updateAndroidWidget(balance: number, income: number, expense: number) {
     try {
       await WidgetModule.updateWidget(balance, income, expense);
     } catch (error) {
       console.error('Failed to update Android widget:', error);
     }
   }
   ```

6. **Create Native Module Bridge**
   ```kotlin
   // WidgetModule.kt
   package com.gelirgider.modules

   import com.facebook.react.bridge.ReactApplicationContext
   import com.facebook.react.bridge.ReactContextBaseJavaModule
   import com.facebook.react.bridge.ReactMethod
   import com.gelirgider.widgets.BalanceWidget

   class WidgetModule(reactContext: ReactApplicationContext) :
       ReactContextBaseJavaModule(reactContext) {

       override fun getName() = "WidgetModule"

       @ReactMethod
       fun updateWidget(balance: Double, income: Double, expense: Double) {
           BalanceWidget.updateWidgetData(reactApplicationContext, balance, income, expense)
       }
   }
   ```

---

## 🔄 Auto-Update Strategy

### iOS
```swift
// Widget refreshes every 15 minutes
let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
```

### Android
```kotlin
// Worker for periodic updates
class WidgetUpdateWorker : Worker() {
    override fun doWork(): Result {
        // Fetch data and update widget
        return Result.success()
    }
}

// Schedule periodic updates (15 minutes)
val updateRequest = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(15, TimeUnit.MINUTES).build()
WorkManager.getInstance(context).enqueue(updateRequest)
```

---

## 📊 Data Flow

```
React Native App
       ↓
  Update Balance
       ↓
SharedPreferences / App Groups
       ↓
Widget Timeline Provider
       ↓
  Widget UI Update
```

---

## 🎨 Design Tokens

### Colors
```
Primary: #6366F1 (Indigo)
Secondary: #8B5CF6 (Purple)
Accent: #EC4899 (Pink)
Success: #4CAF50 (Green)
Danger: #F44336 (Red)
```

### Typography
```
iOS:
- Title: SF Pro Rounded Bold
- Body: SF Pro Regular

Android:
- Title: sans-serif-medium
- Body: sans-serif
```

---

## 🧪 Testing

### iOS
1. Run widget in Xcode simulator
2. Long-press home screen → Add Widget
3. Select "Gelir-Gider" → Choose size
4. Test data updates

### Android
1. Run app on device/emulator
2. Long-press home screen → Widgets
3. Find "Gelir-Gider Balance"
4. Drag to home screen
5. Test updates

---

## 🚀 Production Checklist

### iOS
- [ ] Configure App Groups
- [ ] Add widget extension to build
- [ ] Test on iOS 14, 15, 16, 17
- [ ] Add widget preview screenshots
- [ ] Handle widget configuration (if needed)

### Android
- [ ] Register widget in manifest
- [ ] Create all drawable resources
- [ ] Test on Android 10, 11, 12, 13, 14
- [ ] Add widget preview image
- [ ] Configure WorkManager for updates

---

## 📦 Dependencies

### iOS
```json
{
  "react-native-shared-group-preferences": "^1.1.22",
  "react-native-widget-kit": "^1.0.0"
}
```

### Android
```gradle
dependencies {
    implementation 'androidx.work:work-runtime-ktx:2.8.1'
    implementation 'androidx.glance:glance-appwidget:1.0.0'
}
```

---

## 🐛 Troubleshooting

### iOS Issues

**Widget not updating:**
- Check App Group configuration
- Verify shared preferences path
- Check widget timeline policy

**Widget shows placeholder:**
- Ensure data is being written correctly
- Check App Group permissions
- Verify bundle identifiers

### Android Issues

**Widget not appearing:**
- Check manifest registration
- Verify XML resources exist
- Check minimum widget size

**Widget not updating:**
- Verify SharedPreferences path
- Check WorkManager scheduling
- Review broadcast receiver

---

## 📚 Resources

- [iOS WidgetKit Documentation](https://developer.apple.com/documentation/widgetkit)
- [Android App Widgets Guide](https://developer.android.com/guide/topics/appwidgets)
- [Jetpack Glance](https://developer.android.com/jetpack/androidx/releases/glance)

---

## 💡 Future Enhancements

- [ ] Widget configuration (choose what to display)
- [ ] Interactive widgets (iOS 17+)
- [ ] Dark/Light mode support
- [ ] Multiple widget types (transaction list, chart, etc.)
- [ ] Lock screen widgets (iOS 16+)
- [ ] Resizable widgets
- [ ] Deep linking to specific screens
