# Desktop App Assets

Bu klasör Electron desktop uygulaması için gerekli ikonları içerir.

## Gerekli Dosyalar

- `icon.png` - Ana uygulama ikonu (512x512 önerilen)
- `icon.ico` - Windows için ikon
- `icon.icns` - macOS için ikon
- `tray-icon.png` - System tray ikonu (16x16 veya 22x22)

## İkon Oluşturma

1. Ana ikon dosyasını (512x512 PNG) oluşturun
2. Diğer formatları oluşturmak için:
   - Windows: `png-to-ico` veya benzeri araç
   - macOS: `iconutil` komutu
   - Tray: Ana ikonun küçültülmüş versiyonu

## Notlar

- Tray ikonu şeffaf arka planlı olmalı
- Windows'ta 16x16, macOS'ta 22x22 boyut önerilir
