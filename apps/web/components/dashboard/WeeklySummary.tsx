'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';

interface WeeklyData {
    day: string;
    income: number;
    expense: number;
}

interface Props {
    data?: WeeklyData[];
}

const DEFAULT_WEEK_DATA: WeeklyData[] = [
    { day: 'Pzt', income: 0, expense: 120 },
    { day: 'Sal', income: 0, expense: 85 },
    { day: 'Çar', income: 5000, expense: 230 },
    { day: 'Per', income: 0, expense: 45 },
    { day: 'Cum', income: 0, expense: 380 },
    { day: 'Cmt', income: 0, expense: 520 },
    { day: 'Paz', income: 200, expense: 150 },
];

export const WeeklySummary = memo(function WeeklySummary({ data }: Props) {
    const [weekData, setWeekData] = useState<WeeklyData[]>([]);

    useEffect(() => {
        setWeekData(data || DEFAULT_WEEK_DATA);
    }, [data]);

    const { maxValue, totalIncome, totalExpense } = useMemo(() => ({
        maxValue: Math.max(...weekData.flatMap(d => [d.income, d.expense]), 1),
        totalIncome: weekData.reduce((sum, d) => sum + d.income, 0),
        totalExpense: weekData.reduce((sum, d) => sum + d.expense, 0),
    }), [weekData]);

    const getBarHeight = useCallback((value: number) => {
        return `${Math.max((value / maxValue) * 100, 5)}%`;
    }, [maxValue]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Bu Hafta
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Günlük gelir ve gider özeti
                    </p>
                </div>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span className="text-gray-600 dark:text-gray-300">Gelir</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                        <span className="text-gray-600 dark:text-gray-300">Gider</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex items-end justify-between h-40 gap-2 mb-4">
                {weekData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex justify-center items-end gap-1 h-32">
                            {/* Income bar */}
                            <div
                                className="w-3 bg-green-500 rounded-t-sm transition-all duration-500 hover:bg-green-600"
                                style={{ height: getBarHeight(day.income) }}
                                title={`Gelir: ₺${day.income.toLocaleString('tr-TR')}`}
                            />
                            {/* Expense bar */}
                            <div
                                className="w-3 bg-red-400 rounded-t-sm transition-all duration-500 hover:bg-red-500"
                                style={{ height: getBarHeight(day.expense) }}
                                title={`Gider: ₺${day.expense.toLocaleString('tr-TR')}`}
                            />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {day.day}
                        </span>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Gelir</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        +₺{totalIncome.toLocaleString('tr-TR')}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Gider</p>
                    <p className="text-lg font-semibold text-red-500 dark:text-red-400">
                        -₺{totalExpense.toLocaleString('tr-TR')}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Net</p>
                    <p className={`text-lg font-semibold ${totalIncome - totalExpense >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {totalIncome - totalExpense >= 0 ? '+' : ''}₺{(totalIncome - totalExpense).toLocaleString('tr-TR')}
                    </p>
                </div>
            </div>
        </div>
    );
})
