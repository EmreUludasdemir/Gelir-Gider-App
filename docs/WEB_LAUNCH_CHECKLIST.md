# Web Launch Checklist

20 Nisan 2026 itibariyla repo, herkese acik web yayini icin erken; once kapali beta, sonra public launch hedeflenmeli.

Bu degisiklik seti dogrudan su alanlari guclendirir:
- `P0` auth/session fallback
- `P0` subscription detection aktiflik penceresi
- `P0` lokal web E2E stabilitesi

## P0 Release Blockers

1. Auth ve session guvenilirligi
- Sorun: Redis yokken refresh session dogrulamasi no-op kaliyor ve `/auth/refresh` kiriliyor.
- Cikis kriteri: login -> me -> refresh -> logout E2E yesil.

2. Subscription detection dogrulugu
- Sorun: aylik odemeler sadece `lastPayment` bazli bakildigi icin gecerli grace window icinde bile `inactive` sayilabiliyor.
- Cikis kriteri: aylik ve yillik suggestion'lar beklenen grace window icinde aktif kalmali, gecikme asildiginda inactive olmali.

3. Web E2E deterministic calisma
- Sorun: varsayilan Playwright config farkli port, coklu browser matrisi ve realtime baglanti gurultusu uretiyor.
- Cikis kriteri: lokal varsayilan akista tek-browser, tek-worker, realtime kapali bir smoke run yesil.

4. Landing page ve urun konumlandirmasi
- Sorun: ana sayfa kamuya acik urun vaadini net satmiyor.
- Cikis kriteri: "ekstre yukle -> temizle -> kategorize et -> abonelikleri bul" akisina odakli landing copy ve CTA.

5. Production env validation
- Sorun: kritik env'ler eksikken bazi ozellikler sessizce demo/sandbox davranisina dusebiliyor.
- Cikis kriteri: startup sirasinda zorunlu env dogrulamasi ve operator-visible warning listesi.

## P1 Beta Hardening

6. Gozlemlenebilirlik
- Hata izleme, request tracing, upload/parser hata oranlari ve auth refresh metrikleri eklenmeli.

7. Upload trust layer
- PDF import sonucunda "dusuk guven", "manuel kontrol gerekiyor", "hangi satirlar eslesti" gibi kullaniciya acik kalite sinyalleri belirgin olmali.

8. Bank connection dogrulugu
- Sandbox, mock ve gercek baglanti akislari UI'da ayirt edilebilir olmali; "entegrasyon var" iddiasi ile demo davranisi karismamali.

9. Failure recovery
- API, parser ve banka baglanti hatalarinda tekrar dene, taslak koruma ve kullanici dostu fallback ekranlari olmali.

10. Beta feedback loop
- Kapali beta kullanicilarindan import basarisi, ilk-deger suresi, 7 gun retention ve en cok iptal edilen akislar toplanmali.

## Launch Sirasi

1. `P0` maddeleri bitir.
2. 20-50 kisilik kapali beta ac.
3. Gercek beta verisiyle `P1` maddelerini sirala.
4. Public launch mesajini ancak banka baglantisi ve upload guven sinyalleri oturduktan sonra ac.
