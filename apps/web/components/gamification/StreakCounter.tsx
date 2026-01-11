'use client';

import React, { useState, useEffect } from 'react';

interface StreakProps {
    currentStreak?: number;
    longestStreak?: number;
    compact?: boolean;
}

export function StreakCounter({ currentStreak, longestStreak, compact = false }: StreakProps) {
    const [streak, setStreak] = useState(currentStreak || 0);
    const [longest, setLongest] = useState(longestStreak || 0);

    useEffect(() => {
        if (currentStreak !== undefined) setStreak(currentStreak);
        if (longestStreak !== undefined) setLongest(longestStreak);
        else {
            // Mock data
            setStreak(5);
            setLongest(12);
        }
    }, [currentStreak, longestStreak]);

    const getStreakMessage = () => {
        if (streak === 0) return 'BugÃ¼n ilk iÅŸlemini ekle! ğŸš€';
        if (streak < 7) return `${streak} gÃ¼nlÃ¼k serin var! Devam et!`;
        if (streak < 30) return `${streak} gÃ¼n! Sen bir yÄ±ldÄ±zsÄ±n! â­`;
        return `${streak} gÃ¼n! Ä°nanÄ±lmazsÄ±n! ğŸ†`;
    };

    const getFlameColor = () => {
        if (streak >= 30) return 'from-red-500 to-orange-500';
        if (streak >= 7) return 'from-orange-400 to-yellow-400';
        if (streak > 0) return 'from-yellow-400 to-amber-300';
        return 'from-gray-300 to-gray-400';
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-full">
                <span className="text-2xl">ğŸ”¥</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">{streak}</span>
                <span className="text-sm text-orange-600 dark:text-orange-400">gÃ¼n</span>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                    ğŸ”¥ GÃ¼nlÃ¼k Seri
                </h3>
                <div className="text-sm text-muted-foreground">
                    En uzun: {longest} gÃ¼n
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Flame animation */}
                <div className={`relative w-20 h-20 bg-gradient-to-t ${getFlameColor()} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold text-2xl">{streak}</span>
                    {streak > 0 && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20 animate-pulse" />
                    )}
                </div>

                <div className="flex-1">
                    <p className="text-muted-foreground dark:text-gray-300 font-medium">
                        {getStreakMessage()}
                    </p>

                    {/* Weekly progress */}
                    <div className="mt-3 flex gap-1">
                        {['P', 'S', 'Ã‡', 'P', 'C', 'C', 'P'].map((day, index) => {
                            const isActive = index < (streak % 7 || (streak > 0 ? 7 : 0));
                            return (
                                <div key={index} className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${isActive
                                            ? 'bg-gradient-to-t from-orange-400 to-yellow-400 text-white'
                                            : 'bg-muted dark:bg-gray-700 text-gray-400'
                                        }`}>
                                        {isActive ? 'âœ“' : day}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Motivation */}
            {streak > 0 && streak < 7 && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                        {7 - streak} gÃ¼n daha devam et ve "DÃ¼zenli" rozetini kazan! ğŸ…
                    </p>
                </div>
            )}
        </div>
    );
}


