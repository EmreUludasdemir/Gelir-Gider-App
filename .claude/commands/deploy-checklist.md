---
description: Deployment öncesi kontrol listesi
---

# 🚀 Deployment Öncesi Kontrol Listesi

Aşağıdaki kontrolleri sırasıyla yap:

## 1. Kod Kalitesi
- [ ] `npm run lint` - Lint hataları yok
- [ ] `npm run build` - Build başarılı
- [ ] `npm test` - Testler geçiyor

## 2. Güvenlik
- [ ] .env dosyaları .gitignore'da
- [ ] Hassas bilgi commit edilmemiş
- [ ] API endpoint'leri authentication altında

## 3. Veritabanı
- [ ] Migration'lar güncel
- [ ] Seed data hazır (gerekiyorsa)
- [ ] Backup alındı (prod için)

## 4. Yapılandırma
- [ ] Environment variables dokümante
- [ ] CORS ayarları doğru
- [ ] Rate limiting aktif

## 5. Dokümantasyon
- [ ] CLAUDE.md güncel
- [ ] RUNBOOK.md mevcut
- [ ] API değişiklikleri belgelenmiş

Her adımı kontrol et ve sonuçları raporla.
