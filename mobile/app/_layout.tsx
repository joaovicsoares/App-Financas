import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants';
import { ActivityIndicator, View } from 'react-native';
import { getDB } from '@/services/database';
import { startAutoSync } from '@/services/sync/syncEngine';
import { VersionService } from '@/services/versionService';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }

    // Initialize DB and sync when authenticated
    if (isAuthenticated) {
      getDB(); // ensures schema is created
      if (user?.userId) {
        startAutoSync(user.userId);
      }
      checkAppVersion();
    }
  }, [isAuthenticated, isLoading, segments]);

  async function checkAppVersion() {
    const update = await VersionService.checkUpdate();
    if (update) {
      Alert.alert(
        'Nova Versão Disponível',
        `Uma nova versão (${update.latestVersion}) está disponível. Deseja atualizar agora?`,
        [
          { text: 'Depois', style: 'cancel' },
          {
            text: 'Atualizar',
            onPress: () => VersionService.downloadAndInstall(update.downloadUrl),
          },
        ]
      );
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="transaction/new" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="transaction/[id]" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="wallet/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="investment/new" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="investment/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
