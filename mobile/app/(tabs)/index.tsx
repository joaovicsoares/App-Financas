import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeArea } from '@/hooks/useSafeArea';

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
  recurrenceType: number;
  totalInstallments?: number;
  currentInstallment?: number;
  description: string;
  date: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const safeArea = useSafeArea();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }

  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: safeArea.paddingTop }]}>
          <View>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.userName}>{user?.name} 👋</Text>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo do mês</Text>
          <Text style={[styles.balanceValue, { color: (data?.balance ?? 0) >= 0 ? Colors.income : Colors.expense }]}>
            {formatCurrency(data?.balance ?? 0)}
          </Text>

          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={[styles.balanceDot, { backgroundColor: Colors.income }]} />
              <View>
                <Text style={styles.balanceItemLabel}>Receitas</Text>
                <Text style={[styles.balanceItemValue, { color: Colors.income }]}>
                  {formatCurrency(data?.totalIncome ?? 0)}
                </Text>
              </View>
            </View>

            <View style={styles.balanceDivider} />

            <View style={styles.balanceItem}>
              <View style={[styles.balanceDot, { backgroundColor: Colors.expense }]} />
              <View>
                <Text style={styles.balanceItemLabel}>Despesas</Text>
                <Text style={[styles.balanceItemValue, { color: Colors.expense }]}>
                  {formatCurrency(data?.totalExpenses ?? 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimas Transações</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {data?.recentTransactions && data.recentTransactions.length > 0 ? (
            data.recentTransactions.map((t) => (
              <TouchableOpacity key={t.id} style={styles.transactionCard}>
                <View style={[styles.transactionIcon, { backgroundColor: t.categoryColor + '20' }]}>
                  <MaterialCommunityIcons
                    name={(t.categoryIcon as any) || 'cash'}
                    size={24}
                    color={t.categoryColor}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionName}>{t.description || t.categoryName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.transactionCategory}>{t.categoryName}</Text>
                    {t.recurrenceType === 1 && t.currentInstallment && t.totalInstallments && (
                      <View style={{ backgroundColor: Colors.primary + '20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: Colors.primary, fontWeight: '600' }}>FIXA {t.currentInstallment}/{t.totalInstallments}</Text>
                      </View>
                    )}
                    {t.recurrenceType === 2 && t.currentInstallment && t.totalInstallments && (
                      <View style={{ backgroundColor: Colors.expense + '20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: Colors.expense, fontWeight: '600' }}>{t.currentInstallment}/{t.totalInstallments}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: t.type === 0 ? Colors.income : Colors.expense },
                  ]}
                >
                  {t.type === 0 ? '+' : '-'} {formatCurrency(t.amount)}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cash-remove" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nenhuma transação ainda</Text>
              <Text style={styles.emptySubtext}>Toque no + para adicionar</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/transaction/new')}
      >
        <MaterialCommunityIcons name="plus" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  balanceCard: {
    marginHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  balanceItemLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
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
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  transactionCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
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
