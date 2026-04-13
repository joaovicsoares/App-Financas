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
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants';
import api from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SharedWallet {
    id: string;
    name: string;
    createdAt: string;
    members: WalletMember[];
}

interface WalletMember {
    userId: string;
    name: string;
    email: string;
    role: number;
    joinedAt: string;
}

export default function WalletScreen() {
    const router = useRouter();
    const [wallets, setWallets] = useState<SharedWallet[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

    const loadWallets = useCallback(async () => {
        try {
            const response = await api.get('/sharedwallets');
            setWallets(response.data);
        } catch (error) {
            console.error('Error loading wallets:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadWallets();
        }, [loadWallets])
    );

    async function onRefresh() {
        setRefreshing(true);
        await loadWallets();
        setRefreshing(false);
    }

    async function handleCreate() {
        if (!newName.trim()) return;
        try {
            await api.post('/sharedwallets', { name: newName });
            setNewName('');
            setShowCreate(false);
            loadWallets();
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar carteira.');
        }
    }

    async function handleInvite(walletId: string) {
        if (!inviteEmail.trim()) return;
        try {
            await api.post(`/sharedwallets/${walletId}/invite`, { email: inviteEmail });
            setInviteEmail('');
            setSelectedWallet(null);
            Alert.alert('Sucesso', 'Membro convidado com sucesso!');
            loadWallets();
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao convidar membro.');
        }
    }

    async function handleDelete(walletId: string) {
        Alert.alert('Excluir', 'Tem certeza que deseja excluir esta carteira?', [
            { text: 'Cancelar' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/sharedwallets/${walletId}`);
                        loadWallets();
                    } catch (error: any) {
                        Alert.alert('Erro', error.response?.data?.message || 'Erro ao excluir.');
                    }
                },
            },
        ]);
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Carteira Compartilhada</Text>
                <TouchableOpacity onPress={() => setShowCreate(!showCreate)}>
                    <MaterialCommunityIcons
                        name={showCreate ? 'close' : 'plus-circle'}
                        size={28}
                        color={Colors.primary}
                    />
                </TouchableOpacity>
            </View>

            {showCreate && (
                <View style={styles.createBox}>
                    <TextInput
                        style={styles.createInput}
                        placeholder="Nome da carteira (ex: Casal)"
                        placeholderTextColor={Colors.textMuted}
                        value={newName}
                        onChangeText={setNewName}
                    />
                    <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                        <Text style={styles.createBtnText}>Criar</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={wallets}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="account-group" size={48} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>Nenhuma carteira compartilhada</Text>
                        <Text style={styles.emptySubtext}>Crie uma para compartilhar gastos</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.walletCard}
                        onPress={() => router.push(`/wallet/${item.id}` as any)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.walletHeader}>
                            <View style={styles.walletIconBox}>
                                <MaterialCommunityIcons name="wallet-outline" size={24} color={Colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.walletName}>{item.name}</Text>
                                <Text style={styles.walletMembers}>{item.members.length} membro(s)</Text>
                            </View>
                            <TouchableOpacity
                                onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.expense} />
                            </TouchableOpacity>
                        </View>

                        {/* Members */}
                        {item.members.map((m) => (
                            <View key={m.userId} style={styles.memberRow}>
                                <MaterialCommunityIcons name="account" size={18} color={Colors.textSecondary} />
                                <Text style={styles.memberName}>{m.name}</Text>
                                <Text style={styles.memberRole}>
                                    {m.role === 0 ? 'Dono' : 'Membro'}
                                </Text>
                            </View>
                        ))}

                        {/* Open details hint */}
                        <View style={styles.openDetailsHint}>
                            <MaterialCommunityIcons name="arrow-right-circle-outline" size={18} color={Colors.primary} />
                            <Text style={styles.openDetailsText}>Ver detalhes e transações</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
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
    title: { fontSize: 28, fontWeight: '700', color: Colors.text },
    createBox: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 10,
        marginBottom: 16,
    },
    createInput: {
        flex: 1,
        backgroundColor: Colors.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        height: 48,
        color: Colors.text,
        fontSize: 15,
    },
    createBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    createBtnText: { color: Colors.white, fontWeight: '600' },
    list: { paddingHorizontal: 24, paddingBottom: 100 },
    walletCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    walletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    walletIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletName: { fontSize: 17, fontWeight: '600', color: Colors.text },
    walletMembers: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    memberName: { flex: 1, fontSize: 14, color: Colors.text },
    memberRole: { fontSize: 12, color: Colors.textMuted },
    inviteBox: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
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
    inviteLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    inviteLinkText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
    openDetailsHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    openDetailsText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 12 },
    emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
});
