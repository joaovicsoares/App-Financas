import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const INVESTMENT_TYPES = [
    { value: 0, label: 'CDB', icon: 'bank' },
    { value: 1, label: 'LCI', icon: 'home-city' },
    { value: 2, label: 'LCA', icon: 'sprout' },
    { value: 3, label: 'Tesouro Pré', icon: 'shield-star' },
    { value: 4, label: 'Tesouro Selic', icon: 'shield-check' },
    { value: 5, label: 'Outro', icon: 'chart-line' },
];

export default function NewInvestmentScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [type, setType] = useState(0);
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('');
    const [notes, setNotes] = useState('');
    const [deductFromBalance, setDeductFromBalance] = useState(true);
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        if (!name.trim() || !amount || !rate) {
            Alert.alert('Erro', 'Preencha o nome, valor e taxa.');
            return;
        }

        const parsedAmount = parseFloat(amount.replace(',', '.'));
        const parsedRate = parseFloat(rate.replace(',', '.')) / 100;

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert('Erro', 'Insira um valor válido.');
            return;
        }

        if (isNaN(parsedRate) || parsedRate <= 0) {
            Alert.alert('Erro', 'Insira uma taxa válida.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/investments', {
                name,
                type,
                amountInvested: parsedAmount,
                annualRate: parsedRate,
                startDate: new Date().toISOString(),
                notes,
                deductFromBalance,
            });
            router.back();
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao salvar investimento.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="close" size={28} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Novo Investimento</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Type Selector */}
                <Text style={styles.sectionTitle}>Tipo</Text>
                <View style={styles.typesGrid}>
                    {INVESTMENT_TYPES.map((t) => (
                        <TouchableOpacity
                            key={t.value}
                            style={[
                                styles.typeItem,
                                type === t.value && styles.typeItemActive,
                            ]}
                            onPress={() => setType(t.value)}
                        >
                            <MaterialCommunityIcons
                                name={t.icon as any}
                                size={24}
                                color={type === t.value ? Colors.white : Colors.primary}
                            />
                            <Text
                                style={[
                                    styles.typeLabel,
                                    type === t.value && styles.typeLabelActive,
                                ]}
                            >
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Name */}
                <Text style={styles.sectionTitle}>Nome</Text>
                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="text" size={20} color={Colors.textMuted} style={{ marginRight: 12 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: CDB Banco X"
                        placeholderTextColor={Colors.textMuted}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Amount */}
                <Text style={styles.sectionTitle}>Valor investido</Text>
                <View style={styles.amountContainer}>
                    <Text style={styles.currencySign}>R$</Text>
                    <TextInput
                        style={styles.amountInput}
                        placeholder="0,00"
                        placeholderTextColor={Colors.textMuted}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                    />
                </View>

                {/* Rate */}
                <Text style={styles.sectionTitle}>Taxa anual</Text>
                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="percent" size={20} color={Colors.textMuted} style={{ marginRight: 12 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 14"
                        placeholderTextColor={Colors.textMuted}
                        value={rate}
                        onChangeText={setRate}
                        keyboardType="decimal-pad"
                    />
                    <Text style={styles.rateHint}>% a.a.</Text>
                </View>

                {/* Notes */}
                <Text style={styles.sectionTitle}>Observações (opcional)</Text>
                <View style={[styles.inputContainer, { height: 80, alignItems: 'flex-start', paddingVertical: 12 }]}>
                    <TextInput
                        style={[styles.input, { textAlignVertical: 'top' }]}
                        placeholder="Notas sobre este investimento"
                        placeholderTextColor={Colors.textMuted}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                    />
                </View>

                {/* Deduct from Balance */}
                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>Descontar do saldo</Text>
                        <Text style={styles.toggleHint}>Criar despesa automática no seu orçamento</Text>
                    </View>
                    <Switch
                        value={deductFromBalance}
                        onValueChange={setDeductFromBalance}
                        trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                        thumbColor={deductFromBalance ? Colors.primary : Colors.textMuted}
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={styles.saveBtnText}>Salvar Investimento</Text>
                    )}
                </TouchableOpacity>
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
        paddingTop: 60,
        paddingBottom: 16,
    },
    headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
    content: { paddingHorizontal: 24, paddingBottom: 40 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 10,
        marginTop: 8,
    },
    typesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    typeItem: {
        width: '30%',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 6,
    },
    typeItemActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    typeLabel: { fontSize: 11, color: Colors.text, textAlign: 'center', fontWeight: '500' },
    typeLabelActive: { color: Colors.white },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        height: 54,
        marginBottom: 16,
    },
    input: { flex: 1, color: Colors.text, fontSize: 16 },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    currencySign: { fontSize: 24, fontWeight: '600', color: Colors.textSecondary, marginRight: 8 },
    amountInput: { fontSize: 42, fontWeight: '700', color: Colors.income, minWidth: 100, textAlign: 'center' },
    rateHint: { fontSize: 14, color: Colors.textMuted, marginLeft: 8 },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    toggleLabel: { fontSize: 15, fontWeight: '500', color: Colors.text },
    toggleHint: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    saveBtn: {
        backgroundColor: Colors.primary,
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
