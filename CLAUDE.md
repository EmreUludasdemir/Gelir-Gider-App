# 🧠 CLAUDE.md - Proje Hafıza Dosyası

> Bu dosya Claude'un projeyi hatırlaması ve tutarlı çalışması için oluşturulmuştur.
> Son güncelleme: 2026-01-23

---

## 📋 PROJE ÖZETİ

**Proje Adı:** Gelir-Gider Takip Uygulaması
**Versiyon:** v3.0
**Sahibi:** Emre Uludeşdemir (@EmreUludasdemir)
**Repo:** https://github.com/EmreUludasdemir/Gelir-Gider-App
**Branch:** claude/optimize-app-v3-j1ZMP

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
GET /reports/yearly-comparison?year=2026
GET /reports/category-trends?months=6&type=expense
GET /reports/schedule           - Planlanmış rapor ayarları
POST /reports/schedule          - Rapor planla
GET /reports/digest-preview?type=weekly|monthly
```

### Smart Notifications
```
GET  /notifications/smart           - Tüm akıllı bildirimler
GET  /notifications/smart/anomalies - Olağandışı harcamalar
GET  /notifications/smart/bills     - Fatura hatırlatıcıları
GET  /notifications/smart/budgets   - Bütçe uyarıları
GET  /notifications/smart/digest/weekly  - Haftalık özet
GET  /notifications/smart/digest/monthly - Aylık özet
GET  /notifications/preferences     - Bildirim tercihleri
POST /notifications/preferences     - Tercihleri güncelle
```

### Households (Aile Hesapları)
```
POST /households              - Yeni aile hesabı
GET  /households              - Kullanıcının aile hesapları
POST /households/:id/invite   - Davet kodu oluştur
POST /households/join         - Davet koduyla katıl
DELETE /households/:id/leave  - Aileden ayrıl
```

### Currency
```
GET  /currency/rates          - Güncel döviz kurları
GET  /currency/convert?amount=X&from=TRY&to=USD
GET  /currency/supported      - Desteklenen para birimleri
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
# 1. Tüm servisleri başlat (PostgreSQL + Redis + API + Web + PDF Parser)
docker-compose up -d

# 2. Migration çalıştır (container içinde)
docker exec -it finance-api npx prisma migrate deploy

# 3. Uygulamaya eriş
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# PDF Parser: http://localhost:8001

# Sadece veritabanlarını başlat (development)
docker-compose up -d postgres redis

# Logları izle
docker-compose logs -f api

# Durdur
docker-compose down
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
- 444 test (25 test suite)
- Unit testler (services, controllers)
- Integration testler
- E2E testler
- Test utilities ve mocks
- jest-dom TypeScript types

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

### FAZ 6: Open Banking & Encryption ✅ (2026-01-03)
- AES-256-GCM token şifreleme (EncryptionService)
- BankSyncService - günlük otomatik senkronizasyon
- Bank connection token encryption
- BANK_ENCRYPTION_KEY environment variable

### FAZ 7: Desktop App ✅ (2026-01-03)
- Electron desktop uygulaması (apps/desktop/)
- System tray minimize
- Global shortcut (Ctrl+Shift+G)
- Secure IPC bridge (contextIsolation)

### FAZ 8: i18n (Çoklu Dil) ✅ (2026-01-03)
- Türkçe ve İngilizce dil desteği
- locales/tr.json, locales/en.json
- I18nProvider context
- LanguageSwitcher bileşeni
- localStorage ile tercih kaydetme

### FAZ 9: Aile Hesapları ✅ (2026-01-03)
- Household, HouseholdMember, HouseholdBudget modelleri
- Davet sistemi (5 dakika geçerli kod)
- Rol bazlı erişim (owner, admin, member)
- Paylaşımlı bütçeler

### FAZ 10: Multi-Currency ✅ (2026-01-03)
- 8 para birimi desteği (TRY, USD, EUR, GBP, CHF, JPY, AUD, CAD)
- Exchange rate API entegrasyonu
- Fallback rates (offline)
- Günlük rate refresh (cron job)
- Para birimi dönüştürme endpoint'leri

### FAZ 11: Gelişmiş Raporlama ✅ (2026-01-03)
- Yıllık karşılaştırma raporu (bu yıl vs geçen yıl)
- Kategori trend analizi (6-12 ay)
- Linear regression ile trend algılama
- Tasarruf oranı hesaplama
- Scheduled email reports

### FAZ 12: Akıllı Bildirimler ✅ (2026-01-03)
- Olağandışı harcama uyarıları (anomaly detection)
- Fatura hatırlatıcıları (urgent/high/medium/low)
- Bütçe uyarıları (%75, %90, %100)
- Haftalık özet (Pazar 09:00)
- Aylık özet (Ayın 1'i 10:00)
- Bildirim tercihleri yönetimi

### FAZ 13: Bildirim Zamanlayıcı ✅ (2026-01-03)
- NotificationSchedulerService - koordineli bildirim gönderimi
- PushNotificationService - web-push (VAPID) desteği
- Cron job'ları gerçek email ve push gönderecek şekilde bağlandı
- Push notification endpoint'leri (subscribe/unsubscribe)
- SMTP ve VAPID environment variable'ları

### FAZ 14: PDF Parser - Gelişmiş Banka Desteği ✅ (2026-01-03)
- 10 yeni Türk bankası eklendi (ING, HSBC, Odeabank, Albaraka, Şekerbank, vb.)
- BankParserFactory - akıllı parser seçimi
- Banka-özgü parser'lar (Garanti, İşbank, Yapıkredi, Ziraat, Akbank, Enpara, Papara, QNB)
- /banks endpoint'i - desteklenen bankaları listeler
- tx_type bug düzeltildi

### FAZ 15: Dashboard Real-time Updates ✅ (2026-01-03)
- RealtimeContext - uygulama genelinde real-time state yönetimi
- RealtimeProvider - app layout'a eklendi
- ConnectionStatus bileşeni - bağlantı durumu göstergesi
- useRealtime hook entegrasyonu (transaction/budget olayları)
- Real-time olaylarda dashboard otomatik yenileme

### FAZ 16: Lint Uyarıları Düzeltildi ✅ (2026-01-03)
- bank-connections useEffect: loadData useCallback ile sarıldı
- auth-provider useEffect: router dependency eklendi

### FAZ 17: Production-Grade Improvements ✅ (2026-01-23)
- Comprehensive seed script with demo data (3 plans, demo user, 19 transactions, 3 budgets, 2 goals, 3 bills)
- Zod-based environment validation at startup
- File upload security (MIME type + magic byte verification)
- RUNBOOK.md operations guide
- EmptyState & LoadingState UI components
- 5-minute quick start setup

### FAZ 18: Admin Dashboard ✅ (2026-01-23)
- AdminService with dashboard stats, user list, subscription list, payment history
- Admin API endpoints (/admin/verify, /admin/stats, /admin/users, /admin/payments)
- Admin dashboard frontend page with stats cards, tabs, search, pagination
- Plan distribution and revenue charts

### FAZ 19: Premium Export Features ✅ (2026-01-23)
- Export endpoints with plan feature guards (exportCsv, exportPdf)
- ExportModal component with plan-based access
- CSV, Excel, PDF export formats
- Premium upsell for free users

### FAZ 20: Comprehensive Testing ✅ (2026-01-23)
- 44 new backend tests (488 total)
  - AdminService: 17 tests
  - BillingService: 14 tests
  - ExportService: 13 tests
- 14 Playwright E2E tests
  - Auth tests (5 tests)
  - Landing page tests (5 tests)
  - Navigation tests (4 tests)

### FAZ 21: Claude Code Tooling ✅ (2026-01-23)
- SessionStart hook for dev environment check
- Custom slash commands (/check, /add-feature, /fix-bug, /deploy-checklist)
- settings.json configuration
- Stop hook for verify script

### FAZ 22: AI Tool-Use & Cashflow Forecast ✅ (2026-01-23)
- **AI Tool-Use Pattern**:
  - AssistantService with 7 financial data tools
  - Intent analysis for Türkçe/English queries
  - Natural language response generation
  - POST /ai/chat endpoint with tool execution
  - FinancialAssistant now uses backend API (not Gemini)
- **Cashflow Forecast**:
  - ForecastService with 30-day prediction
  - Historical transaction pattern analysis
  - Bill and subscription integration
  - Insights and warnings generation
  - CashflowForecast dashboard widget
  - GET /analytics/cashflow endpoint
- **Claude Code Commands**:
  - /ux-audit: UX quality audit (a11y, consistency, responsive)
  - /api-contract: API documentation and consistency check
  - /perf-audit: Performance audit (bundle, caching, database)

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
- [x] Test infrastructure (444 test)
- [x] Open Banking encryption
- [x] Electron desktop app
- [x] i18n (Türkçe/İngilizce)
- [x] Aile hesapları (Household)
- [x] Multi-currency desteği
- [x] Gelişmiş raporlama
- [x] Akıllı bildirimler
- [x] CI/CD fixes

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

## 🧠 HAFIZA YÖNETİMİ (Memory Patterns)

> claude-mem projesinden öğrenilen patterns

### Progressive Disclosure Pattern
Bağlam enjeksiyonu için 3 katmanlı yaklaşım:
1. **Search Index** → Kompakt özet (düşük token)
2. **Timeline Context** → Zaman bazlı bağlam
3. **Full Details** → Tam detay (yüksek token)

### Context Retrieval Stratejisi
```
┌─────────────────────────────────────────┐
│ 1. Önce ilgili ID'leri ara (düşük maliyet) │
│ 2. Sadece gerekli detayları getir         │
│ 3. AI ile özetle ve sıkıştır              │
└─────────────────────────────────────────┘
```

### Lifecycle Hooks
| Hook | Tetiklenme Zamanı | Kullanım |
|------|-------------------|----------|
| `SessionStart` | Oturum başlangıcı | Bağlam yükleme |
| `UserPromptSubmit` | Kullanıcı mesajı | Input analizi |
| `PostToolUse` | Araç kullanımı sonrası | Gözlem kaydetme |
| `Stop` | Görev bitişi | Özet oluşturma |
| `SessionEnd` | Oturum sonu | Kalıcı kayıt |

### Token Optimizasyonu
- Filtreleme önce, detay sonra (~10x tasarruf)
- Hybrid search: Full-text + Semantic
- Kompresyon: AI destekli özetleme

---

## 🤖 AI AGENT EN İYİ PRATİKLERİ

> 30+ AI aracından öğrenilen patterns

### Güvenlik Öncelikleri
1. **Hassas veri maskeleme** - PII, API anahtarları
2. **Rate limiting** - Abuse prevention
3. **Input validation** - Injection koruması
4. **Audit logging** - İşlem takibi

### Bağlam Yönetimi
```typescript
// Etkili bağlam yapısı
interface Context {
  project: ProjectInfo;      // Proje meta verisi
  recentActions: Action[];   // Son 5-10 işlem
  relevantFiles: string[];   // İlgili dosyalar
  userPreferences: Prefs;    // Kullanıcı tercihleri
}
```

### Çıktı Formatları
- **Kod**: Syntax highlighting ile
- **Tablolar**: Markdown table formatı
- **Listeler**: Bullet points
- **Hatalar**: Kod + açıklama + çözüm

### Anti-Patterns (Kaçınılması Gerekenler)
- ❌ Gereksiz dosya oluşturma
- ❌ Okunmamış dosyayı düzenleme
- ❌ Aşırı mühendislik
- ❌ Kullanıcıya sormadan büyük değişiklik
- ❌ Hassas verileri commit etme

---

## 📋 GÖREV ORKESTRASYONİ (Task Patterns)

> vibe-kanban projesinden öğrenilen patterns

### Paralel Görev Yönetimi
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Task A     │  │  Task B     │  │  Task C     │
│  (bağımsız) │  │  (bağımsız) │  │  (bağımsız) │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌─────────────────┐
              │  Sonuç Birleşim │
              └─────────────────┘
```

### Sıralı Bağımlılıklar
```
Task A (önkoşul) → Task B (bağımlı) → Task C (bağımlı)
```

### Görev Durumları
| Durum | Anlamı | Sonraki Adım |
|-------|--------|--------------|
| `pending` | Bekliyor | Başlat |
| `in_progress` | Çalışıyor | İzle |
| `blocked` | Engellendi | Sorunu çöz |
| `completed` | Tamamlandı | Sonraki göreve geç |

### MCP Konfigürasyonu
- Merkezi araç yönetimi
- Modüler servis entegrasyonu
- Uzaktan erişim desteği (SSH/tunnel)

---

## 🔄 OTURUM YÖNETİMİ

### Oturum Başlangıcı Kontrol Listesi
- [ ] CLAUDE.md oku ve bağlamı yükle
- [ ] Son commit'leri incele
- [ ] Açık issue/PR'ları kontrol et
- [ ] Mevcut branch'i doğrula

### Oturum Sonu Kontrol Listesi
- [ ] Tüm değişiklikleri commit et
- [ ] CLAUDE.md'yi güncelle
- [ ] `npm run verify` çalıştır
- [ ] Özet rapor hazırla

### Kritik Dosyalar (Her Zaman Oku)
1. `CLAUDE.md` - Bu dosya
2. `package.json` - Bağımlılıklar
3. `apps/api/prisma/schema.prisma` - DB şeması
4. `.env.example` - Konfigürasyon

---

## 📊 METRIKLER VE İZLEME

### Proje Metrikleri
| Metrik | Değer | Hedef |
|--------|-------|-------|
| Backend Tests | 488 | 500+ |
| E2E Tests | 14 | 20+ |
| Test Coverage | ~70% | 80%+ |
| Lint Uyarıları | 0 | 0 |
| TypeScript Strict | ✅ | ✅ |
| Build Süresi | ~30s | <30s |

### API Performans Hedefleri
| Endpoint | Hedef Yanıt Süresi |
|----------|-------------------|
| Auth | <100ms |
| Transactions | <200ms |
| Reports | <500ms |
| PDF Parse | <5s |

---

## 🔗 FAYDALI LİNKLER

- [README.md](README.md) - Genel bilgi
- [FEATURES_ADDED.md](FEATURES_ADDED.md) - Eklenen özellikler
- [IMPROVEMENTS.md](IMPROVEMENTS.md) - İyileştirmeler
- [QUICK_START.md](QUICK_START.md) - Hızlı başlangıç

### Öğrenme Kaynakları
- [claude-mem](https://github.com/thedotmack/claude-mem) - Memory patterns
- [vibe-kanban](https://github.com/BloopAI/vibe-kanban) - Task orchestration

---

*Bu dosya her önemli değişiklikte güncellenmelidir.*
*Son güncelleme: 2026-01-03 - Memory patterns ve AI best practices eklendi.*
