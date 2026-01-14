'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/ui/Toast';

interface PlanInfo {
  planId: string;
  planName: string;
  displayName: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  limits: {
    maxTransactions: number;
    maxBudgets: number;
    maxSavingsGoals: number;
    maxBankConnections: number;
    maxHouseholdMembers: number;
  };
  features: {
    pdfUpload: boolean;
    bankConnection: boolean;
    aiInsights: boolean;
    exportCsv: boolean;
    exportPdf: boolean;
    household: boolean;
    prioritySupport: boolean;
    customCategories: boolean;
    advancedReports: boolean;
    apiAccess: boolean;
  };
  usage: {
    transactions: number;
    budgets: number;
    savingsGoals: number;
    bankConnections: number;
  };
}

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  limits: {
    maxTransactions: number;
    maxBudgets: number;
    maxSavingsGoals: number;
    maxBankConnections: number;
    maxHouseholdMembers: number;
  };
  features: string[];
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  planName: string;
  createdAt: string;
  paidAt: string | null;
  invoiceUrl: string | null;
}

export default function SettingsPage() {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const loadData = useCallback(async () => {
    try {
      const [planRes, plansRes, paymentsRes] = await Promise.all([
        fetchWithAuth(`${API_URL}/billing/my-plan`),
        fetch(`${API_URL}/billing/plans`),
        fetchWithAuth(`${API_URL}/billing/payments`),
      ]);

      if (planRes.ok) {
        setPlanInfo(await planRes.json());
      }

      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans || []);
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL, fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const billing = searchParams.get('billing');
    if (billing === 'success') {
      showToast('Aboneliğiniz başarıyla aktifleştirildi!', 'success');
      loadData();
    } else if (billing === 'cancelled') {
      showToast('Ödeme iptal edildi.', 'info');
    }
  }, [searchParams, showToast, loadData]);

  const handleUpgrade = async (planName: string) => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/billing/checkout`, {
        method: 'POST',
        body: JSON.stringify({ planName, billingCycle }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const error = await res.json();
        showToast(error.message || 'Ödeme işlemi başlatılamadı', 'error');
      }
    } catch (error) {
      showToast('Bir hata oluştu', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/billing/portal`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        showToast('Fatura portalı açılamadı', 'error');
      }
    } catch (error) {
      showToast('Bir hata oluştu', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Aboneliğinizi iptal etmek istediğinizden emin misiniz? Dönem sonuna kadar kullanmaya devam edebilirsiniz.')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/billing/cancel`, {
        method: 'POST',
      });

      if (res.ok) {
        showToast('Aboneliğiniz dönem sonunda iptal edilecek', 'success');
        loadData();
      } else {
        showToast('İptal işlemi başarısız', 'error');
      }
    } catch (error) {
      showToast('Bir hata oluştu', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/billing/resume`, {
        method: 'POST',
      });

      if (res.ok) {
        showToast('Aboneliğiniz devam ettirildi', 'success');
        loadData();
      } else {
        showToast('İşlem başarısız', 'error');
      }
    } catch (error) {
      showToast('Bir hata oluştu', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Sınırsız' : limit.toString();
  };

  const getUsagePercentage = (used: number, max: number) => {
    if (max === -1) return 0;
    return Math.min((used / max) * 100, 100);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ayarlar & Abonelik</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Planınızı ve fatura bilgilerinizi yönetin
        </p>
      </div>

      {/* Current Plan */}
      {planInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {planInfo.displayName} Plan
                </h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  planInfo.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : planInfo.status === 'trialing'
                    ? 'bg-blue-100 text-blue-700'
                    : planInfo.status === 'past_due'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {planInfo.status === 'active' ? 'Aktif'
                    : planInfo.status === 'trialing' ? 'Deneme'
                    : planInfo.status === 'past_due' ? 'Ödeme Bekliyor'
                    : planInfo.status}
                </span>
              </div>
              {planInfo.cancelAt && (
                <p className="text-sm text-red-600 mt-1">
                  {new Date(planInfo.cancelAt).toLocaleDateString('tr-TR')} tarihinde iptal edilecek
                </p>
              )}
              {planInfo.currentPeriodEnd && planInfo.planName !== 'free' && (
                <p className="text-sm text-gray-500 mt-1">
                  Sonraki fatura: {new Date(planInfo.currentPeriodEnd).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {planInfo.planName !== 'free' && (
                <>
                  <button
                    onClick={handleManageBilling}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Fatura Portalı
                  </button>
                  {planInfo.cancelAt ? (
                    <button
                      onClick={handleResumeSubscription}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      İptali Geri Al
                    </button>
                  ) : (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      İptal Et
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">İşlemler</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {planInfo.usage.transactions} / {formatLimit(planInfo.limits.maxTransactions)}
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all"
                  style={{ width: `${getUsagePercentage(planInfo.usage.transactions, planInfo.limits.maxTransactions)}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Bütçeler</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {planInfo.usage.budgets} / {formatLimit(planInfo.limits.maxBudgets)}
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all"
                  style={{ width: `${getUsagePercentage(planInfo.usage.budgets, planInfo.limits.maxBudgets)}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tasarruf Hedefleri</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {planInfo.usage.savingsGoals} / {formatLimit(planInfo.limits.maxSavingsGoals)}
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all"
                  style={{ width: `${getUsagePercentage(planInfo.usage.savingsGoals, planInfo.limits.maxSavingsGoals)}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Banka Bağlantıları</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {planInfo.usage.bankConnections} / {formatLimit(planInfo.limits.maxBankConnections)}
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all"
                  style={{ width: `${getUsagePercentage(planInfo.usage.bankConnections, planInfo.limits.maxBankConnections)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Aktif Özellikler</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(planInfo.features).map(([key, enabled]) => (
                <span
                  key={key}
                  className={`px-3 py-1 text-xs rounded-full ${
                    enabled
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  }`}
                >
                  {key === 'pdfUpload' && 'PDF Yükleme'}
                  {key === 'bankConnection' && 'Banka Bağlantısı'}
                  {key === 'aiInsights' && 'AI Önerileri'}
                  {key === 'exportCsv' && 'CSV Dışa Aktarım'}
                  {key === 'exportPdf' && 'PDF Dışa Aktarım'}
                  {key === 'household' && 'Aile Hesabı'}
                  {key === 'prioritySupport' && 'Öncelikli Destek'}
                  {key === 'customCategories' && 'Özel Kategoriler'}
                  {key === 'advancedReports' && 'Gelişmiş Raporlar'}
                  {key === 'apiAccess' && 'API Erişimi'}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plans */}
      {planInfo && planInfo.planName === 'free' && plans.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Plan Yükselt</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Daha fazla özellik ve sınırsız kullanım için yükseltin
              </p>
            </div>
            <div className="inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Yıllık (-20%)
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {plans.filter(p => p.name !== 'free').map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-xl p-6 ${
                  plan.name === 'pro'
                    ? 'border-primary-500 ring-1 ring-primary-500'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                {plan.name === 'pro' && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full mb-3">
                    Önerilen
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.displayName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ₺{billingCycle === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly}
                  </span>
                  <span className="text-gray-500">/ay</span>
                </div>
                {billingCycle === 'yearly' && plan.priceYearly > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Yıllık ₺{plan.priceYearly} (₺{Math.round((plan.priceMonthly * 12) - plan.priceYearly)} tasarruf)
                  </p>
                )}
                <button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={actionLoading}
                  className={`w-full mt-4 py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    plan.name === 'pro'
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.name === 'pro' ? '14 Gün Ücretsiz Dene' : 'Yükselt'}
                </button>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature === 'pdf_upload' && 'PDF Yükleme'}
                      {feature === 'bank_connection' && 'Banka Bağlantısı'}
                      {feature === 'ai_insights' && 'AI Finansal Tavsiyeler'}
                      {feature === 'export_csv' && 'CSV Dışa Aktarım'}
                      {feature === 'export_pdf' && 'PDF Dışa Aktarım'}
                      {feature === 'household' && 'Aile Hesabı'}
                      {feature === 'priority_support' && 'Öncelikli Destek'}
                      {feature === 'custom_categories' && 'Özel Kategoriler'}
                      {feature === 'advanced_reports' && 'Gelişmiş Raporlar'}
                      {feature === 'api_access' && 'API Erişimi'}
                      {!['pdf_upload', 'bank_connection', 'ai_insights', 'export_csv', 'export_pdf', 'household', 'priority_support', 'custom_categories', 'advanced_reports', 'api_access'].includes(feature) && feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ödeme Geçmişi</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">Tarih</th>
                  <th className="pb-3 font-medium">Tutar</th>
                  <th className="pb-3 font-medium">Durum</th>
                  <th className="pb-3 font-medium">Fatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-3 text-gray-900 dark:text-white">
                      {new Date(payment.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      ₺{payment.amount.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'succeeded'
                          ? 'bg-green-100 text-green-700'
                          : payment.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payment.status === 'succeeded' ? 'Başarılı'
                          : payment.status === 'failed' ? 'Başarısız'
                          : 'Bekliyor'}
                      </span>
                    </td>
                    <td className="py-3">
                      {payment.invoiceUrl && (
                        <a
                          href={payment.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline text-sm"
                        >
                          Görüntüle
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
