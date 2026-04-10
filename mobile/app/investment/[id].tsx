import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeSpacing } from '@/hooks/use-safe-spacing';

const INVESTMENT_TYPES: Record<number, string> = {
    0: 'CDB',
    1: 'LCI',
    2: 'LCA',
    3: 'Tesouro Pré',
    4: 'Tesouro Selic',
    5: 'Outro',
};

const TYPE_COLORS: Record<number, string> = {
    0: '#6C5CE7',
    1: '#00C897',
    2: '#FF6B6B',
    3: '#FDCB6E',
    4: '#74B9FF',
    5: '#A0A0B8',
};

interface InvestmentDetail {
    id: string;
    name: string;
    type: number;
    status: number;
    amountInvested: number;
    annualRate: number;
    startDate: string;
    maturityDate?: string;
    redeemedAt?: string;
    redeemedAmount?: number;
    notes: string;
    createdAt: string;
    currentValue: number;
    totalYield: number;
    yieldPercentage: number;
}

export default function InvestmentDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { headerPaddingTop, scrollPaddingBottom } = useSafeSpacing();
    const [investment, setInvestment] = useState<InvestmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const response = await api.get('/investments');
            const found = response.data.find((i: InvestmentDetail) => i.id === id);
            setInvestment(found ?? null);
        } catch (error) {
            console.error('Error loading investment:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    async function onRefresh() {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }

    function formatCurrency(value: number) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    }

    function getDaysSince(dateStr: string) {
        return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    }

    async function handleRedeem() {
        if (!investment) return;
        Alert.alert(
            'Resgatar Investimento',
            `Deseja resgatar "${investment.name}"?\nValor atual: ${formatCurrency(investment.currentValue)}`,
            [
                { text: 'Cancelar' },
                {
                    text: 'Resgatar',
                    onPress: async () => {
                        try {
                            await api.post(`/investments/${id}/redeem`, {
                                redeemedAmount: investment.currentValue,
                            });
                            Alert.alert('Sucesso', 'Investimento resgatado!');
                            loadData();
                        } catch (error: any) {
                            Alert.alert('Erro', error.response?.data?.message || 'Erro ao resgatar.');
                        }
                    },
                },
            ]
        );
    }

    async function handleDelete() {
        Alert.alert('Excluir', 'Tem certeza que deseja excluir este investimento?', [
            { text: 'Cancelar' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/investments/${id}`);
                        router.back();
                    } catch (error: any) {
                        Alert.alert('Erro', error.response?.data?.message || 'Erro ao excluir.');
                    }
                },
            },
        ]);
    }

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!investment) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: Colors.textMuted }}>Investimento não encontrado.</Text>
            </View>
        );
    }

    const isActive = investment.status === 0;
    const typeColor = TYPE_COLORS[investment.type] ?? '#A0A0B8';
    const days = getDaysSince(investment.startDate);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {investment.name}
                </Text>
                <TouchableOpacity onPress={handleDelete}>
                    <MaterialCommunityIcons name="delete-outline" size={26} color={Colors.expense} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.content, { paddingBottom: scrollPaddingBottom }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Type Badge + Status */}
                <View style={styles.badgeRow}>
                    <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                        <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                            {INVESTMENT_TYPES[investment.type] ?? 'Outro'}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isActive ? Colors.income + '20' : Colors.textMuted + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: isActive ? Colors.income : Colors.textMuted }]}>
                            {isActive ? 'Ativo' : 'Resgatado'}
                        </Text>
                    </View>
                </View>

                {/* Main Value Card */}
                <View style={styles.valueCard}>
                    <Text style={styles.valueCardLabel}>Valor atual</Text>
                    <Text style={[styles.valueCardAmount, { color: isActive ? Colors.income : Colors.text }]}>
                        {formatCurrency(investment.currentValue)}
                    </Text>
                    <View style={styles.yieldRow}>
                        <MaterialCommunityIcons
                            name="trending-up"
                            size={18}
                            color={Colors.income}
                        />
                        <Text style={styles.yieldText}>
                            +{formatCurrency(investment.totalYield)} ({investment.yieldPercentage.toFixed(2)}%)
                        </Text>
                    </View>
                </View>

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Valor investido</Text>
                        <Text style={styles.detailValue}>{formatCurrency(investment.amountInvested)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Taxa anual</Text>
                        <Text style={styles.detailValue}>{(investment.annualRate * 100).toFixed(2)}%</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Data de aplicação</Text>
                        <Text style={styles.detailValue}>{formatDate(investment.startDate)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Dias investido</Text>
                        <Text style={styles.detailValue}>{days} dias</Text>
                    </View>
                    {investment.maturityDate && (
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Vencimento</Text>
                            <Text style={styles.detailValue}>{formatDate(investment.maturityDate)}</Text>
                        </View>
                    )}
                    {investment.redeemedAt && (
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Resgatado em</Text>
                            <Text style={styles.detailValue}>{formatDate(investment.redeemedAt)}</Text>
                        </View>
                    )}
                </View>

                {/* Notes */}
                {investment.notes ? (
                    <View style={styles.notesBox}>
                        <Text style={styles.notesLabel}>Observações</Text>
                        <Text style={styles.notesText}>{investment.notes}</Text>
                    </View>
                ) : null}

                {/* Projection */}
                {isActive && (
                    <View style={styles.projectionCard}>
                        <Text style={styles.projectionTitle}>Projeção</Text>
                        {[3, 6, 12].map((months) => {
                            const futureDays = days + months * 30;
                            const projected =
                                investment.amountInvested *
                                Math.pow(1 + investment.annualRate, futureDays / 365);
                            return (
                                <View key={months} style={styles.projectionRow}>
                                    <Text style={styles.projectionLabel}>
                                        em {months} {months === 1 ? 'mês' : 'meses'}
                                    </Text>
                                    <Text style={styles.projectionValue}>
                                        {formatCurrency(projected)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Redeem Button */}
                {isActive && (
                    <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeem}>
                        <MaterialCommunityIcons name="cash-check" size={22} color={Colors.white} />
                        <Text style={styles.redeemBtnText}>Resgatar Investimento</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, flex: 1, marginHorizontal: 12, textAlign: 'center' },
    content: { paddingHorizontal: 24 },

    // Badges
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    typeBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
    typeBadgeText: { fontSize: 13, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
    statusBadgeText: { fontSize: 13, fontWeight: '600' },

    // Value Card
    valueCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    valueCardLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
    valueCardAmount: { fontSize: 38, fontWeight: '700' },
    yieldRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    yieldText: { fontSize: 15, color: Colors.income, fontWeight: '600' },

    // Details
    detailsGrid: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    detailLabel: { fontSize: 14, color: Colors.textSecondary },
    detailValue: { fontSize: 14, fontWeight: '600', color: Colors.text },

    // Notes
    notesBox: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    notesLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
    notesText: { fontSize: 14, color: Colors.text, lineHeight: 20 },

    // Projection
    projectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    projectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 },
    projectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    projectionLabel: { fontSize: 14, color: Colors.textSecondary },
    projectionValue: { fontSize: 14, fontWeight: '600', color: Colors.income },

    // Redeem
    redeemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: Colors.income,
        height: 54,
        borderRadius: 14,
    },
    redeemBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
