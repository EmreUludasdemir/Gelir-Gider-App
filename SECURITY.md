# Güvenlik Politikası

## 🔒 Desteklenen Sürümler

| Sürüm | Destekleniyor       |
| ----- | ------------------- |
| 2.5.x | :white_check_mark:  |
| 2.0.x | :white_check_mark:  |
| < 2.0 | :x:                 |

## 🐛 Güvenlik Açığı Bildirme

Bir güvenlik açığı keşfettiyseniz, lütfen **public issue açmayın**. Bunun yerine:

1. **Email:** Doğrudan geliştiriciyle iletişime geçin
2. **GitHub Security Advisories:** Repository'nin Security sekmesinden "Report a vulnerability" kullanın

### Bildiriminize dahil edin:
- Güvenlik açığının detaylı açıklaması
- Yeniden üretme adımları
- Potansiyel etki analizi
- (Varsa) önerilen düzeltme

### Yanıt Süresi
- **İlk yanıt:** 48 saat içinde
- **Değerlendirme:** 7 gün içinde
- **Düzeltme:** Kritiklik seviyesine göre 7-30 gün

## 🛡️ Güvenlik Özellikleri

Bu uygulama aşağıdaki güvenlik önlemlerini içerir:

- ✅ JWT tabanlı kimlik doğrulama
- ✅ İki faktörlü doğrulama (2FA/TOTP)
- ✅ Rate limiting
- ✅ CORS yapılandırması
- ✅ Helmet security headers
- ✅ Input sanitization
- ✅ SQL injection koruması
- ✅ XSS koruması
- ✅ CSRF koruması

## 📋 Güvenlik Kontrol Listesi

Katkıda bulunanlar için:

- [ ] Kullanıcı girdileri doğrulanıyor mu?
- [ ] Hassas veriler şifreleniyor mu?
- [ ] Yetkilendirme kontrolleri mevcut mu?
- [ ] Loglar hassas veri içermiyor mu?
- [ ] Bağımlılıklar güncel mi?

---

Güvenlik konusundaki katkılarınız için teşekkür ederiz! 🙏
