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
import { useSafeSpacing } from '@/hooks/use-safe-spacing';

interface DashboardData {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  recentTransactions: Transaction[];
  topExpenseCategories?: CategoryExpense[];
  monthComparison?: MonthComparison;
  dailyAverageExpense?: number;
  projectedMonthExpense?: number;
  daysRemainingInMonth?: number;
  expensesByDayOfWeek?: DayOfWeekExpense[];
}

interface CategoryExpense {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

interface MonthComparison {
  previousMonthExpenses: number;
  currentMonthExpenses: number;
  difference: number;
  percentageChange: number;
}

interface DayOfWeekExpense {
  dayName: string;
  dayNumber: number;
  totalAmount: number;
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
  const { headerPaddingTop, tabListPaddingBottom, floatingBottom } = useSafeSpacing();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api.get('/dashboard');
      console.log('Dashboard response:', JSON.stringify(response.data, null, 2));
      setData(response.data);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      console.error('Error details:', error.response?.data);
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
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
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

        {/* Month Comparison Card */}
        {data?.monthComparison && data.monthComparison.currentMonthExpenses !== undefined && (
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <MaterialCommunityIcons name="chart-line" size={20} color={Colors.primary} />
              <Text style={styles.comparisonTitle}>Comparação com mês anterior</Text>
            </View>
            <View style={styles.comparisonContent}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Mês anterior</Text>
                <Text style={styles.comparisonValue}>{formatCurrency(data.monthComparison.previousMonthExpenses || 0)}</Text>
              </View>
              <MaterialCommunityIcons 
                name="arrow-right"
                size={24} 
                color={Colors.textMuted} 
              />
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Este mês</Text>
                <Text style={styles.comparisonValue}>{formatCurrency(data.monthComparison.currentMonthExpenses || 0)}</Text>
              </View>
            </View>
            <View style={[
              styles.comparisonBadge, 
              { backgroundColor: (data.monthComparison.difference || 0) > 0 ? Colors.expense + '15' : Colors.income + '15' }
            ]}>
              <MaterialCommunityIcons 
                name={(data.monthComparison.difference || 0) > 0 ? "arrow-up" : "arrow-down"} 
                size={16} 
                color={(data.monthComparison.difference || 0) > 0 ? Colors.expense : Colors.income} 
              />
              <Text style={[
                styles.comparisonBadgeText,
                { color: (data.monthComparison.difference || 0) > 0 ? Colors.expense : Colors.income }
              ]}>
                {Math.abs(data.monthComparison.percentageChange || 0).toFixed(1)}% 
                {(data.monthComparison.difference || 0) > 0 ? ' a mais' : ' a menos'}
              </Text>
            </View>
          </View>
        )}

        {/* Insights Cards Row */}
        <View style={styles.insightsRow}>
          <View style={styles.insightCard}>
            <MaterialCommunityIcons name="calendar-today" size={24} color={Colors.primary} />
            <Text style={styles.insightValue}>{data?.daysRemainingInMonth ?? 0}</Text>
            <Text style={styles.insightLabel}>dias restantes</Text>
          </View>
          <View style={styles.insightCard}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color={Colors.expense} />
            <Text style={styles.insightValue}>{formatCurrency(data?.dailyAverageExpense ?? 0)}</Text>
            <Text style={styles.insightLabel}>média/dia</Text>
          </View>
        </View>

        {/* Projection Card */}
        {data && (data.projectedMonthExpense || 0) > 0 && (
          <View style={styles.projectionCard}>
            <View style={styles.projectionHeader}>
              <MaterialCommunityIcons name="crystal-ball" size={20} color={Colors.primary} />
              <Text style={styles.projectionTitle}>Projeção do mês</Text>
            </View>
            <Text style={styles.projectionValue}>{formatCurrency(data.projectedMonthExpense || 0)}</Text>
            <Text style={styles.projectionSubtext}>
              Baseado na média de {formatCurrency(data.dailyAverageExpense || 0)}/dia
            </Text>
          </View>
        )}

        {/* Top Categories */}
        {data?.topExpenseCategories && data.topExpenseCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maiores Gastos por Categoria</Text>
            {data.topExpenseCategories.map((cat, index) => (
              <View key={index} style={styles.categoryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: cat.categoryColor + '20' }]}>
                  <MaterialCommunityIcons
                    name={(cat.categoryIcon as any) || 'tag'}
                    size={20}
                    color={cat.categoryColor}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.categoryName}</Text>
                  <View style={styles.categoryBar}>
                    <View 
                      style={[
                        styles.categoryBarFill, 
                        { width: `${cat.percentage}%`, backgroundColor: cat.categoryColor }
                      ]} 
                    />
                  </View>
                  <Text style={styles.categoryCount}>{cat.transactionCount} transações</Text>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={styles.categoryValue}>{formatCurrency(cat.totalAmount)}</Text>
                  <Text style={styles.categoryPercentage}>{cat.percentage.toFixed(1)}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Expenses by Day of Week */}
        {data?.expensesByDayOfWeek && data.expensesByDayOfWeek.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gastos por Dia da Semana</Text>
            <View style={styles.dayOfWeekContainer}>
              {data.expensesByDayOfWeek.map((day) => {
                const maxAmount = Math.max(...data.expensesByDayOfWeek!.map(d => d.totalAmount || 0));
                const heightPercentage = maxAmount > 0 ? ((day.totalAmount || 0) / maxAmount) * 100 : 0;
                return (
                  <View key={day.dayNumber} style={styles.dayOfWeekItem}>
                    <View style={styles.dayOfWeekBar}>
                      <View 
                        style={[
                          styles.dayOfWeekBarFill, 
                          { height: `${heightPercentage}%`, backgroundColor: Colors.primary }
                        ]} 
                      />
                    </View>
                    <Text style={styles.dayOfWeekLabel}>{(day.dayName || '').substring(0, 3)}</Text>
                    <Text style={styles.dayOfWeekAmount}>{formatCurrency(day.totalAmount || 0)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={[styles.section, { paddingBottom: tabListPaddingBottom }]}>
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
        style={[styles.fab, { bottom: floatingBottom }]}
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
  comparisonCard: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  comparisonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  comparisonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  comparisonItem: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  comparisonBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  insightsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 16,
    gap: 12,
  },
  insightCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  insightLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  projectionCard: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  projectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  projectionValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.expense,
    marginBottom: 4,
  },
  projectionSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  categoryBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryCount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  categoryAmount: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  categoryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryPercentage: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dayOfWeekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayOfWeekItem: {
    flex: 1,
    alignItems: 'center',
  },
  dayOfWeekBar: {
    width: 32,
    height: 100,
    backgroundColor: Colors.border,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  dayOfWeekBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  dayOfWeekLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  dayOfWeekAmount: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 32,
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
