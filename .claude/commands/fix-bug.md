---
description: Bir hatayı araştır ve düzelt
arguments:
  - name: issue
    description: Hata açıklaması veya hata mesajı
    required: true
---

"$ARGUMENTS" hatasını düzeltmek için:

## 1. Araştırma
- Hata mesajını analiz et
- İlgili dosyaları bul (Grep/Glob kullan)
- Hatanın kök nedenini belirle

## 2. Düzeltme
- Minimum değişiklikle düzelt
- Yan etkileri kontrol et
- Gereksiz değişiklik yapma

## 3. Doğrulama
- `npm run lint` çalıştır
- `npm run build` çalıştır
- Hata düzeldi mi kontrol et

## 4. Commit
- `fix: [düzeltme açıklaması]` formatında commit at

Düzeltme sırasında:
- Kodun orijinal stilini koru
- Gereksiz refactoring yapma
- Sadece hatayı düzelt
