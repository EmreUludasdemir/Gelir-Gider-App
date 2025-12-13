'use client';

import React, { useState, useEffect } from 'react';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    xpReward: number;
    unlocked: boolean;
}

interface AchievementsProps {
    achievements?: Achievement[];
    compact?: boolean;
}

export function AchievementsList({ achievements: propAchievements, compact = false }: AchievementsProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    useEffect(() => {
        if (propAchievements) {
            setAchievements(propAchievements);
        } else {
            // Mock data
            setAchievements([
                { id: '1', name: 'Başlangıç', description: 'İlk işlemini ekle', icon: '✨', xpReward: 25, unlocked: true },
                { id: '2', name: 'İlk Adım', description: 'İlk tasarruf hedefini oluştur', icon: '🎯', xpReward: 50, unlocked: true },
                { id: '3', name: 'Takipçi', description: '10 işlem ekle', icon: '📝', xpReward: 75, unlocked: false },
                { id: '4', name: 'Düzenli', description: '7 gün art arda işlem ekle', icon: '🔥', xpReward: 150, unlocked: false },
            ]);
        }
    }, [propAchievements]);

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const displayAchievements = compact ? achievements.slice(0, 4) : achievements;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        🏆 Başarılar
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {unlockedCount} / {achievements.length} kazanıldı
                    </p>
                </div>
                {!compact && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">
                            Level 3
                        </span>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Achievements grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {displayAchievements.map((achievement) => (
                    <div
                        key={achievement.id}
                        className={`relative p-4 rounded-xl text-center transition-all duration-200 ${achievement.unlocked
                                ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800'
                                : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 opacity-60'
                            }`}
                    >
                        <div className={`text-3xl mb-2 ${!achievement.unlocked && 'grayscale'}`}>
                            {achievement.icon}
                        </div>
                        <h4 className={`font-medium text-sm ${achievement.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                            {achievement.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            +{achievement.xpReward} XP
                        </p>
                        {!achievement.unlocked && (
                            <div className="absolute top-2 right-2">
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {compact && (
                <button className="mt-4 w-full py-2 text-center text-purple-600 dark:text-purple-400 font-medium text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                    Tümünü Gör →
                </button>
            )}
        </div>
    );
}
