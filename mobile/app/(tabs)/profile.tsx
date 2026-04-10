import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeArea } from '@/hooks/useSafeArea';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const safeArea = useSafeArea();

    function handleLogout() {
        Alert.alert('Sair', 'Tem certeza que deseja sair?', [
            { text: 'Cancelar' },
            { text: 'Sair', style: 'destructive', onPress: logout },
        ]);
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: safeArea.paddingTop }]}>
                <Text style={styles.title}>Perfil</Text>
            </View>

            {/* User Info */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <MaterialCommunityIcons name="account" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            {/* Menu Items */}
            <View style={styles.menu}>
                <View style={styles.menuItem}>
                    <MaterialCommunityIcons name="shape" size={22} color={Colors.textSecondary} />
                    <Text style={styles.menuText}>Gerenciar Categorias</Text>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} />
                </View>

                <View style={styles.divider} />

                <View style={styles.menuItem}>
                    <MaterialCommunityIcons name="information-outline" size={22} color={Colors.textSecondary} />
                    <Text style={styles.menuText}>Sobre o App</Text>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} />
                </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={22} color={Colors.expense} />
                <Text style={styles.logoutText}>Sair da conta</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Finanças v1.0.0</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    title: { fontSize: 28, fontWeight: '700', color: Colors.text },
    profileCard: {
        alignItems: 'center',
        marginHorizontal: 24,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 28,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 24,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    userName: { fontSize: 20, fontWeight: '700', color: Colors.text },
    userEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
    menu: {
        marginHorizontal: 24,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 14,
    },
    menuText: { flex: 1, fontSize: 15, color: Colors.text },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 20,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginHorizontal: 24,
        marginTop: 32,
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.expense + '30',
    },
    logoutText: { fontSize: 15, fontWeight: '600', color: Colors.expense },
    version: {
        textAlign: 'center',
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: 32,
    },
});
