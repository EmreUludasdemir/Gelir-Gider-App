---
description: Yeni bir özellik ekle (tam geliştirme döngüsü)
arguments:
  - name: feature
    description: Eklenecek özellik açıklaması
    required: true
---

"$ARGUMENTS" özelliğini eklemek için şu adımları izle:

## 1. Planlama
- Özelliğin kapsamını belirle
- Etkilenecek dosyaları listele
- Gerekli değişiklikleri planla

## 2. Uygulama
- Backend (NestJS): `apps/api/src/modules/` altında modül oluştur veya güncelle
- Frontend (Next.js): `apps/web/` altında sayfa/bileşen ekle
- Veritabanı: Gerekirse Prisma schema'yı güncelle

## 3. Test
- Değişikliklerin build'i kırmadığından emin ol
- Lint kontrolü yap

## 4. Dokümantasyon
- CLAUDE.md'yi güncelle (eğer önemli bir özellikse)
- Gerekirse API endpoint'lerini belgele

## 5. Commit
- Conventional commit formatında commit oluştur
- `feat: add [özellik adı]` formatını kullan

Her adımda ilerlemeyi TodoWrite ile takip et.
