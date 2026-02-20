<p align="center">
  <img src="https://img.shields.io/badge/version-2.5-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/node-20+-brightgreen.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/typescript-5.0-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/tests-447%20passing-success.svg" alt="Tests">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<h1 align="center">ğŸ’° Gelir-Gider Takip UygulamasÄ±</h1>

<p align="center">
  <strong>Modern, full-stack finans yÃ¶netim uygulamasÄ±</strong><br>
  PDF banka ekstrelerini otomatik parse eder, akilli kategorilendirme yapar ve <strong>Gemini AI</strong> ile PII maskeli finansal sohbet sunar.
</p>

<p align="center">
  <a href="#-Ã¶zellikler">Ã–zellikler</a> â€¢
  <a href="#-hÄ±zlÄ±-baÅŸlangÄ±Ã§">Kurulum</a> â€¢
  <a href="#-mimari">Mimari</a> â€¢
  <a href="#-api-endpoints">API</a> â€¢
  <a href="#-ekran-gÃ¶rÃ¼ntÃ¼leri">Ekran GÃ¶rÃ¼ntÃ¼leri</a>
</p>

---

## âœ¨ Ã–zellikler

### ğŸ¤– AI Destekli Ã–zellikler
| Ã–zellik | AÃ§Ä±klama |
|---------|----------|
| **AkÄ±llÄ± Ä°ÅŸlem Ekleme** | "BugÃ¼n markette 250 TL harcadÄ±m" â†’ otomatik parse |
| **Finansal Ä°Ã§gÃ¶rÃ¼ler** | AI tabanlÄ± harcama analizi ve tavsiyeler |
| **Finansal Asistan (PII maskeli)** | Harcamalariniz hakkinda guvenli sohbet |
| **Anomali Tespiti** | Beklenmedik harcama uyarÄ±larÄ± |

### ğŸ’³ Finans YÃ¶netimi
- âœ… PDF banka ekstresi yÃ¼kleme (13+ banka desteÄŸi)
- âœ… AkÄ±llÄ± kategori sÄ±nÄ±flandÄ±rmasÄ± (19+ kategori)
- âœ… BÃ¼tÃ§e yÃ¶netimi ve uyarÄ±lar
- âœ… Tasarruf hedefleri takibi
- âœ… Fatura ve abonelik yÃ¶netimi
- âœ… BorÃ§ takibi
- ✅ Tekrarlayan odemeler: sadece abonelikler + faturalar

### ğŸ“Š Raporlama & Analitik
- âœ… Dashboard Ã¶zet kartlarÄ±
- âœ… Kategori bazlÄ± analiz ve grafikler
- âœ… PDF & Excel rapor oluÅŸturma
- âœ… HaftalÄ±k/aylÄ±k trend analizi

### ğŸ¨ KullanÄ±cÄ± Deneyimi
- ğŸŒ™ Dark mode desteÄŸi
- ğŸŒ TÃ¼rkÃ§e/Ä°ngilizce dil seÃ§eneÄŸi
- ğŸ’± Ã‡oklu para birimi (TRY/USD/EUR)
- ğŸ“± Mobil uyumlu tasarÄ±m
- ğŸ” 2FA gÃ¼venlik

---

## ğŸ—ï¸ Mimari

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    FRONTEND (Next.js 14)                    â”‚
â”‚                    http://localhost:3000                    â”‚
â”‚        TypeScript â€¢ Tailwind CSS â€¢ React Query              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚ REST API
                             â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    BACKEND (NestJS 10)                      â”‚
â”‚                    http://localhost:3001                    â”‚
â”‚          TypeScript â€¢ Prisma ORM â€¢ JWT Auth                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚
         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
         â–¼                   â–¼                   â–¼
   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â”‚PostgreSQL â”‚       â”‚   Redis   â”‚       â”‚PDF Parser â”‚
   â”‚   :5432   â”‚       â”‚   :6379   â”‚       â”‚  :8001    â”‚
   â”‚   (DB)    â”‚       â”‚  (Cache)  â”‚       â”‚ (FastAPI) â”‚
   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Servis | Teknoloji | Port | AÃ§Ä±klama |
|--------|-----------|------|----------|
| **Frontend** | Next.js 14 + TypeScript + Tailwind | 3000 | Modern web arayÃ¼zÃ¼ |
| **Backend** | NestJS 10 + TypeScript + Prisma | 3001 | REST API servisi |
| **Database** | PostgreSQL 16 | 5432 | Ana veritabanÄ± |
| **Cache** | Redis 7 | 6379 | Cache & session |
| **PDF Parser** | Python FastAPI + pdfplumber | 8001 | PDF parsing mikroservisi |

---

## ğŸš€ HÄ±zlÄ± BaÅŸlangÄ±Ã§

### Gereksinimler
- Node.js 20+
- Python 3.11+
- Docker (Ã¶nerilen)
- Gemini API Key ([al](https://aistudio.google.com/app/apikey))

### Docker ile Kurulum (Ã–nerilen)

```bash
# 1. Repository'yi klonla
git clone https://github.com/EmreUludasdemir/Gelir-Gider-App.git
cd Gelir-Gider-App

# 2. Environment dosyasÄ±nÄ± oluÅŸtur
cp apps/api/.env.example apps/api/.env

# 3. .env dosyasÄ±nÄ± dÃ¼zenle - GEMINI_API_KEY zorunlu!
# Optional: NEXT_PUBLIC_GEMINI_API_KEY for client-side AI features
# Gemini API Key al: https://aistudio.google.com/app/apikey
nano apps/api/.env

# 4. TÃ¼m servisleri baÅŸlat
docker-compose up -d

# 5. Migration'larÄ± Ã§alÄ±ÅŸtÄ±r (container iÃ§inde)
docker exec -it finance-api npx prisma migrate deploy

# 6. UygulamayÄ± aÃ§
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

### Sadece DB + Redis ile Kurulum (GeliÅŸtirme)

```bash
# 1. Sadece veritabanlarÄ±nÄ± baÅŸlat
docker-compose up -d postgres redis

# 2. BaÄŸÄ±mlÄ±lÄ±klarÄ± yÃ¼kle
npm install

# 3. Backend kurulumu
cd apps/api
cp .env.example .env
# .env dosyasÄ±nÄ± dÃ¼zenle: GEMINI_API_KEY ekle
# Optional: NEXT_PUBLIC_GEMINI_API_KEY for client-side AI features
npx prisma generate
npx prisma migrate dev  # Development iÃ§in
cd ../..

# 4. Frontend kurulumu
cd apps/web && npm install && cd ../..

# 5. PDF Parser kurulumu
cd services/pdf-parser
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# veya: .venv\Scripts\activate  # Windows
pip install -r requirements.txt
cd ../..

# 6. TÃ¼m servisleri baÅŸlat
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

## ğŸ“¡ API Endpoints

### ğŸ” Authentication
```http
POST /auth/register     # KayÄ±t ol
POST /auth/login        # GiriÅŸ yap
POST /auth/refresh      # Token yenile
GET  /auth/profile      # Profil bilgisi
POST /auth/2fa/enable   # 2FA aktifleÅŸtir
```

### ğŸ’³ Transactions
```http
GET    /transactions           # TÃ¼m iÅŸlemler (pagination, filter)
POST   /transactions           # Yeni iÅŸlem
GET    /transactions/:id       # Ä°ÅŸlem detay
PATCH  /transactions/:id       # GÃ¼ncelle
DELETE /transactions/:id       # Sil
GET    /transactions/summary   # Dashboard Ã¶zeti
```

### ğŸ“Š Budgets & Goals
```http
GET  /budgets              # TÃ¼m bÃ¼tÃ§eler
POST /budgets              # Yeni bÃ¼tÃ§e
GET  /budgets/alerts       # BÃ¼tÃ§e uyarÄ±larÄ±
GET  /savings-goals        # Tasarruf hedefleri
POST /savings-goals        # Yeni hedef
```

### ğŸ“ˆ Reports
```http
GET /reports/generate?format=pdf&startDate=X&endDate=Y
GET /reports/generate?format=excel&startDate=X&endDate=Y
```



### AI
```http
GET /ai/insights
GET /ai/predictions
GET /ai/anomalies
POST /ai/chat
```
### â¤ï¸ Health Checks
```http
GET /health          # Genel saÄŸlÄ±k durumu
GET /health/ready    # Readiness probe
GET /health/live     # Liveness probe
```

---

## ğŸ§ª Test

```bash
# Backend testleri (447 test)
cd apps/api && npm test

# Coverage raporu
npm run test:cov

# E2E testler
npm run test:e2e
```

**Test Durumu:** 447 test âœ… | 26 test suite | ~27s

---

## ğŸ›¡ï¸ GÃ¼venlik

- âœ… JWT tabanlÄ± kimlik doÄŸrulama
- âœ… Ä°ki faktÃ¶rlÃ¼ doÄŸrulama (2FA)
- âœ… Rate limiting
- âœ… CORS yapÄ±landÄ±rmasÄ±
- âœ… Helmet security headers
- âœ… Input sanitization
- âœ… SQL injection korumasÄ±
- âœ… XSS korumasÄ±

---

## ğŸ“¦ Teknoloji Stack

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

## ğŸ—‚ï¸ Proje YapÄ±sÄ±

```
.
â”œâ”€â”€ ğŸ“ apps/
â”‚   â”œâ”€â”€ ğŸ“ api/               # NestJS Backend
â”‚   â”‚   â”œâ”€â”€ prisma/           # Database schema
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ modules/      # Feature modules
â”‚   â”‚   â”‚   â””â”€â”€ shared/       # Shared utilities
â”‚   â”‚   â””â”€â”€ test/             # Tests
â”‚   â”‚
â”‚   â”œâ”€â”€ ğŸ“ web/               # Next.js Frontend
â”‚   â”‚   â”œâ”€â”€ app/              # App Router pages
â”‚   â”‚   â”œâ”€â”€ components/       # React components
â”‚   â”‚   â””â”€â”€ lib/              # Utilities
â”‚   â”‚
â”‚   â””â”€â”€ ğŸ“ mobile/            # React Native (Expo)
â”‚
â”œâ”€â”€ ğŸ“ services/
â”‚   â””â”€â”€ ğŸ“ pdf-parser/        # Python FastAPI
â”‚
â”œâ”€â”€ ğŸ“ .github/
â”‚   â”œâ”€â”€ workflows/            # CI/CD pipelines
â”‚   â””â”€â”€ ISSUE_TEMPLATE/       # Issue templates
â”‚
â”œâ”€â”€ ğŸ“„ docker-compose.yml     # Docker orchestration
â”œâ”€â”€ ğŸ“„ CLAUDE.md              # Project memory file
â””â”€â”€ ğŸ“„ README.md
```

---

## Production Checklist

Run these commands before deploying:

```bash
npm ci --workspaces --include-workspace-root
npm run lint
npm run test -w @app/api
npm run test -w @app/web
npm run build
npm run verify
```

Environment contract (required for production):

- `PORT` (or `API_PORT` fallback)
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `ENCRYPTION_KEY`
- `FRONTEND_URL`
- `CORS_ORIGINS`

Notes:

- `apps/web` unit tests and Playwright e2e tests are split (`npm test -w @app/web` vs `npm run test:e2e -w @app/web`).
- API unit and e2e tests are split (`npm run test:unit -w @app/api` vs `npm run test:e2e -w @app/api`).
- `npm run verify` is cross-platform and works on Windows/Linux/macOS.

---

## ğŸ¤ KatkÄ±da Bulunma

KatkÄ±larÄ±nÄ±zÄ± memnuniyetle karÅŸÄ±lÄ±yoruz! LÃ¼tfen ÅŸu adÄ±mlarÄ± izleyin:

1. Fork yapÄ±n
2. Feature branch oluÅŸturun (`git checkout -b feature/amazing-feature`)
3. DeÄŸiÅŸikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request aÃ§Ä±n

---

## ğŸ“„ Lisans

Bu proje [MIT](LICENSE) lisansÄ± altÄ±nda lisanslanmÄ±ÅŸtÄ±r.

---

## ğŸ‘¨â€ğŸ’» GeliÅŸtirici

<p align="center">
  <strong>Emre UludaÅŸdemir</strong><br>
  <a href="https://github.com/EmreUludasdemir">@EmreUludasdemir</a>
</p>

---

<p align="center">
  â­ Bu projeyi beÄŸendiyseniz yÄ±ldÄ±z vermeyi unutmayÄ±n!
</p>




