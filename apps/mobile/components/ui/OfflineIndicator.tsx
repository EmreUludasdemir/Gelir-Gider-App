import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '@/contexts/OfflineContext';
import { Colors, Typography, Spacing } from '@/constants/theme';

export function OfflineIndicator() {
    const { isOffline, isSyncing, pendingCount, syncNow } = useOffline();

    if (!isOffline && pendingCount === 0) {
        return null;
    }

    const handleSync = async () => {
        if (!isSyncing && !isOffline) {
            await syncNow();
        }
    };

    return (
        <View style={[styles.container, isOffline ? styles.offline : styles.pending]}>
            <View style={styles.content}>
                <Ionicons
                    name={isOffline ? 'cloud-offline' : 'cloud-upload'}
                    size={18}
                    color={Colors.white}
                />
                <Text style={styles.text}>
                    {isOffline
                        ? 'Çevrimdışı moddasınız'
                        : `${pendingCount} işlem bekliyor`}
                </Text>
            </View>

            {!isOffline && pendingCount > 0 && (
                <TouchableOpacity
                    onPress={handleSync}
                    style={styles.syncButton}
                    disabled={isSyncing}
                >
                    {isSyncing ? (
                        <Ionicons name="sync" size={18} color={Colors.white} />
                    ) : (
                        <Text style={styles.syncText}>Senkronize Et</Text>
                    )}
                </TouchableOpacity>
            )}

            {isOffline && pendingCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
            )}
        </View>
    );
}

export function SyncStatusBadge() {
    const { isSyncing, pendingCount, isOffline } = useOffline();

    if (pendingCount === 0 && !isSyncing) {
        return null;
    }

    return (
        <View style={styles.statusBadge}>
            {isSyncing ? (
                <Ionicons name="sync" size={14} color={Colors.white} />
            ) : (
                <Text style={styles.statusBadgeText}>{pendingCount}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    offline: {
        backgroundColor: Colors.danger,
    },
    pending: {
        backgroundColor: Colors.warning,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    text: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.medium,
    },
    syncButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: 12,
    },
    syncText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.semibold,
    },
    badge: {
        backgroundColor: Colors.white,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: Colors.danger,
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
    },
    statusBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: Colors.danger,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    statusBadgeText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: Typography.bold,
    },
});
