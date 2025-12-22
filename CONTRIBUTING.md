# 🤝 Katkıda Bulunma Rehberi

Gelir-Gider Takip Uygulaması'na katkıda bulunmak istediğiniz için teşekkür ederiz! Bu rehber, katkı sürecini kolaylaştırmak için hazırlanmıştır.

## 📋 İçindekiler

- [Davranış Kuralları](#-davranış-kuralları)
- [Nasıl Katkıda Bulunabilirim?](#-nasıl-katkıda-bulunabilirim)
- [Geliştirme Ortamı](#-geliştirme-ortamı)
- [Kod Standartları](#-kod-standartları)
- [Pull Request Süreci](#-pull-request-süreci)
- [Commit Mesajları](#-commit-mesajları)

---

## 📜 Davranış Kuralları

Bu proje, açık ve kapsayıcı bir ortam sağlamayı amaçlamaktadır. Katılımcılardan beklentilerimiz:

- Saygılı ve yapıcı iletişim
- Farklı görüşlere açık olmak
- Yapıcı eleştiri sunmak ve kabul etmek
- Topluluk için en iyisine odaklanmak

---

## 🚀 Nasıl Katkıda Bulunabilirim?

### 🐛 Bug Bildirimi
1. [Issues](https://github.com/EmreUludasdemir/Gelir-Gider-Uygulamas--Claude/issues) sayfasını kontrol edin
2. Benzer bir issue yoksa, Bug Report template'i kullanarak yeni bir issue açın
3. Mümkün olduğunca detaylı bilgi verin

### ✨ Yeni Özellik Önerisi
1. Feature Request template'i kullanarak issue açın
2. Özelliğin neden gerekli olduğunu açıklayın
3. Mümkünse mockup veya örnek ekleyin

### 💻 Kod Katkısı
1. Repo'yu fork edin
2. Feature branch oluşturun
3. Değişikliklerinizi yapın
4. Testlerinizi yazın
5. Pull Request açın

---

## 🛠️ Geliştirme Ortamı

### Gereksinimler
- Node.js 20+
- Python 3.11+
- Docker (önerilen)
- Git

### Kurulum

```bash
# Fork'unuzu klonlayın
git clone https://github.com/YOUR_USERNAME/Gelir-Gider-Uygulamas--Claude.git
cd Gelir-Gider-Uygulamas--Claude

# Upstream ekleyin
git remote add upstream https://github.com/EmreUludasdemir/Gelir-Gider-Uygulamas--Claude.git

# Dependencies yükleyin
npm install
cd apps/api && npm install
cd ../web && npm install
cd ../..

# Development başlatın
npm run dev
```

### Test Çalıştırma

```bash
# Backend testleri
cd apps/api && npm test

# Coverage raporu
npm run test:cov

# E2E testler
npm run test:e2e
```

---

## 📏 Kod Standartları

### TypeScript / JavaScript
- **ESLint** ve **Prettier** kullanıyoruz
- Strict TypeScript mode aktif
- `any` tipi kullanmaktan kaçının

```bash
# Lint kontrolü
npm run lint

# Otomatik düzeltme
npm run lint:fix
```

### Dosya Yapısı
```
src/
├── modules/        # Feature modülleri
│   └── feature/
│       ├── feature.module.ts
│       ├── feature.service.ts
│       ├── feature.controller.ts
│       ├── feature.service.spec.ts    # Testler
│       └── dto/
│           └── feature.dto.ts
└── shared/         # Paylaşılan utilities
```

### Naming Conventions
| Tür | Format | Örnek |
|-----|--------|-------|
| Dosyalar | kebab-case | `user-profile.service.ts` |
| Sınıflar | PascalCase | `UserProfileService` |
| Fonksiyonlar | camelCase | `getUserProfile()` |
| Sabitler | UPPER_SNAKE | `MAX_FILE_SIZE` |
| Interface | IPascalCase | `IUserProfile` |

---

## 📝 Commit Mesajları

[Conventional Commits](https://www.conventionalcommits.org/) formatını kullanıyoruz:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Tipler
| Tip | Açıklama |
|-----|----------|
| `feat` | Yeni özellik |
| `fix` | Bug düzeltme |
| `docs` | Dokümantasyon |
| `style` | Formatlama (kod değişikliği yok) |
| `refactor` | Kod yeniden yapılandırma |
| `test` | Test ekleme/düzeltme |
| `chore` | Build, CI/CD değişiklikleri |

### Örnekler
```bash
feat(auth): add 2FA support
fix(transactions): resolve date parsing issue
docs(readme): update installation guide
test(budgets): add unit tests for budget service
```

---

## 🔄 Pull Request Süreci

### 1. Branch Oluşturma
```bash
git checkout -b feature/amazing-feature
# veya
git checkout -b fix/bug-description
```

### 2. Değişiklikleri Yapma
- Küçük, odaklı değişiklikler yapın
- Her commit mantıksal bir birim olsun
- Testlerinizi yazın

### 3. Push ve PR
```bash
git push origin feature/amazing-feature
```

### 4. PR Açma
- Açıklayıcı bir başlık yazın
- Değişiklikleri detaylı açıklayın
- İlgili issue'ları bağlayın (`Closes #123`)
- Ekran görüntüleri ekleyin (UI değişiklikleri için)

### 5. Code Review
- Reviewer feedback'lerini dikkate alın
- Gerekli değişiklikleri yapın
- CI/CD kontrollerinin geçmesini bekleyin

---

## 🎯 İyi İlk Katkılar

`good first issue` etiketli issue'lar, ilk katkınız için ideal başlangıç noktalarıdır.

---

## 📫 İletişim

Sorularınız için:
- GitHub Issues kullanın
- Tartışmalar için Discussions bölümünü kullanın

---

Katkılarınız için teşekkür ederiz! 🙏
