import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: number;
}

export default function NewTransactionScreen() {
    const router = useRouter();
    const [type, setType] = useState<0 | 1>(1); // 0=income, 1=expense
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    async function loadCategories() {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    const filteredCategories = categories.filter((c) => c.type === type);

    async function handleSave() {
        if (!amount || !selectedCategory) {
            Alert.alert('Erro', 'Preencha o valor e selecione uma categoria.');
            return;
        }

        const parsedAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert('Erro', 'Insira um valor válido.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/transactions', {
                categoryId: selectedCategory,
                amount: parsedAmount,
                type,
                description,
                date: new Date().toISOString(),
            });
            router.back();
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao salvar transação.');
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
                <Text style={styles.headerTitle}>Nova Transação</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Type Selector */}
                <View style={styles.typeSelector}>
                    <TouchableOpacity
                        style={[styles.typeBtn, type === 1 && styles.typeBtnExpense]}
                        onPress={() => { setType(1); setSelectedCategory(null); }}
                    >
                        <MaterialCommunityIcons name="arrow-down" size={20} color={type === 1 ? Colors.white : Colors.expense} />
                        <Text style={[styles.typeText, type === 1 && styles.typeTextActive]}>Despesa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeBtn, type === 0 && styles.typeBtnIncome]}
                        onPress={() => { setType(0); setSelectedCategory(null); }}
                    >
                        <MaterialCommunityIcons name="arrow-up" size={20} color={type === 0 ? Colors.white : Colors.income} />
                        <Text style={[styles.typeText, type === 0 && styles.typeTextActive]}>Receita</Text>
                    </TouchableOpacity>
                </View>

                {/* Amount */}
                <View style={styles.amountContainer}>
                    <Text style={styles.currencySign}>R$</Text>
                    <TextInput
                        style={[styles.amountInput, { color: type === 0 ? Colors.income : Colors.expense }]}
                        placeholder="0,00"
                        placeholderTextColor={Colors.textMuted}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                    />
                </View>

                {/* Description */}
                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="text" size={20} color={Colors.textMuted} style={{ marginRight: 12 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Descrição (opcional)"
                        placeholderTextColor={Colors.textMuted}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Categories */}
                <Text style={styles.sectionTitle}>Categoria</Text>
                <View style={styles.categoriesGrid}>
                    {filteredCategories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryItem,
                                selectedCategory === cat.id && { borderColor: cat.color, borderWidth: 2 },
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                                <MaterialCommunityIcons name={(cat.icon as any) || 'tag'} size={22} color={cat.color} />
                            </View>
                            <Text style={styles.categoryName} numberOfLines={1}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
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
                        <Text style={styles.saveBtnText}>Salvar Transação</Text>
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
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    typeBtnExpense: { backgroundColor: Colors.expense, borderColor: Colors.expense },
    typeBtnIncome: { backgroundColor: Colors.income, borderColor: Colors.income },
    typeText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
    typeTextActive: { color: Colors.white },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    currencySign: { fontSize: 28, fontWeight: '600', color: Colors.textSecondary, marginRight: 8 },
    amountInput: { fontSize: 48, fontWeight: '700', minWidth: 120, textAlign: 'center' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        height: 54,
        marginBottom: 24,
    },
    input: { flex: 1, color: Colors.text, fontSize: 16 },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 14,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 32,
    },
    categoryItem: {
        width: '30%',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: { fontSize: 11, color: Colors.text, textAlign: 'center' },
    saveBtn: {
        backgroundColor: Colors.primary,
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
