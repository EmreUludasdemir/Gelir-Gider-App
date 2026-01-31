'use client';

import { useEffect } from 'react';
import { Calendar, Clock, Repeat, ChevronRight } from 'lucide-react';
import { useTransactions } from '@/lib/hooks';
import { usePreferences } from '@/lib/PreferencesContext';
import { detectRecurringPayments, RecurringPattern } from '@/lib/utilities';

const frequencyLabels = {
    weekly: { tr: 'Haftalık', en: 'Weekly' },
    biweekly: { tr: 'İki Haftalık', en: 'Bi-weekly' },
    monthly: { tr: 'Aylık', en: 'Monthly' },
    yearly: { tr: 'Yıllık', en: 'Yearly' },
};

export function RecurringDetector() {
    const { data: transactions } = useTransactions();
    const { language, formatCurrency } = usePreferences();

    if (!transactions || transactions.length < 5) {
        return null;
    }

    const patterns = detectRecurringPayments(transactions);

    if (patterns.length === 0) {
        return null;
    }

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-4 border-b border-border dark:border-gray-700 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-foreground">
                    {language === 'tr' ? 'Tespit Edilen Tekrarlayan Ödemeler' : 'Detected Recurring Payments'}
                </h3>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {patterns.slice(0, 5).map((pattern, index) => (
                    <div key={index} className="p-4 hover:bg-muted/40 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                    {pattern.description}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {frequencyLabels[pattern.frequency][language]}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Repeat className="w-3 h-3" />
                                        {pattern.transactions.length}x
                                    </span>
                                    {pattern.nextExpected && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {language === 'tr' ? 'Sonraki:' : 'Next:'}{' '}
                                            {pattern.nextExpected.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-semibold ${pattern.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {formatCurrency(Math.abs(pattern.amount))}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {patterns.length > 5 && (
                <div className="p-3 bg-muted/40/50 text-center">
                    <span className="text-sm text-muted-foreground">
                        +{patterns.length - 5} {language === 'tr' ? 'daha fazla' : 'more'}
                    </span>
                </div>
            )}
        </div>
    );
}


