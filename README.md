# 💰 Gelir-Gider Takip Uygulaması

Modern, full-stack finans yönetim uygulaması. PDF banka ekstrelerini otomatik parse eder ve akıllı kategorilendirme yapar.

## 🏗️ Mimari

| Servis | Teknoloji | Port | Açıklama |
|--------|-----------|------|----------|
| **Frontend** | Next.js 14 + TypeScript + Tailwind | 3000 | Modern web arayüzü |
| **Backend** | NestJS 10 + TypeScript | 3001 | REST API servisi |
| **PDF Parser** | Python FastAPI + pdfminer.six | 8001 | PDF parsing mikroservisi |

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 20+
- Python 3.11+
- npm 10+

### Kurulum

```bash
# Root dependencies
npm install

# Frontend dependencies
cd apps/web && npm install

# Backend dependencies
cd apps/api && npm install

# Python dependencies
cd services/pdf-parser
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Development

```bash
# Terminal 1: PDF Parser
npm run dev:parser

# Terminal 2: Backend + Frontend
npm run dev
```

Servisler:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PDF Parser: http://localhost:8001

### Docker ile Çalıştırma

```bash
docker-compose up --build
```

## 📁 Proje Yapısı

```
.
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities & API client
│   └── api/              # NestJS backend
│       └── src/
│           ├── modules/  # Feature modules
│           └── shared/   # Shared utilities
├── services/
│   └── pdf-parser/       # Python FastAPI microservice
│       └── app/
│           ├── main.py
│           ├── parser.py
│           └── classifier.py
├── package.json          # Root workspace config
└── docker-compose.yml    # Docker orchestration
```

## ✨ Özellikler

- ✅ PDF banka ekstresi yükleme ve otomatik parsing
- ✅ Akıllı kategori sınıflandırması (15+ kategori)
- ✅ Manuel işlem ekleme/düzenleme/silme
- ✅ Dashboard özet kartları (gelir, gider, bakiye)
- ✅ Kategori bazlı analiz ve grafikler
- ✅ Tekrarlayan ödeme tespiti
- ✅ Düşük güvenli işlem önerileri
- ✅ Haftalık trend görünümü
- ✅ Responsive tasarım (mobile, tablet, desktop)
- ✅ Real-time data updates (SWR)

## 🧪 Test

```bash
# Backend health check
curl http://localhost:3001/health

# Frontend health check
curl http://localhost:3000

# PDF Parser health check
curl http://localhost:8001/health

# Get transactions
curl http://localhost:3001/transactions

# Get dashboard summary
curl http://localhost:3001/transactions/summary
```

## 📝 API Endpoints

### Transactions
- `GET /transactions` - Tüm işlemleri listele (filtrelenebilir)
- `POST /transactions/manual` - Manuel işlem ekle
- `PATCH /transactions/:id` - İşlem güncelle
- `DELETE /transactions/:id` - İşlem sil
- `GET /transactions/summary` - Dashboard özeti
- `GET /transactions/suggestions` - Düşük güvenli işlemler
- `GET /transactions/recurring` - Tekrarlayan ödemeler

### Upload
- `POST /uploads/pdf` - PDF yükle ve parse et

### PDF Parser
- `POST /parse` - PDF parse et
- `POST /classify` - Tek açıklama kategorize et

## 🛠️ Geliştirme

```bash
# Lint
npm run lint

# Build
npm run build

# Clean
npm run clean
```

## 📦 Teknoloji Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- SWR (data fetching)
- date-fns
- lucide-react (icons)

**Backend:**
- NestJS 10
- TypeScript
- Express
- Multer (file upload)
- class-validator

**PDF Parser:**
- FastAPI
- pdfminer.six
- python-dateutil

## 🔒 Güvenlik

- TypeScript strict mode
- Input validation (class-validator)
- File upload size limits (10MB)
- CORS yapılandırması

## 📄 Lisans

MIT

## 👨‍💻 Geliştirici

Claude Code tarafından geliştirilmiştir.
