import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            💰 Gelir-Gider Takip
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Modern, akıllı finans yönetim uygulaması
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-primary-50 p-6 rounded-xl">
            <div className="text-3xl mb-3">📄</div>
            <h3 className="font-semibold text-gray-900 mb-2">PDF Yükleme</h3>
            <p className="text-sm text-gray-600">
              Banka ekstrelerinizi yükleyin, otomatik parse edin
            </p>
          </div>
          <div className="bg-primary-50 p-6 rounded-xl">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-900 mb-2">Akıllı Sınıflandırma</h3>
            <p className="text-sm text-gray-600">
              15+ kategori ile otomatik işlem sınıflandırması
            </p>
          </div>
          <div className="bg-primary-50 p-6 rounded-xl">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Dashboard Analizi</h3>
            <p className="text-sm text-gray-600">
              Gelir-gider analizleri ve detaylı raporlar
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center"
          >
            Dashboard'a Git
          </Link>
          <Link
            href="/dashboard/upload"
            className="px-8 py-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
          >
            PDF Yükle
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">15+</div>
              <div className="text-sm text-gray-600">Kategori</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">90%</div>
              <div className="text-sm text-gray-600">Doğruluk</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">3</div>
              <div className="text-sm text-gray-600">Mikroservis</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">TypeScript</div>
              <div className="text-sm text-gray-600">Full Stack</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
