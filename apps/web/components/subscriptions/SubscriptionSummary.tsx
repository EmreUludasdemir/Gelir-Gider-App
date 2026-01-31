'use client';

import React, { useState, useEffect } from 'react';

interface Subscription {
    id: string;
    name: string;
    amount: number;
    frequency: string;
    category: string;
    nextPayment: string;
}

interface SubscriptionSummaryProps {
    subscriptions?: Subscription[];
}

export function SubscriptionSummary({ subscriptions: propSubs }: SubscriptionSummaryProps) {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [totalMonthly, setTotalMonthly] = useState(0);

    useEffect(() => {
        if (propSubs) {
            setSubscriptions(propSubs);
            const total = propSubs.reduce((sum, s) => {
                if (s.frequency === 'weekly') return sum + s.amount * 4;
                if (s.frequency === 'yearly') return sum + s.amount / 12;
                return sum + s.amount;
            }, 0);
            setTotalMonthly(total);
        } else {
            // Mock data
            const mockSubs = [
                { id: '1', name: 'Netflix', amount: 149.99, frequency: 'monthly', category: 'Eğlence', nextPayment: '2024-12-20' },
                { id: '2', name: 'Spotify', amount: 59.99, frequency: 'monthly', category: 'Eğlence', nextPayment: '2024-12-15' },
                { id: '3', name: 'iCloud', amount: 44.99, frequency: 'monthly', category: 'Teknoloji', nextPayment: '2024-12-22' },
                { id: '4', name: 'Spor Salonu', amount: 299, frequency: 'monthly', category: 'Sağlık', nextPayment: '2024-12-25' },
            ];
            setSubscriptions(mockSubs);
            setTotalMonthly(553.97);
        }
    }, [propSubs]);

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Eğlence': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            case 'Teknoloji': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Sağlık': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-muted text-muted-foreground dark:bg-gray-700 dark:text-gray-400';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diff <= 0) return 'Bugün';
        if (diff === 1) return 'Yarın';
        if (diff <= 7) return `${diff} gün`;
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">
                        📱 Abonelikler
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {subscriptions.length} aktif abonelik
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Aylık</p>
                    <p className="text-xl font-bold text-red-500 dark:text-red-400">
                        ₺{totalMonthly.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Subscription list */}
            <div className="space-y-3">
                {subscriptions.slice(0, 4).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(sub.category)}`}>
                                {sub.category.slice(0, 3)}
                            </span>
                            <span className="font-medium text-foreground">{sub.name}</span>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-foreground">
                                ₺{sub.amount}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatDate(sub.nextPayment)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {subscriptions.length > 4 && (
                <button className="mt-3 w-full py-2 text-center text-primary-600 dark:text-primary-400 font-medium text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                    +{subscriptions.length - 4} daha →
                </button>
            )}

            {/* Yearly cost warning */}
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-start gap-2">
                <span className="text-lg">💡</span>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                    Yıllık: ₺{(totalMonthly * 12).toFixed(0)} harcıyorsunuz. Gözden geçirin!
                </p>
            </div>
        </div>
    );
}


