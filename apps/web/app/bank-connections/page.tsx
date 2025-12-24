'use client';

import { useState, useEffect } from 'react';
import BankConnectionCard from '../../components/bank/BankConnectionCard';
import { useAuth } from '../../components/auth-provider';

interface BankConnection {
    id: string;
    bankCode: string;
    bankName: string;
    accountNumber?: string;
    accountName?: string;
    accountType: string;
    lastSyncAt?: string;
    lastSyncStatus?: string;
    isActive: boolean;
}

interface AvailableBank {
    code: string;
    name: string;
}

export default function BankConnectionsPage() {
    const { fetchWithAuth } = useAuth();
    const [connections, setConnections] = useState<BankConnection[]>([]);
    const [availableBanks, setAvailableBanks] = useState<AvailableBank[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        bankCode: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [connectionsRes, banksRes] = await Promise.all([
                fetchWithAuth('/bank-connections'),
                fetchWithAuth('/bank-connections/banks'),
            ]);
            const connectionsData = await connectionsRes.json();
            const banksData = await banksRes.json();
            setConnections(connectionsData);
            setAvailableBanks(banksData);
        } catch (err) {
            setError('Banka bağlantıları yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleAddConnection = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const selectedBank = availableBanks.find(b => b.code === formData.bankCode);
            await fetchWithAuth('/bank-connections', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    bankName: selectedBank?.name || formData.bankCode,
                }),
            });
            setShowAddForm(false);
            setFormData({ bankCode: '', bankName: '', accountNumber: '', accountName: '' });
            loadData();
        } catch (err) {
            setError('Banka bağlantısı eklenirken hata oluştu');
        }
    };

    const handleSync = async (connectionId: string) => {
        try {
            await fetchWithAuth(`/bank-connections/${connectionId}/sync`, {
                method: 'POST',
            });
            loadData();
        } catch (err) {
            setError('Senkronizasyon başarısız');
        }
    };

    const handleDelete = async (connectionId: string) => {
        if (!confirm('Bu banka bağlantısını silmek istediğinize emin misiniz?')) return;

        try {
            await fetchWithAuth(`/bank-connections/${connectionId}`, {
                method: 'DELETE',
            });
            loadData();
        } catch (err) {
            setError('Bağlantı silinirken hata oluştu');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Banka Bağlantıları</h1>
                    <p className="text-gray-600 mt-1">
                        Banka hesaplarınızı bağlayarak işlemlerinizi otomatik olarak içe aktarın
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Banka Ekle
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                    <button onClick={() => setError(null)} className="float-right font-bold">×</button>
                </div>
            )}

            {/* Add Bank Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Yeni Banka Bağlantısı</h2>
                        <form onSubmit={handleAddConnection}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Banka Seçin
                                    </label>
                                    <select
                                        value={formData.bankCode}
                                        onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Banka seçin...</option>
                                        {availableBanks.map((bank) => (
                                            <option key={bank.code} value={bank.code}>
                                                {bank.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hesap Numarası (Opsiyonel)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="1234567890"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hesap Adı (Opsiyonel)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.accountName}
                                        onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Ana Hesap"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    Bağlan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Connections List */}
            {connections.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz banka bağlantısı yok</h3>
                    <p className="text-gray-500 mb-4">
                        Banka hesabınızı bağlayarak işlemlerinizi otomatik olarak içe aktarabilirsiniz
                    </p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        İlk Banka Bağlantısını Ekle
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {connections.map((connection) => (
                        <BankConnectionCard
                            key={connection.id}
                            connection={connection}
                            onSync={() => handleSync(connection.id)}
                            onDelete={() => handleDelete(connection.id)}
                        />
                    ))}
                </div>
            )}

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h4 className="font-medium text-blue-900">Demo Mod</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            Şu anda demo banka adaptörü kullanılmaktadır. Gerçek banka entegrasyonları için
                            Open Banking API'leri gelecekte eklenecektir. Demo mod, test amaçlı rastgele
                            işlemler oluşturur.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
