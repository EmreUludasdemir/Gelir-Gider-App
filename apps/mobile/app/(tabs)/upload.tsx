import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface UploadedFile {
    id: string;
    filename: string;
    uploadedAt: string;
    transactionCount: number;
    status: 'processing' | 'completed' | 'failed';
}

export default function UploadScreen() {
    const { fetchWithAuth, apiUrl } = useApi();
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUploadHistory();
    }, []);

    const loadUploadHistory = async () => {
        try {
            // Mock data - replace with actual API call
            setUploadedFiles([
                {
                    id: '1',
                    filename: 'banka_ekstresi_kasim.pdf',
                    uploadedAt: '2024-12-10',
                    transactionCount: 45,
                    status: 'completed',
                },
                {
                    id: '2',
                    filename: 'kredi_karti_hesap_ozeti.pdf',
                    uploadedAt: '2024-12-05',
                    transactionCount: 28,
                    status: 'completed',
                },
            ]);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            await uploadFile(file);
        } catch (error) {
            Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu');
        }
    };

    const uploadFile = async (file: DocumentPicker.DocumentPickerAsset) => {
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: 'application/pdf',
            } as any);

            const response = await fetch(`${apiUrl}/uploads/pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            Alert.alert(
                'Başarılı! 🎉',
                `${data.transactions?.length || 0} işlem bulundu ve eklendi.`,
                [{ text: 'Tamam', onPress: loadUploadHistory }]
            );
        } catch (error) {
            Alert.alert('Hata', 'PDF yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return Colors.success;
            case 'processing':
                return Colors.warning;
            case 'failed':
                return Colors.danger;
            default:
                return Colors.gray500;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Tamamlandı';
            case 'processing':
                return 'İşleniyor';
            case 'failed':
                return 'Başarısız';
            default:
                return status;
        }
    };

    const renderUploadedFile = ({ item }: { item: UploadedFile }) => (
        <Card style={styles.fileCard}>
            <View style={styles.fileIcon}>
                <Ionicons name="document-text" size={24} color={Colors.primary} />
            </View>
            <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{item.filename}</Text>
                <Text style={styles.fileMeta}>
                    {formatDate(item.uploadedAt)} • {item.transactionCount} işlem
                </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {getStatusText(item.status)}
                </Text>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>PDF Yükle</Text>
                <Text style={styles.subtitle}>
                    Banka ekstrenizi yükleyin, işlemleriniz otomatik olarak eklensin
                </Text>

                {/* Upload Area */}
                <TouchableOpacity
                    style={styles.uploadArea}
                    onPress={pickDocument}
                    disabled={uploading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[Colors.primary + '10', Colors.primaryLight + '10']}
                        style={styles.uploadGradient}
                    >
                        {uploading ? (
                            <>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={styles.uploadingText}>Yükleniyor...</Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.uploadIconContainer}>
                                    <Ionicons name="cloud-upload" size={40} color={Colors.primary} />
                                </View>
                                <Text style={styles.uploadTitle}>PDF Dosyası Seç</Text>
                                <Text style={styles.uploadHint}>
                                    Banka ekstresi veya kredi kartı hesap özeti
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Supported Banks */}
                <View style={styles.supportedSection}>
                    <Text style={styles.supportedTitle}>Desteklenen Bankalar</Text>
                    <View style={styles.bankGrid}>
                        {['Garanti', 'İş Bankası', 'Akbank', 'Yapı Kredi', 'QNB', 'Diğer'].map((bank) => (
                            <View key={bank} style={styles.bankBadge}>
                                <Text style={styles.bankName}>{bank}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Upload History */}
                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>Yükleme Geçmişi</Text>

                    {loading ? (
                        <ActivityIndicator color={Colors.primary} style={styles.loader} />
                    ) : uploadedFiles.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Ionicons name="folder-open-outline" size={48} color={Colors.gray300} />
                            <Text style={styles.emptyText}>Henüz yükleme yapılmadı</Text>
                        </Card>
                    ) : (
                        uploadedFiles.map((file) => (
                            <View key={file.id}>
                                {renderUploadedFile({ item: file })}
                            </View>
                        ))
                    )}
                </View>

                {/* Tips */}
                <Card style={styles.tipCard}>
                    <Ionicons name="information-circle" size={20} color={Colors.secondary} />
                    <Text style={styles.tipText}>
                        PDF'inizdeki işlemler AI ile otomatik olarak kategorize edilir.
                    </Text>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.lg,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: Typography.bold,
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
    },
    uploadArea: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        marginBottom: Spacing.xl,
    },
    uploadGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['4xl'],
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        borderRadius: BorderRadius.xl,
    },
    uploadIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    uploadTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.semibold,
        color: Colors.primary,
        marginBottom: Spacing.xs,
    },
    uploadHint: {
        fontSize: Typography.sm,
        color: Colors.gray500,
    },
    uploadingText: {
        fontSize: Typography.base,
        color: Colors.primary,
        marginTop: Spacing.md,
    },
    supportedSection: {
        marginBottom: Spacing.xl,
    },
    supportedTitle: {
        fontSize: Typography.sm,
        fontWeight: Typography.medium,
        color: Colors.gray600,
        marginBottom: Spacing.md,
    },
    bankGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    bankBadge: {
        backgroundColor: Colors.gray100,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    bankName: {
        fontSize: Typography.sm,
        color: Colors.gray700,
    },
    historySection: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.semibold,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    fileIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    fileName: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.text,
    },
    fileMeta: {
        fontSize: Typography.sm,
        color: Colors.gray500,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    statusText: {
        fontSize: Typography.xs,
        fontWeight: Typography.medium,
    },
    emptyCard: {
        alignItems: 'center',
        paddingVertical: Spacing['3xl'],
    },
    emptyText: {
        fontSize: Typography.base,
        color: Colors.gray400,
        marginTop: Spacing.md,
    },
    loader: {
        paddingVertical: Spacing['2xl'],
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.secondary + '10',
    },
    tipText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.gray600,
        lineHeight: 20,
    },
});
