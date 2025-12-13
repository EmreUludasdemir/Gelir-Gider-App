# Gelir-Gider Mobil Uygulama 📱

React Native (Expo) ile geliştirilmiş modern mobil uygulama.

## 🚀 Başlangıç

```bash
# Bağımlılıkları yükle
cd apps/mobile
npm install

# Uygulamayı başlat
npm start

# iOS Simulator'da aç
npm run ios

# Android Emulator'da aç
npm run android
```

## 📱 Expo Go ile Test

1. Telefonunuza [Expo Go](https://expo.dev/client) indirin
2. `npm start` ile uygulamayı başlatın
3. QR kodu telefonunuzla tarayın

## 🎨 Özellikler

- ✅ Modern ve temiz UI tasarımı
- ✅ Gradient efektler
- ✅ Animasyonlar
- ✅ Güvenli token depolama
- ✅ Pull-to-refresh
- ✅ Dark mode desteği (yakında)

## 📂 Klasör Yapısı

```
apps/mobile/
├── app/                    # Expo Router sayfaları
│   ├── (auth)/            # Giriş/Kayıt sayfaları
│   ├── (tabs)/            # Ana tab navigasyonu
│   └── _layout.tsx        # Root layout
├── components/            # Yeniden kullanılabilir bileşenler
│   └── ui/               # UI bileşenleri
├── constants/            # Tema ve sabitler
├── contexts/             # React Context'ler
└── assets/              # Görseller ve fontlar
```

## 🔧 Backend Bağlantısı

`contexts/AuthContext.tsx` içinde API_URL'i düzenleyin:

```typescript
const API_URL = "http://YOUR_LOCAL_IP:3001";
```

IP adresinizi öğrenmek için:

- Windows: `ipconfig`
- Mac/Linux: `ifconfig`

## 📦 Build

```bash
# Development build
npx expo build:android
npx expo build:ios

# EAS Build (önerilen)
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## 💰 Ücretsiz Yayınlama

- **Android**: Google Play Console ($25 tek seferlik)
- **iOS**: Apple Developer ($99/yıl)
- **Alternatif**: APK olarak dağıtım (ücretsiz)
