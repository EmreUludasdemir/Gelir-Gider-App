<p align="center">
  <img src="https://img.shields.io/badge/version-2.5-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/node-20+-brightgreen.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/typescript-5.0-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/tests-141%20passing-success.svg" alt="Tests">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<h1 align="center">💰 Gelir-Gider Takip Uygulaması</h1>

<p align="center">
  <strong>Modern, full-stack finans yönetim uygulaması</strong><br>
  PDF banka ekstrelerini otomatik parse eder, akıllı kategorilendirme yapar ve <strong>Gemini AI</strong> ile finansal tavsiyeler sunar.
</p>

<p align="center">
  <a href="#-özellikler">Özellikler</a> •
  <a href="#-hızlı-başlangıç">Kurulum</a> •
  <a href="#-mimari">Mimari</a> •
  <a href="#-api-endpoints">API</a> •
  <a href="#-ekran-görüntüleri">Ekran Görüntüleri</a>
</p>

---

## ✨ Özellikler

### 🤖 AI Destekli Özellikler
| Özellik | Açıklama |
|---------|----------|
| **Akıllı İşlem Ekleme** | "Bugün markette 250 TL harcadım" → otomatik parse |
| **Finansal İçgörüler** | AI tabanlı harcama analizi ve tavsiyeler |
| **Finansal Asistan** | Harcamalarınız hakkında sohbet edin |
| **Anomali Tespiti** | Beklenmedik harcama uyarıları |

### 💳 Finans Yönetimi
- ✅ PDF banka ekstresi yükleme (13+ banka desteği)
- ✅ Akıllı kategori sınıflandırması (19+ kategori)
- ✅ Bütçe yönetimi ve uyarılar
- ✅ Tasarruf hedefleri takibi
- ✅ Fatura ve abonelik yönetimi
- ✅ Borç takibi
- ✅ Tekrarlayan ödeme tespiti

### 📊 Raporlama & Analitik
- ✅ Dashboard özet kartları
- ✅ Kategori bazlı analiz ve grafikler
- ✅ PDF & Excel rapor oluşturma
- ✅ Haftalık/aylık trend analizi

### 🎨 Kullanıcı Deneyimi
- 🌙 Dark mode desteği
- 🌍 Türkçe/İngilizce dil seçeneği
- 💱 Çoklu para birimi (TRY/USD/EUR)
- 📱 Mobil uyumlu tasarım
- 🔐 2FA güvenlik

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                    │
│                    http://localhost:3000                    │
│        TypeScript • Tailwind CSS • React Query              │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS 10)                      │
│                    http://localhost:3001                    │
│          TypeScript • Prisma ORM • JWT Auth                 │
└────────────────────────────┬────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │PostgreSQL │       │   Redis   │       │PDF Parser │
   │   :5432   │       │   :6379   │       │  :8001    │
   │   (DB)    │       │  (Cache)  │       │ (FastAPI) │
   └───────────┘       └───────────┘       └───────────┘
```

| Servis | Teknoloji | Port | Açıklama |
|--------|-----------|------|----------|
| **Frontend** | Next.js 14 + TypeScript + Tailwind | 3000 | Modern web arayüzü |
| **Backend** | NestJS 10 + TypeScript + Prisma | 3001 | REST API servisi |
| **Database** | PostgreSQL 16 | 5432 | Ana veritabanı |
| **Cache** | Redis 7 | 6379 | Cache & session |
| **PDF Parser** | Python FastAPI + pdfplumber | 8001 | PDF parsing mikroservisi |

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 20+
- Python 3.11+
- Docker (önerilen)
- Gemini API Key ([al](https://aistudio.google.com/app/apikey))

### Docker ile Kurulum (Önerilen)

```bash
# Repository'yi klonla
git clone https://github.com/EmreUludasdemir/Gelir-Gider-Uygulamas--Claude.git
cd Gelir-Gider-Uygulamas--Claude

# Environment dosyasını oluştur
cp apps/api/.env.example apps/api/.env
# .env dosyasını düzenleyip API key'leri girin

# Tüm servisleri başlat
docker-compose up -d

# Migration'ları çalıştır
cd apps/api && npx prisma migrate dev
```

### Manuel Kurulum

```bash
# Root dependencies
npm install

# Backend
cd apps/api && npm install
npx prisma generate
npx prisma migrate dev
cd ../..

# Frontend
cd apps/web && npm install
cd ../..

# PDF Parser
cd services/pdf-parser
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
cd ../..

# Development
npm run dev
```

### Servisler
| Servis | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| API Docs | http://localhost:3001/api |
| PDF Parser | http://localhost:8001 |

---

## 📡 API Endpoints

### 🔐 Authentication
```http
POST /auth/register     # Kayıt ol
POST /auth/login        # Giriş yap
POST /auth/refresh      # Token yenile
GET  /auth/profile      # Profil bilgisi
POST /auth/2fa/enable   # 2FA aktifleştir
```

### 💳 Transactions
```http
GET    /transactions           # Tüm işlemler (pagination, filter)
POST   /transactions           # Yeni işlem
GET    /transactions/:id       # İşlem detay
PATCH  /transactions/:id       # Güncelle
DELETE /transactions/:id       # Sil
GET    /transactions/summary   # Dashboard özeti
```

### 📊 Budgets & Goals
```http
GET  /budgets              # Tüm bütçeler
POST /budgets              # Yeni bütçe
GET  /budgets/alerts       # Bütçe uyarıları
GET  /savings-goals        # Tasarruf hedefleri
POST /savings-goals        # Yeni hedef
```

### 📈 Reports
```http
GET /reports/generate?format=pdf&startDate=X&endDate=Y
GET /reports/generate?format=excel&startDate=X&endDate=Y
```

### ❤️ Health Checks
```http
GET /health          # Genel sağlık durumu
GET /health/ready    # Readiness probe
GET /health/live     # Liveness probe
```

---

## 🧪 Test

```bash
# Backend testleri (141 test)
cd apps/api && npm test

# Coverage raporu
npm run test:cov

# E2E testler
npm run test:e2e
```

**Test Durumu:** 141 test ✅ | 10 test suite | ~11s

---

## 🛡️ Güvenlik

- ✅ JWT tabanlı kimlik doğrulama
- ✅ İki faktörlü doğrulama (2FA)
- ✅ Rate limiting
- ✅ CORS yapılandırması
- ✅ Helmet security headers
- ✅ Input sanitization
- ✅ SQL injection koruması
- ✅ XSS koruması

---

## 📦 Teknoloji Stack

<table>
<tr>
<td>

**Frontend**
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS
- React Query / SWR
- Recharts

</td>
<td>

**Backend**
- NestJS 10
- TypeScript 5
- Prisma ORM
- PostgreSQL 16
- Redis 7
- Winston Logger

</td>
<td>

**DevOps**
- Docker & Docker Compose
- GitHub Actions CI/CD
- Jest & Playwright
- ESLint & Prettier

</td>
</tr>
</table>

---

## 🗂️ Proje Yapısı

```
.
├── 📁 apps/
│   ├── 📁 api/               # NestJS Backend
│   │   ├── prisma/           # Database schema
│   │   ├── src/
│   │   │   ├── modules/      # Feature modules
│   │   │   └── shared/       # Shared utilities
│   │   └── test/             # Tests
│   │
│   ├── 📁 web/               # Next.js Frontend
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities
│   │
│   └── 📁 mobile/            # React Native (Expo)
│
├── 📁 services/
│   └── 📁 pdf-parser/        # Python FastAPI
│
├── 📁 .github/
│   ├── workflows/            # CI/CD pipelines
│   └── ISSUE_TEMPLATE/       # Issue templates
│
├── 📄 docker-compose.yml     # Docker orchestration
├── 📄 CLAUDE.md              # Project memory file
└── 📄 README.md
```

---

## 🤝 Katkıda Bulunma

Katkılarınızı memnuniyetle karşılıyoruz! Lütfen şu adımları izleyin:

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje [MIT](LICENSE) lisansı altında lisanslanmıştır.

---

## 👨‍💻 Geliştirici

<p align="center">
  <strong>Emre Uludaşdemir</strong><br>
  <a href="https://github.com/EmreUludasdemir">@EmreUludasdemir</a>
</p>

---

<p align="center">
  ⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
</p>