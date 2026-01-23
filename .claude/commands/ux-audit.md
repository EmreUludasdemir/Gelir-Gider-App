---
description: UX kalitesi denetimi - Erişilebilirlik, tutarlılık, kullanılabilirlik
arguments:
  - name: scope
    description: Denetlenecek alan (component, page, all)
    required: false
---

UX Denetimi yapıyorum. Kapsam: $ARGUMENTS (varsayılan: tüm frontend)

## 1. Erişilebilirlik (a11y) Kontrolü

### Kontrol Listesi:
- [ ] Tüm butonlar ve linkler için `aria-label` var mı?
- [ ] Form elementlerinde `label` veya `aria-labelledby` var mı?
- [ ] Renk kontrastı yeterli mi? (WCAG AA: 4.5:1)
- [ ] Klavye navigasyonu çalışıyor mu? (Tab, Enter, Escape)
- [ ] Focus state'leri görünür mü?
- [ ] Alt text'ler anlamlı mı?
- [ ] Loading state'lerde screen reader desteği var mı?

## 2. Tutarlılık Kontrolü

### Design Token Kullanımı:
- [ ] Spacing: Tailwind preset'leri (gap-4, p-6, etc.) tutarlı mı?
- [ ] Renkler: globals.css'deki semantic renkler kullanılıyor mu?
- [ ] Typography: Başlık hiyerarşisi mantıklı mı?
- [ ] Border radius: Tutarlı değerler (rounded-lg, rounded-xl)?
- [ ] Shadow: Aynı elevation seviyeleri?

### Component Patterns:
- [ ] Button stilleri tutarlı mı?
- [ ] Card yapıları benzer mi?
- [ ] Form layout'ları aynı pattern'i izliyor mu?
- [ ] Modal/Dialog yapıları tutarlı mı?

## 3. Responsive Design

- [ ] Mobile-first yaklaşım uygulanmış mı?
- [ ] Breakpoint'ler tutarlı mı? (sm, md, lg, xl)
- [ ] Touch hedefleri yeterli büyüklükte mi? (min 44x44px)
- [ ] Metin okunaklı mı küçük ekranlarda?

## 4. Loading & Error States

- [ ] Skeleton loader'lar var mı?
- [ ] Error boundary'ler doğru çalışıyor mu?
- [ ] Empty state'ler kullanıcı dostu mu?
- [ ] Loading indicator'lar görünür mü?

## 5. Dark Mode

- [ ] Tüm renkler dark mode destekliyor mu?
- [ ] Kontrastlar dark mode'da da yeterli mi?
- [ ] Geçişler smooth mu?

## Çıktı

Raporu şu formatta oluştur:
```
✅ Başarılı: [açıklama]
⚠️ Uyarı: [açıklama] - Önerilen düzeltme
❌ Hata: [açıklama] - Kritik, düzeltilmeli

Genel Puan: X/100
```
