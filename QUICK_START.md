# QUICK START

Bu dosya sifirdan kurulum icin kisa akistir.

## 1. Repo dizinine gir
```bash
cd Gelir-Gider-App-1
```

## 2. Bagimliliklari yukle
```bash
npm ci --workspaces --include-workspace-root
```

## 3. Env dosyalarini hazirla
```bash
copy .env.example .env
copy apps\api\.env.example apps\api\.env
```

Minimum gerekli env degerleri:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`
- `ENCRYPTION_KEY`
- `APP_URL=http://localhost:3000`
- `FRONTEND_URL=http://localhost:3000`
- `CORS_ORIGINS=http://localhost:3000`
- `NEXT_PUBLIC_API_URL=http://localhost:3001`

AI kullanacaksan:
- `GEMINI_API_KEY`

Not:
- `NEXT_PUBLIC_GEMINI_API_KEY` kullanma.
- Web auth token'i `localStorage`'da tutulmaz.

## 4. Altyapiyi kaldir
```bash
docker compose up -d postgres redis
```

## 5. PDF parser'i baslat
```bash
cd services/pdf-parser
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Beklenen health:
```bash
curl http://localhost:8001/health
```

## 6. API'yi baslat
Yeni terminal:
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Beklenen health:
```bash
curl http://localhost:3001/health
```

## 7. Web'i baslat
Yeni terminal:
```bash
cd apps/web
npm run dev
```

Tarayici:
- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Parser: `http://localhost:8001`

## 8. Dogrulama komutlari
Root dizin:
```bash
npm run verify
npm run lint -w @app/api
npm run lint -w @app/web
npm run build -w @app/api
npm run build -w @app/web
```

Test ayrimi:
```bash
npm run test:unit -w @app/api
npm run test:e2e -w @app/api
npm test -w @app/web
npm run test:e2e -w @app/web
npm run test:e2e:ci -w @app/web
```

## 9. Session ve auth notlari
- login sonrasi web `access_token` ve `refresh_token` HttpOnly cookie alir
- `GET /auth/me` ile session bootstrap edilir
- middleware `access_token` cookie'sini kontrol eder
- `POST /auth/logout` cookie'leri temizler

## 10. Sik hata noktalar
Port cakismasi:
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :8001
```

Prisma problemi:
```bash
cd apps/api
npx prisma migrate reset
npx prisma generate
```

Parser CORS problemi:
- `CORS_ORIGINS` icine web originini ekle
- ornek: `CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`

## 11. Production oncesi
```bash
docker compose -f docker-compose.prod.yml config
npm run verify
```

Kontrol et:
- production secret'lari bos degil
- `JWT_REFRESH_SECRET` tanimli
- `CORS_ORIGINS` dogru
- `APP_URL` ve `FRONTEND_URL` production domain'i gosteriyor
- `GEMINI_API_KEY` sadece server-side ortamda var
