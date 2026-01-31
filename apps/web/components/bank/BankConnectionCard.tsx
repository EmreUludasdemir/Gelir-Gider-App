'use client';

import { useState } from 'react';

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

interface BankConnectionCardProps {
    connection: BankConnection;
    onSync: () => void;
    onDelete: () => void;
}

const bankLogos: Record<string, string> = {
    mock: 'BANK',
    yapikredi: 'YK',
    garanti: 'GAR',
    isbank: 'IS',
    ziraat: 'ZB',
    akbank: 'AK',
};

export default function BankConnectionCard({ connection, onSync, onDelete }: BankConnectionCardProps) {
    const [syncing, setSyncing] = useState(false);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await onSync();
        } finally {
            setSyncing(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Hiç senkronize edilmedi';
        const date = new Date(dateStr);
        return date.toLocaleString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = () => {
        switch (connection.lastSyncStatus) {
            case 'success':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                        Başarılı
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/15 text-destructive">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                        Başarısız
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                        Bekliyor
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Senkronize edilmedi
                    </span>
                );
        }
    };

    return (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    {/* Bank Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-sm font-semibold text-white">
                        {bankLogos[connection.bankCode] || 'BANK'}
                    </div>

                    {/* Bank Info */}
                    <div>
                        <h3 className="font-semibold text-foreground text-lg">{connection.bankName}</h3>
                        <p className="text-sm text-muted-foreground">
                            {connection.accountName || 'Hesap'}
                            {connection.accountNumber && ` • ${connection.accountNumber}`}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                            {getStatusBadge()}
                            <span className="text-xs text-muted-foreground">
                                Son sync: {formatDate(connection.lastSyncAt)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {syncing ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Senkronize ediliyor...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Senkronize Et
                            </>
                        )}
                    </button>

                    <button
                        onClick={onDelete}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                        title="Bağlantıyı Sil"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}



