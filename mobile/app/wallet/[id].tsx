import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeSpacing } from '@/hooks/use-safe-spacing';

interface DashboardData {
    balance: number;
    totalIncome: number;
    totalExpenses: number;
    recentTransactions: Transaction[];
}

interface Transaction {
    id: string;
    amount: number;
    type: number;
    description: string;
    date: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    userName?: string;
}

interface WalletMember {
    userId: string;
    name: string;
    email: string;
    role: number;
    joinedAt: string;
}

interface SharedWallet {
    id: string;
    name: string;
    createdAt: string;
    members: WalletMember[];
}

export default function WalletDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { headerPaddingTop, tabListPaddingBottom, floatingBottom } = useSafeSpacing();
    const [wallet, setWallet] = useState<SharedWallet | null>(null);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [walletsRes, dashRes, transRes] = await Promise.all([
                api.get('/sharedwallets'),
                api.get(`/dashboard/wallet/${id}`),
                api.get(`/transactions?walletId=${id}`),
            ]);

            const found = walletsRes.data.find((w: SharedWallet) => w.id === id);
            setWallet(found ?? null);
            setDashboard(dashRes.data);
            setTransactions(transRes.data);
        } catch (error) {
            console.error('Error loading wallet data:', error);
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

    async function handleInvite() {
        if (!inviteEmail.trim()) return;
        try {
            await api.post(`/sharedwallets/${id}/invite`, { email: inviteEmail });
            setInviteEmail('');
            setShowInvite(false);
            Alert.alert('Sucesso', 'Membro convidado com sucesso!');
            loadData();
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao convidar membro.');
        }
    }

    async function handleRemoveMember(memberId: string) {
        Alert.alert('Remover', 'Tem certeza que deseja remover este membro?', [
            { text: 'Cancelar' },
            {
                text: 'Remover',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/sharedwallets/${id}/members/${memberId}`);
                        loadData();
                    } catch (error: any) {
                        Alert.alert('Erro', error.response?.data?.message || 'Erro ao remover.');
                    }
                },
            },
        ]);
    }

    function formatCurrency(value: number) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const ListHeader = () => (
        <View>
            {/* Dashboard Card */}
            <View style={styles.dashboardCard}>
                <Text style={styles.balanceLabel}>Saldo do mês</Text>
                <Text
                    style={[
                        styles.balanceValue,
                        { color: (dashboard?.balance ?? 0) >= 0 ? Colors.income : Colors.expense },
                    ]}
                >
                    {formatCurrency(dashboard?.balance ?? 0)}
                </Text>

                <View style={styles.balanceRow}>
                    <View style={styles.balanceItem}>
                        <View style={[styles.balanceDot, { backgroundColor: Colors.income }]} />
                        <View>
                            <Text style={styles.balanceItemLabel}>Receitas</Text>
                            <Text style={[styles.balanceItemValue, { color: Colors.income }]}>
                                {formatCurrency(dashboard?.totalIncome ?? 0)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.balanceDivider} />

                    <View style={styles.balanceItem}>
                        <View style={[styles.balanceDot, { backgroundColor: Colors.expense }]} />
                        <View>
                            <Text style={styles.balanceItemLabel}>Despesas</Text>
                            <Text style={[styles.balanceItemValue, { color: Colors.expense }]}>
                                {formatCurrency(dashboard?.totalExpenses ?? 0)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Members Section */}
            <TouchableOpacity
                style={styles.membersToggle}
                onPress={() => setShowMembers(!showMembers)}
            >
                <View style={styles.membersToggleLeft}>
                    <MaterialCommunityIcons name="account-group" size={20} color={Colors.primary} />
                    <Text style={styles.membersToggleText}>
                        {wallet?.members.length ?? 0} membro(s)
                    </Text>
                </View>
                <MaterialCommunityIcons
                    name={showMembers ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={Colors.textSecondary}
                />
            </TouchableOpacity>

            {showMembers && (
                <View style={styles.membersSection}>
                    {wallet?.members.map((m) => (
                        <View key={m.userId} style={styles.memberRow}>
                            <View style={styles.memberAvatar}>
                                <Text style={styles.memberAvatarText}>
                                    {m.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.memberName}>{m.name}</Text>
                                <Text style={styles.memberEmail}>{m.email}</Text>
                            </View>
                            <View style={styles.memberBadge}>
                                <Text
                                    style={[
                                        styles.memberBadgeText,
                                        m.role === 0 && styles.memberBadgeOwner,
                                    ]}
                                >
                                    {m.role === 0 ? 'Dono' : 'Membro'}
                                </Text>
                            </View>
                            {m.role !== 0 && (
                                <TouchableOpacity
                                    onPress={() => handleRemoveMember(m.userId)}
                                    style={{ marginLeft: 8 }}
                                >
                                    <MaterialCommunityIcons
                                        name="close-circle-outline"
                                        size={20}
                                        color={Colors.expense}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    {/* Invite */}
                    {showInvite ? (
                        <View style={styles.inviteBox}>
                            <TextInput
                                style={styles.inviteInput}
                                placeholder="Email do membro"
                                placeholderTextColor={Colors.textMuted}
                                value={inviteEmail}
                                onChangeText={setInviteEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
                                <MaterialCommunityIcons name="send" size={18} color={Colors.white} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.inviteCancelBtn}
                                onPress={() => setShowInvite(false)}
                            >
                                <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.inviteLink}
                            onPress={() => setShowInvite(true)}
                        >
                            <MaterialCommunityIcons name="account-plus" size={18} color={Colors.primary} />
                            <Text style={styles.inviteLinkText}>Convidar membro</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Transactions Header */}
            <View style={styles.transactionsHeader}>
                <Text style={styles.sectionTitle}>Transações</Text>
                <Text style={styles.transactionCount}>{transactions.length} registro(s)</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {wallet?.name ?? 'Carteira'}
                    </Text>
                    <Text style={styles.headerSubtitle}>Carteira compartilhada</Text>
                </View>
                <View style={styles.walletIconBox}>
                    <MaterialCommunityIcons name="wallet-outline" size={22} color={Colors.primary} />
                </View>
            </View>

            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.list, { paddingBottom: tabListPaddingBottom }]}
                ListHeaderComponent={ListHeader}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="cash-remove" size={48} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>Nenhuma transação ainda</Text>
                        <Text style={styles.emptySubtext}>Toque no + para adicionar</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.transactionCard}
                        onPress={() => router.push(`/transaction/${item.id}`)}
                    >
                        <View style={[styles.transactionIcon, { backgroundColor: item.categoryColor + '20' }]}>
                            <MaterialCommunityIcons
                                name={(item.categoryIcon as any) || 'cash'}
                                size={24}
                                color={item.categoryColor}
                            />
                        </View>
                        <View style={styles.transactionInfo}>
                            <Text style={styles.transactionName}>
                                {item.description || item.categoryName}
                            </Text>
                            <Text style={styles.transactionMeta}>
                                {item.categoryName} • {formatDate(item.date)}
                                {item.userName ? ` • ${item.userName}` : ''}
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.transactionAmount,
                                { color: item.type === 0 ? Colors.income : Colors.expense },
                            ]}
                        >
                            {item.type === 0 ? '+' : '-'} {formatCurrency(item.amount)}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: floatingBottom }]}
                onPress={() =>
                    router.push({
                        pathname: '/transaction/new',
                        params: { walletId: id, walletName: wallet?.name ?? 'Carteira' },
                    })
                }
            >
                <MaterialCommunityIcons name="plus" size={28} color={Colors.white} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
    headerSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    walletIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: { paddingHorizontal: 24 },

    // Dashboard
    dashboardCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    balanceLabel: { fontSize: 14, color: Colors.textSecondary },
    balanceValue: { fontSize: 36, fontWeight: '700', marginTop: 8 },
    balanceRow: { flexDirection: 'row', marginTop: 24, alignItems: 'center' },
    balanceItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    balanceDot: { width: 10, height: 10, borderRadius: 5 },
    balanceItemLabel: { fontSize: 12, color: Colors.textSecondary },
    balanceItemValue: { fontSize: 16, fontWeight: '600', marginTop: 2 },
    balanceDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border,
        marginHorizontal: 16,
    },

    // Members
    membersToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    membersToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    membersToggleText: { fontSize: 14, fontWeight: '500', color: Colors.text },
    membersSection: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    memberAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary + '30',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberAvatarText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
    memberName: { fontSize: 14, fontWeight: '500', color: Colors.text },
    memberEmail: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    memberBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: Colors.surfaceLight,
    },
    memberBadgeText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
    memberBadgeOwner: { color: Colors.primary },
    inviteBox: { flexDirection: 'row', gap: 8, marginTop: 12 },
    inviteInput: {
        flex: 1,
        backgroundColor: Colors.inputBg,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 12,
        height: 42,
        color: Colors.text,
        fontSize: 14,
    },
    inviteBtn: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteCancelBtn: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingTop: 12,
    },
    inviteLinkText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },

    // Transactions
    transactionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 8,
    },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
    transactionCount: { fontSize: 13, color: Colors.textMuted },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    transactionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionInfo: { flex: 1, marginLeft: 12 },
    transactionName: { fontSize: 15, fontWeight: '500', color: Colors.text },
    transactionMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    transactionAmount: { fontSize: 15, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 12 },
    emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
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
