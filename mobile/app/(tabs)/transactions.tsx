import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeSpacing } from '@/hooks/use-safe-spacing';

interface Transaction {
    id: string;
    amount: number;
    type: number;
    recurrenceType: number;
    totalInstallments?: number;
    currentInstallment?: number;
    description: string;
    date: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
}

export default function TransactionsScreen() {
    const router = useRouter();
    const { headerPaddingTop, tabListPaddingBottom, floatingBottom } = useSafeSpacing();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

    const loadTransactions = useCallback(async () => {
        try {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
            const response = await api.get('/transactions', { params: { startDate, endDate } });
            setTransactions(response.data);
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadTransactions();
        }, [loadTransactions])
    );

    async function onRefresh() {
        setRefreshing(true);
        await loadTransactions();
        setRefreshing(false);
    }

    function formatCurrency(value: number) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }

    const filteredTransactions = transactions.filter((t) => {
        if (filter === 'income') return t.type === 0;
        if (filter === 'expense') return t.type === 1;
        return true;
    });

    function handleDelete(id: string) {
        api.delete(`/transactions/${id}`).then(() => loadTransactions());
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
                <Text style={styles.title}>Transações</Text>
            </View>

            {/* Filters */}
            <View style={styles.filters}>
                {(['all', 'income', 'expense'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterBtn, filter === f && styles.filterActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'all' ? 'Todas' : f === 'income' ? 'Receitas' : 'Despesas'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.list, { paddingBottom: tabListPaddingBottom }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="receipt" size={48} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push(`/transaction/${item.id}`)}
                        onLongPress={() => handleDelete(item.id)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: item.categoryColor + '20' }]}>
                            <MaterialCommunityIcons
                                name={(item.categoryIcon as any) || 'cash'}
                                size={24}
                                color={item.categoryColor}
                            />
                        </View>
                        <View style={styles.info}>
                            <Text style={styles.cardName}>{item.description || item.categoryName}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.cardCategory}>
                                    {item.categoryName} • {formatDate(item.date)}
                                </Text>
                                {item.recurrenceType === 1 && item.currentInstallment && item.totalInstallments && (
                                    <View style={{ backgroundColor: Colors.primary + '20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                                        <Text style={{ fontSize: 9, color: Colors.primary, fontWeight: '600' }}>FIXA {item.currentInstallment}/{item.totalInstallments}</Text>
                                    </View>
                                )}
                                {item.recurrenceType === 2 && item.currentInstallment && item.totalInstallments && (
                                    <View style={{ backgroundColor: Colors.expense + '20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                                        <Text style={{ fontSize: 9, color: Colors.expense, fontWeight: '600' }}>{item.currentInstallment}/{item.totalInstallments}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <Text
                            style={[styles.cardAmount, { color: item.type === 0 ? Colors.income : Colors.expense }]}
                        >
                            {item.type === 0 ? '+' : '-'} {formatCurrency(item.amount)}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity style={[styles.fab, { bottom: floatingBottom }]} onPress={() => router.push('/transaction/new')}>
                <MaterialCommunityIcons name="plus" size={28} color={Colors.white} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    title: { fontSize: 28, fontWeight: '700', color: Colors.text },
    filters: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 10,
        marginBottom: 16,
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
    filterTextActive: { color: Colors.white },
    list: { paddingHorizontal: 24 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: { flex: 1, marginLeft: 12 },
    cardName: { fontSize: 15, fontWeight: '500', color: Colors.text },
    cardCategory: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    cardAmount: { fontSize: 15, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 12 },
    fab: {
        position: 'absolute',
        right: 24,
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
