# 🚀 Hızlı Başlangıç Kılavuzu

Bu kılavuz, projeyi 5 dakikada çalıştırmanıza yardımcı olacak.

## ✅ Gereksinimler

- **Node.js** 20+ ([İndir](https://nodejs.org/))
- **Python** 3.11+ ([İndir](https://www.python.org/))
- **npm** 10+ (Node.js ile gelir)

## 📦 Kurulum (İlk Kez)

### 1. Projeyi İndirin

```bash
git clone <repository-url>
cd nice-noether
```

### 2. Environment Dosyasını Oluşturun

```bash
# .env.example dosyasını kopyalayın
cp .env.example .env

# Windows için:
copy .env.example .env
```

### 3. Tüm Bağımlılıkları Yükleyin

```bash
# Root dependencies
npm install

# Frontend dependencies
cd apps/web
npm install
cd ../..

# Backend dependencies
cd apps/api
npm install
cd ../..

# Python dependencies (PDF Parser)
cd services/pdf-parser
python -m venv .venv

# Virtual environment'ı aktifleştirin
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cd ../..
```

### 4. Veritabanını Hazırlayın

```bash
cd apps/api

# Prisma generate
npx prisma generate

# Database migration
npx prisma migrate dev

cd ../..
```

## 🎬 Çalıştırma

### Tüm Servisleri Başlatın

3 ayrı terminal penceresi açın:

#### Terminal 1: PDF Parser Service
```bash
npm run dev:parser

# Çıktı:
# INFO:     Uvicorn running on http://localhost:8001
# INFO:     Application startup complete.
```

#### Terminal 2: Backend API
```bash
cd apps/api
npm run start:dev

# Çıktı:
# [Nest] 12345  - API Server listening on port 3001
```

#### Terminal 3: Frontend
```bash
cd apps/web
npm run dev

# Çıktı:
# ▲ Next.js 14.x.x
# - Local: http://localhost:3000
```

### Alternatif: Tek Komutla Backend + Frontend

```bash
# Root dizininde:
npm run dev

# NOT: PDF Parser'ı ayrı bir terminalde çalıştırmalısınız
```

## 🌐 Servislere Erişim

| Servis | URL | Açıklama |
|--------|-----|----------|
| **Frontend** | http://localhost:3000 | Web arayüzü |
| **Backend API** | http://localhost:3001 | REST API |
| **API Docs** | http://localhost:3001/docs | Swagger UI |
| **PDF Parser** | http://localhost:8001 | PDF parsing servisi |
| **Parser Docs** | http://localhost:8001/docs | FastAPI docs |

## 🧪 Test Et

### 1. Health Check
```bash
# Backend
curl http://localhost:3001/health

# PDF Parser
curl http://localhost:8001/health
```

### 2. Kategorileri Listele
```bash
curl http://localhost:8001/categories
```

### 3. Frontend'e Gidin
Tarayıcıda açın: http://localhost:3000

- Login sayfasında yeni kullanıcı kaydedin
- Dashboard'u keşfedin
- PDF yükleyin ve işlemleri görün

## 📄 PDF Yükleme Test

1. Banka ekstrenizi PDF olarak kaydedin
2. http://localhost:3000/dashboard/upload adresine gidin
3. PDF'i sürükleyip bırakın veya seçin
4. "Yükle ve Parse Et" butonuna tıklayın
5. İşlemler otomatik olarak kaydedilecek

### Desteklenen Bankalar:
- ✅ Garanti BBVA
- ✅ Ziraat Bankası
- ✅ İş Bankası
- ✅ Akbank
- ✅ Yapı Kredi
- ✅ QNB Finansbank
- ✅ Enpara
- ✅ Papara
- ✅ Denizbank
- ✅ Halkbank
- ✅ Vakıfbank
- ✅ Kuveyt Türk
- ✅ TEB

## 🔧 Sorun Giderme

### Python Virtual Environment Hatası

**Problem:** `python -m venv .venv` çalışmıyor

**Çözüm:**
```bash
# Python yolunu kontrol edin
python --version
# veya
python3 --version

# Alternatif komut
py -m venv .venv  # Windows
```

### Port Zaten Kullanımda

**Problem:** Port 3000, 3001 veya 8001 zaten kullanımda

**Çözüm 1:** Portları değiştirin (`.env` dosyasında)
```bash
API_PORT=3002
# Frontend: next.config.js'de port değiştirin
# PDF Parser: main.py'de port değiştirin
```

**Çözüm 2:** Kullanılan portları kapatın
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Database Migration Hatası

**Problem:** Prisma migrate hatası

**Çözüm:**
```bash
cd apps/api

# Database'i sıfırlayın (DEV ONLY!)
npx prisma migrate reset

# Veya yeni migration oluşturun
npx prisma migrate dev --name fix_schema
```

### PDF Parser Çalışmıyor

**Problem:** PDF parsing hatası

**Kontroller:**
1. Python virtual environment aktif mi?
   ```bash
   # Windows
   .venv\Scripts\activate

   # macOS/Linux
   source .venv/bin/activate
   ```

2. Dependencies yüklü mü?
   ```bash
   pip list
   # fastapi, pdfplumber, pdfminer.six görünmeli
   ```

3. Service çalışıyor mu?
   ```bash
   curl http://localhost:8001/health
   ```

### Frontend Build Hatası

**Problem:** `npm run build` hatası

**Çözüm:**
```bash
cd apps/web

# node_modules'ü temizleyin
rm -rf node_modules
rm package-lock.json

# Yeniden yükleyin
npm install

# Build edin
npm run build
```

## 📖 Daha Fazla Bilgi

- **Detaylı Kurulum:** [README.md](./README.md)
- **Yeni Özellikler:** [IMPROVEMENTS.md](./IMPROVEMENTS.md)
- **API Dokümantasyonu:** http://localhost:3001/docs

## 💡 İpuçları

1. **Development Mode:** Hot reload aktif, değişiklikler otomatik yansır
2. **Database Browser:** `npx prisma studio` ile veritabanını görsel olarak inceleyin
3. **Logs:** Her servisin terminal çıktısını takip edin
4. **Performance:** İlk PDF parse işlemi biraz uzun sürebilir (model yükleme)

## 🎉 Başarılı Kurulum!

Artık tüm servisler çalışıyor olmalı. Hoş geldiniz! 🚀

### Sonraki Adımlar:
- [ ] İlk kullanıcınızı oluşturun
- [ ] Bir PDF ekstre yükleyin
- [ ] İşlemleri kategorize edin
- [ ] Bütçe oluşturun
- [ ] Dashboard'da finansal durumunuzu görün

**Sorunuz mu var?** [GitHub Issues](https://github.com/your-repo/issues) açın.

## Production Readiness Commands

Run from repository root:

```bash
npm ci --workspaces --include-workspace-root
npm run lint
npm run test -w @app/api
npm run test -w @app/web
npm run build
npm run verify
```

## Test Split

- API unit tests: `npm run test:unit -w @app/api`
- API e2e tests: `npm run test:e2e -w @app/api`
- Web unit tests: `npm test -w @app/web`
- Web Playwright e2e: `npm run test:e2e -w @app/web`

## Required Production Environment

- `PORT` (or `API_PORT` fallback)
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `ENCRYPTION_KEY`
- `FRONTEND_URL`
- `CORS_ORIGINS`
