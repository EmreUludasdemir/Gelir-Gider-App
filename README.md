# Gelir-Gider App

Monorepo yapisinda gelir-gider takip uygulamasi.

Servisler:
- `apps/web`: Next.js web uygulamasi
- `apps/api`: NestJS API
- `services/pdf-parser`: FastAPI PDF parser

Temel ozellikler:
- PDF ekstre parse etme
- gelir/gider islemleri
- butce, tasarruf hedefi ve faturalar
- server-side AI endpointleri (`/ai/*`)
- cookie tabanli web auth (`HttpOnly` access/refresh cookie)
- realtime bildirimler

## Planlama Dokumanlari
Urun yonu ve uygulanabilir backlog burada tutulur:
- `docs/PRODUCT_ROADMAP.md`: urun vizyonu, fazlar ve oncelik sirasi
- `docs/PRODUCT_BACKLOG.md`: epikler, issue adaylari, acceptance criteria ve sprint onceligi

## Mimari
- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- PDF Parser: `http://localhost:8001`
- Database: PostgreSQL
- Cache: Redis

Web uygulamasi browser tarafinda JWT saklamaz.
- login/refresh cevaplari JSON token body dondurmeye devam eder
- web tarafi bu body'yi auth kaynagi olarak kullanmaz
- session `access_token` ve `refresh_token` HttpOnly cookie ile tasinir
- AI anahtari sadece server-side `GEMINI_API_KEY` olarak kullanilir

## Gereksinimler
- Node.js 20+
- npm 10+
- Python 3.11+
- Docker ve Docker Compose

## Hızlı Kurulum
```bash
npm ci --workspaces --include-workspace-root
copy .env.example .env
copy apps\api\.env.example apps\api\.env
```

Gerekli env degiskenleri:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`
- `ENCRYPTION_KEY`
- `APP_URL`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `NEXT_PUBLIC_API_URL`
- `GEMINI_API_KEY` (AI ozellikleri icin)

Kritik notlar:
- `NEXT_PUBLIC_GEMINI_API_KEY` kullanilmaz.
- PDF parser CORS allowlist'i `CORS_ORIGINS` ile yonetilir.
- Production ortaminda kritik secret'lar fallback ile calistirilmaz.

## Lokalde Calistirma
Altyapi servisleri:
```bash
docker compose up -d postgres redis
```

PDF parser:
```bash
cd services/pdf-parser
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

API:
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Web:
```bash
cd apps/web
npm run dev
```

## Docker ile Calistirma
Gelistirme:
```bash
docker compose up -d --build
```

Production benzeri:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Health endpointleri:
- API: `http://localhost:3001/health`
- PDF Parser: `http://localhost:8001/health`

## Test ve Dogrulama
Root:
```bash
npm run verify
```

API:
```bash
npm run lint -w @app/api
npm test -w @app/api
npm run test:unit -w @app/api
npm run test:e2e -w @app/api
npm run build -w @app/api
```

Web:
```bash
npm run lint -w @app/web
npm test -w @app/web
npm run test:e2e -w @app/web
npm run test:e2e:ci -w @app/web
npm run build -w @app/web
```

Parser:
```bash
cd services/pdf-parser
python -m pytest --tb=short
```

## Auth Sozlesmesi
Yeni web auth modeli:
- `POST /auth/login`: JSON response + HttpOnly cookie set eder
- `POST /auth/refresh`: body token veya `refresh_token` cookie ile calisir
- `GET /auth/me`: aktif web session kullanicisini dondurur
- `POST /auth/logout`: auth cookie'lerini temizler

Web istemcisi:
- `credentials: 'include'` kullanir
- `localStorage` token sozlesmesine dayanmaz
- middleware `access_token` cookie'sini kontrol eder

## AI Sozlesmesi
AI endpointleri sadece backend tarafinda cagrilir:
- `POST /ai/parse`
- `GET /ai/insights`
- `GET /ai/anomalies`
- `POST /ai/chat`

PII korumasi:
- aciklama, kategori, e-posta, telefon, kart, IBAN, TCKN benzeri alanlar maskelenir
- browser tarafinda Gemini SDK kullanilmaz

## CI/CD
Workflow dosyalari:
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/deploy.yml`

Standartlar:
- root `npm ci --workspaces --include-workspace-root`
- web unit ve Playwright e2e ayri calisir
- workflow branch filtreleri `main`, `develop`, `claude/**`
- workflow'larda minimum `permissions` tanimlidir

## Production Checklist
Deploy oncesi:
```bash
npm ci --workspaces --include-workspace-root
npm run lint -w @app/api
npm run lint -w @app/web
npm test -w @app/api
npm test -w @app/web
npm run test:e2e -w @app/web
npm run build -w @app/api
npm run build -w @app/web
npm run verify
```

Production icin dogrula:
- `docker-compose.prod.yml` secret'lari eksiksiz
- `CORS_ORIGINS` web ve parser originlerini kapsiyor
- `APP_URL` ve `FRONTEND_URL` dogru domain'e ayarli
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY` guclu degerler
- `GEMINI_API_KEY` sadece server-side ortamda mevcut



