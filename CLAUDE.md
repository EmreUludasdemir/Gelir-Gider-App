# 🧠 CLAUDE.md - Proje Hafıza Dosyası

> Bu dosya Claude'un projeyi hatırlaması ve tutarlı çalışması için oluşturulmuştur.
> Son güncelleme: 2025-01-15

---

## 📋 PROJE ÖZETİ

**Proje Adı:** Gelir-Gider Takip Uygulaması  
**Versiyon:** v2.5  
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
         │PostgreSQL│   │ Redis   │   │ PDF Parser  │
         │   DB    │   │ Cache   │   │ (FastAPI)   │
         │  :5432  │   │  :6379  │   │ :8001       │
         └─────────┘   └─────────┘   └─────────────┘
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
DATABASE_URL="postgresql://finance_user:password@localhost:5432/finance_db"
JWT_SECRET="your-secret"
GEMINI_API_KEY="your-gemini-key"
REDIS_HOST="localhost"
REDIS_PORT=6379

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-key"
```

### Docker ile Çalıştırma
```bash
# PostgreSQL + Redis + API + Web
docker-compose up -d

# Sadece PostgreSQL ve Redis
docker-compose up -d postgres redis

# Migration çalıştır
cd apps/api && npx prisma migrate dev
```

---

## 📊 PERFORMANS ENDPOİNTLERİ

```
GET /health           - Genel sağlık durumu (DB + Cache)
GET /health/ready     - Readiness probe (DB bağlantısı)
GET /health/live      - Liveness probe (uptime)
GET /performance/metrics - Cache istatistikleri
GET /performance/health  - Sistem sağlık durumu
```

---

## 📝 ÖNEMLİ KARARLAR

| Tarih | Karar | Sebep |
|-------|-------|-------|
| 2024-12 | SQLite → PostgreSQL (v2.5) | Production-ready veritabanı |
| 2024-12 | Monorepo yapısı | Paylaşımlı tipler ve kolay yönetim |
| 2024-12 | Next.js App Router | Modern React patterns |
| 2024-12 | Tailwind CSS | Hızlı UI geliştirme |
| 2024-12 | Gemini AI | Ücretsiz tier, Türkçe desteği |
| 2025-01-15 | Winston Logger + Global Exception Filter | Merkezi hata yönetimi ve logging |
| 2025-01-15 | Redis Cache + Compression | Performans optimizasyonu |
| 2025-01-15 | PostgreSQL + Connection Pooling | Ölçeklenebilir veritabanı |

---

## 🚀 TAMAMLANAN FAZ'LAR

### FAZ 1: Error Handling & Logging ✅
- Winston Logger ile structured logging
- Global Exception Filter
- Standart Error Response formatı
- Request logging (method, url, duration)
- Log dosyaları (combined, error, exceptions)

### FAZ 2: Security Layer ✅
- Rate limiting (Throttler)
- CORS yapılandırması
- Helmet security headers
- Input validation (class-validator)
- Audit logging

### FAZ 3: Test Infrastructure ✅
- 141 test (10 test suite)
- Unit testler (services, controllers)
- Integration testler
- E2E testler
- Test utilities ve mocks

### FAZ 4: Performance & Cache ✅
- Redis Cache Service (ioredis)
- Cache decorators (@Cacheable, @CacheInvalidate)
- Gzip compression middleware
- Performance monitoring endpoint (/performance/metrics)
- Query optimization indexes
- Cache invalidation strategy

### FAZ 5: PostgreSQL Migration ✅
- Prisma schema: sqlite → postgresql
- Docker Compose: PostgreSQL + Redis containers
- Connection pooling ayarları
- Health check endpoints (database, cache)
- Transaction retry logic
- .env.example güncellendi

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
- [ ] CI/CD pipeline (GitHub Actions)

### Orta Öncelik
- [ ] Daha fazla banka formatı desteği
- [ ] Gelişmiş raporlama
- [ ] Export (CSV, PDF)
- [ ] Multi-tenant desteği

### Düşük Öncelik
- [ ] Desktop uygulaması (Electron)
- [ ] Apple Watch app
- [ ] Telegram bot

### Tamamlanan ✅
- [x] SQLite → PostgreSQL migration
- [x] Redis cache layer
- [x] Response compression (Gzip)
- [x] Performance monitoring
- [x] Error handling & logging
- [x] Security layer (rate limiting, CORS)
- [x] Test infrastructure (141 test)

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

## 🛑 Stop Hook

Her görev bitince verify script'ini çalıştır:
```bash
npm run verify
# veya build olmadan:
VERIFY_NO_BUILD=1 npm run verify
```

---

## 🔗 FAYDALI LİNKLER

- [README.md](README.md) - Genel bilgi
- [FEATURES_ADDED.md](FEATURES_ADDED.md) - Eklenen özellikler
- [IMPROVEMENTS.md](IMPROVEMENTS.md) - İyileştirmeler
- [QUICK_START.md](QUICK_START.md) - Hızlı başlangıç

---

*Bu dosya her önemli değişiklikte güncellenmelidir.*
