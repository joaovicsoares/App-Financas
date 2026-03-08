import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert('Erro', 'Preencha todos os campos.');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || 'Email ou senha inválidos.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <MaterialCommunityIcons name="wallet" size={64} color={Colors.primary} />
                <Text style={styles.title}>Finanças</Text>
                <Text style={styles.subtitle}>Controle suas finanças com facilidade</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={Colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Senha"
                        placeholderTextColor={Colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <MaterialCommunityIcons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={Colors.textMuted}
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Entrar</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => router.push('/(auth)/register')}
                >
                    <Text style={styles.linkText}>
                        Não tem uma conta? <Text style={styles.linkAccent}>Criar conta</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 16,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 8,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        height: 54,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: Colors.text,
        fontSize: 16,
    },
    button: {
        backgroundColor: Colors.primary,
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    linkText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    linkAccent: {
        color: Colors.primary,
        fontWeight: '600',
    },
});
