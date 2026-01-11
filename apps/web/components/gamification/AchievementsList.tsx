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
                { id: '1', name: 'BaÅŸlangÄ±Ã§', description: 'Ä°lk iÅŸlemini ekle', icon: 'âœ¨', xpReward: 25, unlocked: true },
                { id: '2', name: 'Ä°lk AdÄ±m', description: 'Ä°lk tasarruf hedefini oluÅŸtur', icon: 'ğŸ¯', xpReward: 50, unlocked: true },
                { id: '3', name: 'TakipÃ§i', description: '10 iÅŸlem ekle', icon: 'ğŸ“', xpReward: 75, unlocked: false },
                { id: '4', name: 'DÃ¼zenli', description: '7 gÃ¼n art arda iÅŸlem ekle', icon: 'ğŸ”¥', xpReward: 150, unlocked: false },
            ]);
        }
    }, [propAchievements]);

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const displayAchievements = compact ? achievements.slice(0, 4) : achievements;

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">
                        ğŸ† BaÅŸarÄ±lar
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {unlockedCount} / {achievements.length} kazanÄ±ldÄ±
                    </p>
                </div>
                {!compact && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                        <span className="text-primary-600 dark:text-primary-400 font-semibold">
                            Level 3
                        </span>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="h-2 bg-muted dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary-500 to-pink-500 rounded-full transition-all duration-500"
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
                                : 'bg-muted/40/50 border border-border dark:border-gray-600 opacity-60'
                            }`}
                    >
                        <div className={`text-3xl mb-2 ${!achievement.unlocked && 'grayscale'}`}>
                            {achievement.icon}
                        </div>
                        <h4 className={`font-medium text-sm ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                            {achievement.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
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
                <button className="mt-4 w-full py-2 text-center text-primary-600 dark:text-primary-400 font-medium text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                    TÃ¼mÃ¼nÃ¼ GÃ¶r â†’
                </button>
            )}
        </div>
    );
}


