'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  planDistribution: { planName: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
}

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  plan: { name: string; displayName: string; status: string } | null;
  transactionCount: number;
}

interface Payment {
  id: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: string;
  planName: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { fetchWithAuth } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'payments'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const checkAdmin = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/admin/verify`);
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.isAdmin);
        if (!data.isAdmin) {
          router.push('/dashboard');
        }
      } else {
        setIsAdmin(false);
        router.push('/dashboard');
      }
    } catch {
      setIsAdmin(false);
      router.push('/dashboard');
    }
  }, [API_URL, fetchWithAuth, router]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/admin/stats`);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [API_URL, fetchWithAuth]);

  const loadUsers = useCallback(async (page: number = 1, search?: string) => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (search) params.set('search', search);

      const res = await fetchWithAuth(`${API_URL}/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.pages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [API_URL, fetchWithAuth]);

  const loadPayments = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/admin/payments?limit=20`);
      if (res.ok) {
        setPayments(await res.json());
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  }, [API_URL, fetchWithAuth]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      Promise.all([loadStats(), loadUsers(), loadPayments()]).finally(() => {
        setLoading(false);
      });
    }
  }, [isAdmin, loadStats, loadUsers, loadPayments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1, searchTerm);
  };

  if (isAdmin === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Kullanıcı ve abonelik yönetimi
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Dashboard'a Dön
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">Toplam Kullanıcı</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalUsers.toLocaleString()}
              </div>
              <div className="text-sm text-green-600 mt-1">
                +{stats.newUsersThisMonth} bu ay
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">Aktif Abonelik</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.activeSubscriptions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Ücretli planlar
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">Toplam Gelir</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                ₺{stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Tüm zamanlar
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">Plan Dağılımı</div>
              <div className="mt-2 space-y-1">
                {stats.planDistribution.map((p) => (
                  <div key={p.planName} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{p.planName}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Genel Bakış' },
                { id: 'users', label: 'Kullanıcılar' },
                { id: 'payments', label: 'Ödemeler' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Aylık Gelir (Son 6 Ay)
                </h3>
                <div className="h-64 flex items-end gap-4">
                  {stats.revenueByMonth.map((item) => {
                    const maxRevenue = Math.max(...stats.revenueByMonth.map((r) => r.revenue), 1);
                    const height = (item.revenue / maxRevenue) * 100;
                    return (
                      <div key={item.month} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-primary-500 rounded-t-lg transition-all"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        <div className="text-xs text-gray-500 mt-2">{item.month}</div>
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          ₺{item.revenue.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Email veya isim ara..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Ara
                  </button>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">İsim</th>
                        <th className="pb-3 font-medium">Plan</th>
                        <th className="pb-3 font-medium">İşlemler</th>
                        <th className="pb-3 font-medium">Kayıt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="py-3 text-gray-900 dark:text-white">{user.email}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-400">{user.name || '-'}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                user.plan?.name === 'pro'
                                  ? 'bg-blue-100 text-blue-700'
                                  : user.plan?.name === 'business'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {user.plan?.displayName || 'Free'}
                            </span>
                          </td>
                          <td className="py-3 text-gray-600 dark:text-gray-400">{user.transactionCount}</td>
                          <td className="py-3 text-gray-500 text-sm">
                            {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      onClick={() => loadUsers(currentPage - 1, searchTerm)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      Önceki
                    </button>
                    <span className="px-3 py-1 text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => loadUsers(currentPage + 1, searchTerm)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      Sonraki
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 font-medium">Kullanıcı</th>
                      <th className="pb-3 font-medium">Tutar</th>
                      <th className="pb-3 font-medium">Durum</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="py-3 text-gray-900 dark:text-white">{payment.userEmail}</td>
                        <td className="py-3 font-medium text-gray-900 dark:text-white">
                          ₺{payment.amount.toFixed(2)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              payment.status === 'succeeded'
                                ? 'bg-green-100 text-green-700'
                                : payment.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {payment.status === 'succeeded' ? 'Başarılı' : payment.status === 'failed' ? 'Başarısız' : payment.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">{payment.planName || '-'}</td>
                        <td className="py-3 text-gray-500 text-sm">
                          {new Date(payment.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {payments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Henüz ödeme kaydı yok
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
