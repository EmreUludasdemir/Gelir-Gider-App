'use client';

import Link from 'next/link';
import { useState } from 'react';

const features = [
  {
    icon: '📄',
    title: 'PDF Ekstre Yükleme',
    description: 'Banka ekstrelerinizi yükleyin, işlemleriniz otomatik olarak parse edilsin. 20+ Türk bankası destekleniyor.',
  },
  {
    icon: '🤖',
    title: 'AI Destekli Kategorilendirme',
    description: 'Gemini AI ile akıllı işlem sınıflandırması. %95+ doğruluk oranı.',
  },
  {
    icon: '📊',
    title: 'Detaylı Analitik',
    description: 'Gelir-gider analizleri, trend grafikleri ve kategori bazlı raporlar.',
  },
  {
    icon: '💡',
    title: 'Finansal Tavsiyeler',
    description: 'Yapay zeka destekli kişisel finans tavsiyeleri ve tasarruf önerileri.',
  },
  {
    icon: '👨‍👩‍👧‍👦',
    title: 'Aile Hesapları',
    description: 'Ailenizle ortak bütçe takibi yapın, paylaşımlı hedefler belirleyin.',
  },
  {
    icon: '🔔',
    title: 'Akıllı Bildirimler',
    description: 'Bütçe uyarıları, fatura hatırlatıcıları ve olağandışı harcama tespiti.',
  },
];

const plans = [
  {
    name: 'free',
    displayName: 'Ücretsiz',
    price: 0,
    yearlyPrice: 0,
    description: 'Temel finans takibi için başlangıç',
    features: [
      'Aylık 100 işlem',
      '3 bütçe limiti',
      '2 tasarruf hedefi',
      'PDF yükleme',
      'Temel raporlar',
    ],
    limitations: [
      'Banka bağlantısı yok',
      'AI önerileri yok',
      'Dışa aktarım yok',
    ],
    cta: 'Ücretsiz Başla',
    popular: false,
  },
  {
    name: 'pro',
    displayName: 'Pro',
    price: 49.90,
    yearlyPrice: 479.90,
    description: 'Gelişmiş özellikler ve sınırsız kullanım',
    features: [
      'Sınırsız işlem',
      'Sınırsız bütçe',
      'Sınırsız tasarruf hedefi',
      '3 banka bağlantısı',
      '5 aile üyesi',
      'AI finansal tavsiyeler',
      'CSV/PDF dışa aktarım',
      'Gelişmiş raporlar',
      '14 gün ücretsiz deneme',
    ],
    limitations: [],
    cta: 'Pro\'yu Dene',
    popular: true,
  },
  {
    name: 'business',
    displayName: 'İşletme',
    price: 149.90,
    yearlyPrice: 1439.90,
    description: 'Şirketler ve büyük ekipler için',
    features: [
      'Sınırsız her şey',
      '10 banka bağlantısı',
      '20 ekip üyesi',
      'Öncelikli destek',
      'API erişimi',
      'Özel kategoriler',
      'Gelişmiş analitik',
      'Toplu işlem içe aktarma',
    ],
    limitations: [],
    cta: 'İletişime Geç',
    popular: false,
  },
];

const faqs = [
  {
    question: 'Uygulama gerçekten ücretsiz mi?',
    answer: 'Evet! Ücretsiz plan ile aylık 100 işlem, 3 bütçe ve 2 tasarruf hedefi kullanabilirsiniz. Kredi kartı gerekmez.',
  },
  {
    question: 'Verilerim güvende mi?',
    answer: 'Kesinlikle. Tüm verileriniz AES-256 şifreleme ile korunur. Banka bilgilerinizi asla saklamaz, sadece salt-okunur erişim kullanırız.',
  },
  {
    question: 'Hangi bankalar destekleniyor?',
    answer: 'Garanti, İşbank, Yapıkredi, Ziraat, Akbank, Enpara, Papara, QNB, ING, HSBC ve daha birçok Türk bankası destekleniyor.',
  },
  {
    question: 'Pro planı iptal edebilir miyim?',
    answer: 'Evet, istediğiniz zaman iptal edebilirsiniz. İptal ettiğinizde dönem sonuna kadar Pro özelliklerini kullanmaya devam edersiniz.',
  },
  {
    question: 'Mobil uygulama var mı?',
    answer: 'Evet! iOS ve Android için mobil uygulamamız mevcut. Offline çalışma ve widget desteği ile her an finanslarınızı takip edin.',
  },
];

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">💰 GelirGider</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">Özellikler</a>
              <a href="#pricing" className="text-gray-600 hover:text-primary-600 transition-colors">Fiyatlandırma</a>
              <a href="#faq" className="text-gray-600 hover:text-primary-600 transition-colors">SSS</a>
              <Link href="/auth/login" className="text-gray-600 hover:text-primary-600 transition-colors">
                Giriş Yap
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Ücretsiz Başla
              </Link>
            </div>
            <div className="md:hidden flex items-center">
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Başla
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Finanslarınızı <span className="text-yellow-300">Akıllıca</span> Yönetin
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-3xl mx-auto">
              Banka ekstrelerinizi yükleyin, AI ile otomatik kategorilendirin, bütçenizi takip edin.
              Türkiye'nin en modern finans yönetim uygulaması.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Ücretsiz Dene - Kredi Kartı Gerekmez
              </Link>
              <a
                href="#pricing"
                className="px-8 py-4 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-400 transition-colors border border-primary-400"
              >
                Planları İncele
              </a>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-primary-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>10,000+ Kullanıcı</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>20+ Banka Desteği</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>%256 Şifreleme</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Her Şey Bir Arada
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Gelir-gider takibinden AI destekli analizlere, tüm finansal ihtiyaçlarınız için tek platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-2xl hover:bg-primary-50 transition-colors group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
              <div className="text-primary-100">Aktif Kullanıcı</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">1M+</div>
              <div className="text-primary-100">İşlem Takibi</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">95%</div>
              <div className="text-primary-100">AI Doğruluğu</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">4.8</div>
              <div className="text-primary-100">Kullanıcı Puanı</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Basit ve Şeffaf Fiyatlandırma
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              İhtiyacınıza uygun planı seçin. Yıllık ödemede %20 tasarruf edin.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yıllık <span className="text-green-500 ml-1">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  plan.popular ? 'ring-2 ring-primary-600 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-sm font-medium rounded-full">
                    En Popüler
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      ₺{billingCycle === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500">/ay</span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && plan.yearlyPrice > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Yıllık ₺{plan.yearlyPrice} (₺{Math.round((plan.price * 12) - plan.yearlyPrice)} tasarruf)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-400">{limitation}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === 'free' ? '/auth/register' : `/auth/register?plan=${plan.name}&billing=${billingCycle}`}
                  className={`block w-full py-3 px-4 rounded-lg font-medium text-center transition-colors ${
                    plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sık Sorulan Sorular
            </h2>
            <p className="text-lg text-gray-600">
              Merak ettiklerinizi yanıtlayalım.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Finansal Özgürlüğe Adım Atın
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Harcamalarınızı kontrol altına alın, tasarruf hedeflerinize ulaşın.
            Bugün ücretsiz başlayın!
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Hemen Ücretsiz Başla
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-bold text-white">💰 GelirGider</span>
              <p className="mt-4 text-sm">
                Modern finans yönetimi için tasarlanmış, Türkiye'nin en kapsamlı kişisel finans uygulaması.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Ürün</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Özellikler</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Fiyatlandırma</a></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Kayıt Ol</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Destek</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="hover:text-white transition-colors">SSS</a></li>
                <li><a href="mailto:destek@gelir-gider.app" className="hover:text-white transition-colors">İletişim</a></li>
                <li><a href="/docs" className="hover:text-white transition-colors">Dokümantasyon</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Yasal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy" className="hover:text-white transition-colors">Gizlilik Politikası</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Kullanım Şartları</a></li>
                <li><a href="/kvkk" className="hover:text-white transition-colors">KVKK</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} GelirGider. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
