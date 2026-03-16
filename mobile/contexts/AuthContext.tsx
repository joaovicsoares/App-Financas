import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '@/services/api';

interface User {
    userId: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredToken();
    }, []);

    async function loadStoredToken() {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (token) {
                const response = await api.get('/auth/me');
                setUser(response.data);
            }
        } catch {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('refreshToken');
        } finally {
            setIsLoading(false);
        }
    }

    async function login(email: string, password: string) {
        const response = await api.post('/auth/login', { email, password });
        const { token, refreshToken, userName, email: userEmail, userId } = response.data;
        await SecureStore.setItemAsync('token', token);
        await SecureStore.setItemAsync('refreshToken', refreshToken);
        setUser({ userId, name: userName, email: userEmail });
    }

    async function register(name: string, email: string, password: string) {
        const response = await api.post('/auth/register', { name, email, password });
        const { token, refreshToken, userName, email: userEmail, userId } = response.data;
        await SecureStore.setItemAsync('token', token);
        await SecureStore.setItemAsync('refreshToken', refreshToken);
        setUser({ userId, name: userName, email: userEmail });
    }

    async function logout() {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('refreshToken');
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
