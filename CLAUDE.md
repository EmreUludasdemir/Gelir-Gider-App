# 🧠 CLAUDE.md - Proje Hafıza Dosyası

> Bu dosya Claude'un projeyi hatırlaması ve tutarlı çalışması için oluşturulmuştur.
> Son güncelleme: 2024-12-22

---

## 📋 PROJE ÖZETİ

**Proje Adı:** Gelir-Gider Takip Uygulaması  
**Versiyon:** v2.0  
**Sahibi:** Emre Uludeşdemir (@EmreUludasdemir)  
**Repo:** https://github.com/EmreUludasdemir/Gelir-Gider-Uygulamas--Claude  
**Branch:** claude/finance-tracker-app-01CwGjpwSVn1dh1sqZnkDXvU

### Amaç
Modern, full-stack finans yönetim uygulaması. PDF banka ekstrelerini otomatik parse eder, akıllı kategorilendirme yapar ve Gemini AI ile finansal tavsiyeler sunar.

---

## 🏗️ MİMARİ

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 14)                  │
│                    http://localhost:3000                     │
│  TypeScript + Tailwind CSS + React Query + Dark Mode        │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (NestJS 10)                    │
│                    http://localhost:3001                     │
│  TypeScript + Prisma ORM + JWT Auth + Passport              │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         ┌─────────┐   ┌─────────┐   ┌─────────────┐
         │ SQLite  │   │ Redis   │   │ PDF Parser  │
         │   DB    │   │ Cache   │   │ (FastAPI)   │
         └─────────┘   └─────────┘   │ :8001       │
                                     └─────────────┘
```

### Klasör Yapısı

```
Gelir-Gider-Uygulamas--Claude/
├── apps/
│   ├── api/              # NestJS Backend
│   │   ├── prisma/       # Database schema & migrations
│   │   └── src/
│   │       ├── modules/  # Feature modules
│   │       │   ├── auth/           # Kimlik doğrulama
│   │       │   ├── transactions/   # İşlemler
│   │       │   ├── budgets/        # Bütçe yönetimi
│   │       │   ├── savings-goals/  # Tasarruf hedefleri
│   │       │   ├── reports/        # Raporlama
│   │       │   ├── analytics/      # Analitik
│   │       │   ├── notifications/  # Bildirimler
│   │       │   ├── bills/          # Faturalar
│   │       │   ├── debts/          # Borçlar
│   │       │   ├── subscriptions/  # Abonelikler
│   │       │   ├── bank-connections/ # Banka bağlantıları
│   │       │   └── sms-parser/     # SMS analizi
│   │       └── shared/   # Ortak tipler ve yardımcılar
│   │
│   ├── web/              # Next.js Frontend
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React bileşenleri
│   │   ├── lib/          # Yardımcı fonksiyonlar
│   │   └── contexts/     # React context'ler
│   │
│   └── mobile/           # React Native (Expo)
│       ├── app/          # Expo Router
│       ├── components/   # Mobile bileşenler
│       └── contexts/     # Mobile context'ler
│
├── mobile/               # Standalone React Native
│   ├── android/          # Android widgets
│   └── ios/              # iOS widgets
│
└── services/
    └── pdf-parser/       # Python FastAPI servisi
        └── app/
            ├── parser.py           # Temel parser
            ├── enhanced_parser.py  # Gelişmiş parser
            └── classifier.py       # Kategori sınıflandırıcı
```

---

## 🗄️ VERİTABANI ŞEMASI

### Ana Tablolar

| Tablo | Açıklama |
|-------|----------|
| `User` | Kullanıcılar (email, password, OAuth, 2FA) |
| `Transaction` | Gelir/gider işlemleri |
| `Budget` | Kategori bazlı bütçeler |
| `SavingsGoal` | Tasarruf hedefleri |
| `Bill` | Faturalar ve hatırlatıcılar |
| `Debt` | Borçlar ve ödemeler |
| `Subscription` | Abonelik takibi |
| `BankConnection` | Banka API bağlantıları |
| `CreditCard` | Kredi kartları |
| `AuditLog` | Güvenlik logları |

### İlişkiler
- Tüm tablolar `User` ile ilişkili (userId FK)
- Cascade delete aktif
- Soft delete yok (gerçek silme)

---

## 🔐 KİMLİK DOĞRULAMA

- **JWT Token** based authentication
- **Passport.js** strategies
- **2FA** desteği (TOTP)
- **OAuth** (Google, GitHub hazır)
- **Refresh token** mekanizması

### Token Yapısı
```typescript
{
  userId: string,
  email: string,
  iat: number,
  exp: number
}
```

---

## 📊 API ENDPOINT'LERİ

### Auth
```
POST /auth/register     - Kayıt
POST /auth/login        - Giriş
POST /auth/refresh      - Token yenile
GET  /auth/profile      - Profil bilgisi
```

### Transactions
```
GET    /transactions           - Tüm işlemler (pagination, filter)
POST   /transactions           - Yeni işlem
GET    /transactions/:id       - İşlem detay
PATCH  /transactions/:id       - Güncelle
DELETE /transactions/:id       - Sil
DELETE /transactions/bulk      - Toplu sil
```

### Budgets
```
GET  /budgets           - Tüm bütçeler
POST /budgets           - Yeni bütçe
GET  /budgets/summary   - Bütçe özeti
GET  /budgets/alerts    - Uyarılar
```

### Reports
```
GET /reports/generate?format=pdf|excel&startDate=X&endDate=Y
```

---

## 🎨 FRONTEND KOMPONENTLERİ

### Dashboard
- `StatCard` - İstatistik kartları
- `CategoryPieChart` - Kategori pasta grafiği
- `TrendChart` - Trend çizgi grafiği
- `TransactionTable` - İşlem tablosu
- `BudgetSection` - Bütçe bölümü
- `SavingsGoalWidget` - Tasarruf hedefi
- `AIInsights` - AI önerileri
- `FinancialAssistant` - Sohbet botu

### Forms
- `ManualTransactionForm` - Manuel işlem ekleme
- `SmartTransactionInput` - AI destekli giriş
- `EnhancedPdfUpload` - PDF yükleme
- `TransactionEditModal` - Düzenleme modal

### UI
- `Button`, `Input`, `Select`, `Card` - Temel bileşenler
- `Toast` - Bildirimler
- `Skeleton` - Loading states
- `ErrorBoundary` - Hata yakalama

---

## 🤖 AI ÖZELLİKLERİ

### Gemini AI Entegrasyonu
- **Akıllı İşlem Ekleme**: "Bugün markette 250 TL harcadım" → otomatik parse
- **Finansal İçgörüler**: Harcama analizi ve tavsiyeler
- **Finansal Asistan**: Soru-cevap chatbot
- **Anomali Tespiti**: Beklenmedik harcama uyarıları

### Kullanım
```typescript
// lib/gemini.ts
import { parseTransactionWithAI, getFinancialInsights } from '@/lib/gemini';
```

---

## 📱 MOBİL UYGULAMA

### Teknolojiler
- React Native + Expo
- Expo Router (navigasyon)
- SQLite (offline veri)
- React Native Charts

### Özellikler
- ✅ Offline-first architecture
- ✅ Push notifications
- ✅ Widget'lar (iOS/Android)
- ✅ SMS parsing (Android)
- ✅ Biometric auth

---

## 🔧 GELİŞTİRME ORTAMI

### Gereksinimler
- Node.js 20+
- Python 3.11+
- npm 10+

### Başlatma
```bash
# Tüm servisleri başlat
npm run dev

# Sadece frontend
cd apps/web && npm run dev

# Sadece backend
cd apps/api && npm run dev

# PDF Parser
npm run dev:parser
```

### Environment Variables
```env
# apps/api/.env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret"
GEMINI_API_KEY="your-gemini-key"

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-key"
```

---

## 📝 ÖNEMLİ KARARLAR

| Tarih | Karar | Sebep |
|-------|-------|-------|
| 2024-12 | SQLite → Production'da PostgreSQL planı | Başlangıç için basitlik |
| 2024-12 | Monorepo yapısı | Paylaşımlı tipler ve kolay yönetim |
| 2024-12 | Next.js App Router | Modern React patterns |
| 2024-12 | Tailwind CSS | Hızlı UI geliştirme |
| 2024-12 | Gemini AI | Ücretsiz tier, Türkçe desteği |
| 2025-12-22 | Winston Logger + Global Exception Filter | Merkezi hata yönetimi ve logging |

---

## 🔧 ERROR HANDLING & LOGGING (v2.1)

### Backend (NestJS)
- **Winston Logger**: Structured logging, file rotation
- **Global Exception Filter**: Tüm hataları yakalar
- **Standart Error Response**: Tutarlı API hata formatı
- **Request Logging**: Her istek loglanır (method, url, duration)

### Error Response Formatı
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Geçersiz email veya şifre",
    "timestamp": "2025-12-22T10:00:00Z",
    "path": "/auth/login",
    "requestId": "req_1234567890_abc"
  }
}
```

### Error Codes
- `AUTH_xxx` - Kimlik doğrulama hataları
- `VAL_xxx` - Doğrulama hataları
- `RES_xxx` - Kaynak hataları (not found, conflict)
- `TRX_xxx` - İşlem hataları
- `BDG_xxx` - Bütçe hataları
- `FILE_xxx` - Dosya hataları
- `EXT_xxx` - Dış servis hataları
- `DB_xxx` - Veritabanı hataları
- `SRV_xxx` - Sunucu hataları

### Log Dosyaları
- `logs/combined.log` - Tüm loglar
- `logs/error.log` - Sadece hatalar
- `logs/exceptions.log` - Yakalanmamış hatalar

### Frontend (Next.js)
- **ErrorBoundary**: React error boundary
- **useApiError Hook**: API hata yönetimi
- **Toast Notifications**: Kullanıcı bildirimleri

---

## 🐛 BİLİNEN SORUNLAR

1. **PDF Parser**: Bazı banka formatları henüz desteklenmiyor
2. **Mobile**: Widget'lar sadece temel implementasyon
3. **Offline Sync**: Conflict resolution tam değil

---

## 📌 YAPILACAKLAR (TODO)

### Yüksek Öncelik
- [ ] Gerçek banka API entegrasyonu
- [ ] Push notification altyapısı
- [ ] E2E testler

### Orta Öncelik
- [ ] Daha fazla banka formatı desteği
- [ ] Gelişmiş raporlama
- [ ] Export (CSV, PDF)

### Düşük Öncelik
- [ ] Desktop uygulaması (Electron)
- [ ] Apple Watch app
- [ ] Telegram bot

---

## 💡 CLAUDE İÇİN İPUÇLARI

1. **Türkçe Karakterler**: Dosyalarda UTF-8 kullan
2. **API Yanıtları**: Hep camelCase kullan
3. **Tarih Formatı**: ISO 8601 (2024-12-22T10:00:00Z)
4. **Para Birimi**: Varsayılan TRY, amount number olarak
5. **Hata Mesajları**: Türkçe, kullanıcı dostu

### Kod Stili
- ESLint + Prettier aktif
- 2 space indent
- Single quotes
- No semicolons (frontend)
- Semicolons (backend)

---

## 🔗 FAYDALI LİNKLER

- [README.md](README.md) - Genel bilgi
- [FEATURES_ADDED.md](FEATURES_ADDED.md) - Eklenen özellikler
- [IMPROVEMENTS.md](IMPROVEMENTS.md) - İyileştirmeler
- [QUICK_START.md](QUICK_START.md) - Hızlı başlangıç

---

*Bu dosya her önemli değişiklikte güncellenmelidir.*
