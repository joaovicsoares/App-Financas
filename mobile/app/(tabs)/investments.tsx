import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeArea } from '@/hooks/useSafeArea';

interface InvestmentSummary {
    totalInvested: number;
    totalCurrentValue: number;
    totalYield: number;
    yieldPercentage: number;
    activeCount: number;
}

interface Investment {
    id: string;
    name: string;
    type: number;
    status: number;
    amountInvested: number;
    annualRate: number;
    startDate: string;
    maturityDate?: string;
    currentValue: number;
    totalYield: number;
    yieldPercentage: number;
}

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

export default function InvestmentsScreen() {
    const router = useRouter();
    const safeArea = useSafeArea();
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [summary, setSummary] = useState<InvestmentSummary | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [invRes, sumRes] = await Promise.all([
                api.get('/investments'),
                api.get('/investments/summary'),
            ]);
            setInvestments(invRes.data);
            setSummary(sumRes.data);
        } catch (error) {
            console.error('Error loading investments:', error);
        }
    }, []);

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

    function handleDelete(id: string) {
        Alert.alert('Excluir', 'Tem certeza que deseja excluir este investimento?', [
            { text: 'Cancelar' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/investments/${id}`);
                        loadData();
                    } catch (error: any) {
                        Alert.alert('Erro', error.response?.data?.message || 'Erro ao excluir.');
                    }
                },
            },
        ]);
    }

    const activeInvestments = investments.filter((i) => i.status === 0);
    const redeemedInvestments = investments.filter((i) => i.status === 1);

    return (
        <View style={styles.container}>
            <FlatList
                data={activeInvestments}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                ListHeaderComponent={
                    <View>
                        {/* Header */}
                        <View style={[styles.header, { paddingTop: safeArea.paddingTop }]}>
                            <Text style={styles.title}>Investimentos</Text>
                        </View>

                        {/* Summary Card */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Patrimônio investido</Text>
                            <Text style={styles.summaryValue}>
                                {formatCurrency(summary?.totalCurrentValue ?? 0)}
                            </Text>

                            <View style={styles.summaryRow}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryItemLabel}>Investido</Text>
                                    <Text style={styles.summaryItemValue}>
                                        {formatCurrency(summary?.totalInvested ?? 0)}
                                    </Text>
                                </View>

                                <View style={styles.summaryDivider} />

                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryItemLabel}>Rendimento</Text>
                                    <Text style={[styles.summaryItemValue, { color: Colors.income }]}>
                                        +{formatCurrency(summary?.totalYield ?? 0)}
                                    </Text>
                                </View>

                                <View style={styles.summaryDivider} />

                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryItemLabel}>Retorno</Text>
                                    <Text style={[styles.summaryItemValue, { color: Colors.income }]}>
                                        {(summary?.yieldPercentage ?? 0).toFixed(2)}%
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Section Title */}
                        <Text style={styles.sectionTitle}>
                            Ativos ({activeInvestments.length})
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="chart-line" size={48} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>Nenhum investimento ativo</Text>
                        <Text style={styles.emptySubtext}>Toque no + para adicionar</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.investmentCard}
                        onPress={() => router.push(`/investment/${item.id}` as any)}
                        onLongPress={() => handleDelete(item.id)}
                    >
                        <View style={styles.investmentHeader}>
                            <View style={[styles.typeTag, { backgroundColor: TYPE_COLORS[item.type] + '20' }]}>
                                <Text style={[styles.typeTagText, { color: TYPE_COLORS[item.type] }]}>
                                    {INVESTMENT_TYPES[item.type] ?? 'Outro'}
                                </Text>
                            </View>
                            <Text style={styles.investmentRate}>
                                {(item.annualRate * 100).toFixed(1)}% a.a.
                            </Text>
                        </View>

                        <Text style={styles.investmentName}>{item.name}</Text>

                        <View style={styles.investmentValues}>
                            <View>
                                <Text style={styles.valueLabel}>Investido</Text>
                                <Text style={styles.valueText}>{formatCurrency(item.amountInvested)}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.valueLabel}>Valor atual</Text>
                                <Text style={[styles.valueText, { color: Colors.income }]}>
                                    {formatCurrency(item.currentValue)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.yieldBar}>
                            <View style={styles.yieldBarBg}>
                                <View
                                    style={[
                                        styles.yieldBarFill,
                                        { width: `${Math.min(item.yieldPercentage, 100)}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.yieldText}>
                                +{formatCurrency(item.totalYield)} ({item.yieldPercentage.toFixed(2)}%)
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListFooterComponent={
                    redeemedInvestments.length > 0 ? (
                        <View>
                            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                                Resgatados ({redeemedInvestments.length})
                            </Text>
                            {redeemedInvestments.map((item) => (
                                <View key={item.id} style={[styles.investmentCard, { opacity: 0.6 }]}>
                                    <View style={styles.investmentHeader}>
                                        <View style={[styles.typeTag, { backgroundColor: Colors.textMuted + '20' }]}>
                                            <Text style={[styles.typeTagText, { color: Colors.textMuted }]}>
                                                {INVESTMENT_TYPES[item.type] ?? 'Outro'}
                                            </Text>
                                        </View>
                                        <Text style={[styles.investmentRate, { color: Colors.textMuted }]}>
                                            Resgatado
                                        </Text>
                                    </View>
                                    <Text style={styles.investmentName}>{item.name}</Text>
                                    <View style={styles.investmentValues}>
                                        <View>
                                            <Text style={styles.valueLabel}>Investido</Text>
                                            <Text style={styles.valueText}>{formatCurrency(item.amountInvested)}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.valueLabel}>Resgatado</Text>
                                            <Text style={styles.valueText}>{formatCurrency(item.currentValue)}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : null
                }
            />

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/investment/new' as any)}
            >
                <MaterialCommunityIcons name="plus" size={28} color={Colors.white} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        paddingHorizontal: 0,
        paddingBottom: 16,
    },
    title: { fontSize: 28, fontWeight: '700', color: Colors.text },
    list: { paddingHorizontal: 24, paddingBottom: 100 },

    // Summary
    summaryCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    summaryLabel: { fontSize: 14, color: Colors.textSecondary },
    summaryValue: { fontSize: 32, fontWeight: '700', color: Colors.text, marginTop: 8 },
    summaryRow: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryItemLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
    summaryItemValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
    summaryDivider: { width: 1, height: 36, backgroundColor: Colors.border },

    // Section
    sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 },

    // Card
    investmentCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    investmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    typeTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeTagText: { fontSize: 12, fontWeight: '600' },
    investmentRate: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
    investmentName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 14 },
    investmentValues: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    valueLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
    valueText: { fontSize: 15, fontWeight: '600', color: Colors.text },
    yieldBar: { gap: 6 },
    yieldBarBg: {
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    yieldBarFill: {
        height: '100%',
        backgroundColor: Colors.income,
        borderRadius: 2,
    },
    yieldText: { fontSize: 12, color: Colors.income, fontWeight: '500' },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 12 },
    emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },

    // FAB
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 90,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});
