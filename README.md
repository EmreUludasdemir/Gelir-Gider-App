# 💰 Gelir-Gider Takip Uygulaması

Modern, full-stack finans yönetim uygulaması. PDF banka ekstrelerini otomatik parse eder, akıllı kategorilendirme yapar ve **Gemini AI** ile finansal tavsiyelerde bulunur.

## 🌟 Yeni Özellikler (v2.0)

- 🤖 **AI Destekli İşlem Ekleme**: Doğal dil ile işlem ekleyin ("Bugün markette 250 TL harcadım")
- 💡 **Finansal İçgörüler**: AI tabanlı harcama analizi ve tavsiyeler
- 💬 **Finansal Asistan**: Harcamalarınız hakkında sohbet edin
- 🎯 **Tasarruf Hedefleri**: Finansal hedeflerinizi takip edin
- 🌙 **Dark Mode**: Göz yormayan karanlık tema
- 🌍 **Çoklu Dil**: Türkçe ve İngilizce desteği

## ✨ Yeni Özellikler (v2.0)

- 🚀 **Gelişmiş PDF Parser**: Daha iyi hata yönetimi, çoklu banka desteği, gelişmiş tablo çıkarma
- 🧠 **Akıllı Kategorilendirme**: 19+ kategori, pattern matching, güven skoru
- 📊 **Bütçe Yönetimi**: Kategori bazlı bütçe takibi, limitler ve uyarılar
- ✏️ **İşlem Düzenleme**: Tam özellikli düzenleme modal'ı ile işlemleri yönetin
- 🎨 **Gelişmiş UI**: Drag & drop PDF yükleme, progress bar, detaylı istatistikler
- 🔒 **Geliştirilmiş Veritabanı**: Budget, CategoryOverride tabloları, cascade delete
- 📝 **Detaylı Loglama**: Tüm işlemler için kapsamlı logging

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
- Gemini API Key (AI özellikleri için)

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

### Environment Değişkenleri

```bash
# .env dosyası oluşturun
cp .env.example .env

# Gemini API anahtarınızı ekleyin
# API anahtarı almak için: https://aistudio.google.com/app/apikey
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
│   │   │   ├── dashboard/    # Dashboard sayfaları
│   │   │   │   ├── goals/    # Tasarruf hedefleri
│   │   │   │   └── upload/   # PDF yükleme
│   │   ├── components/   # React components
│   │   │   ├── dashboard/    # Dashboard bileşenleri
│   │   │   │   ├── AIInsights.tsx
│   │   │   │   └── FinancialAssistant.tsx
│   │   │   └── forms/        # Form bileşenleri
│   │   │       └── SmartTransactionInput.tsx
│   │   └── lib/          # Utilities & API client
│   │       ├── gemini.ts     # Gemini AI servisi
│   │       ├── PreferencesContext.tsx
│   │       └── translations.ts
│   └── api/              # NestJS backend
├── services/
│   └── pdf-parser/       # Python FastAPI microservice
├── package.json          # Root workspace config
└── docker-compose.yml    # Docker orchestration
```

## ✨ Özellikler

### Temel Özellikler
- ✅ PDF banka ekstresi yükleme ve otomatik parsing
- ✅ Akıllı kategori sınıflandırması (15+ kategori)
- ✅ Manuel işlem ekleme/düzenleme/silme
- ✅ Dashboard özet kartları (gelir, gider, bakiye)
- ✅ Kategori bazlı analiz ve grafikler
- ✅ Tekrarlayan ödeme tespiti
- ✅ Haftalık trend görünümü
- ✅ Responsive tasarım

### AI Özellikleri (Gemini API)
- 🤖 Doğal dil ile işlem ekleme
- 💡 AI tabanlı finansal içgörüler
- 💬 Finansal asistan chatbot
- 📊 Akıllı harcama analizi

### Kullanıcı Deneyimi
- 🌙 Dark mode desteği
- 🌍 Türkçe/İngilizce dil seçeneği
- 💱 TRY/USD/EUR para birimi desteği
- 🎯 Tasarruf hedefleri takibi

## 🧪 Test

```bash
# Backend health check
curl http://localhost:3001/health

# Frontend health check
curl http://localhost:3000

# PDF Parser health check
curl http://localhost:8001/health
```

## 📝 API Endpoints

### Transactions
- `GET /transactions` - Tüm işlemleri listele
- `POST /transactions/manual` - Manuel işlem ekle
- `PATCH /transactions/:id` - İşlem güncelle
- `DELETE /transactions/:id` - İşlem sil
- `GET /transactions/summary` - Dashboard özeti

### Upload
- `POST /uploads/pdf` - PDF yükle ve parse et

## 📦 Teknoloji Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- SWR (data fetching)
- @google/generative-ai (Gemini AI)
- lucide-react (icons)

**Backend:**
- NestJS 10
- TypeScript
- Prisma ORM
- JWT Authentication

**PDF Parser:**
- FastAPI
- pdfminer.six
- pdfplumber

## 🔒 Güvenlik

- TypeScript strict mode
- Input validation (class-validator)
- File upload size limits (10MB)
- CORS yapılandırması
- JWT tabanlı kimlik doğrulama

## 📄 Lisans

MIT

## 👨‍💻 Geliştirici

Emre Uludaşdemir tarafından geliştirilmiştir.

