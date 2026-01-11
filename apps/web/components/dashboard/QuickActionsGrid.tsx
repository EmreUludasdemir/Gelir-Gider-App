'use client';

import React from 'react';
import Link from 'next/link';

interface QuickAction {
    icon: React.ReactNode;
    label: string;
    href: string;
    color: string;
    bgColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        ),
        label: 'Gelir Ekle',
        href: '/dashboard/transactions?type=income',
        color: 'text-success',
        bgColor: 'bg-success/15 hover:bg-success/25',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
        ),
        label: 'Gider Ekle',
        href: '/dashboard/transactions?type=expense',
        color: 'text-destructive',
        bgColor: 'bg-destructive/15 hover:bg-destructive/25',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        label: 'PDF Yukle',
        href: '/dashboard/upload',
        color: 'text-primary-600',
        bgColor: 'bg-primary-100 hover:bg-primary-200',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
        ),
        label: 'Hedef Koy',
        href: '/dashboard/goals',
        color: 'text-amber-700',
        bgColor: 'bg-amber-100 hover:bg-amber-200',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        label: 'Butce Ayarla',
        href: '/dashboard/budgets',
        color: 'text-sky-700',
        bgColor: 'bg-sky-100 hover:bg-sky-200',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        label: 'Rapor Al',
        href: '/dashboard?action=report',
        color: 'text-teal-700',
        bgColor: 'bg-teal-100 hover:bg-teal-200',
    },
];

export function QuickActionsGrid() {
    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
                Hizli Islemler
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {QUICK_ACTIONS.map((action, index) => (
                    <Link
                        key={index}
                        href={action.href}
                        className={`${action.bgColor} rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 transform hover:scale-105`}
                    >
                        <div className={action.color}>
                            {action.icon}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium text-center">
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}


