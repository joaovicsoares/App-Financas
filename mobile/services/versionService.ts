import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import api from './api';

export interface VersionInfo {
    latestVersion: string;
    downloadUrl: string;
}

export const VersionService = {
    async checkUpdate(): Promise<VersionInfo | null> {
        try {
            const response = await api.get<VersionInfo>('/version/check');
            const { latestVersion, downloadUrl } = response.data;

            const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

            if (this.isNewerVersion(latestVersion, currentVersion)) {
                return { latestVersion, downloadUrl };
            }

            return null;
        } catch (error) {
            console.error('Failed to check for updates:', error);
            return null;
        }
    },

    isNewerVersion(latest: string, current: string): boolean {
        const latestParts = latest.split('.').map(Number);
        const currentParts = current.split('.').map(Number);

        for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
            const latestPart = latestParts[i] || 0;
            const currentPart = currentParts[i] || 0;

            if (latestPart > currentPart) return true;
            if (latestPart < currentPart) return false;
        }

        return false;
    },

    async downloadAndInstall(url: string) {
        try {
            const filename = 'app-update.apk';
            const fileUri = `${FileSystem.cacheDirectory}${filename}`;

            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                fileUri,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    console.log(`Download progress: ${Math.round(progress * 100)}%`);
                }
            );

            const result = await downloadResumable.downloadAsync();

            if (result && result.uri) {
                const contentUri = await FileSystem.getContentUriAsync(result.uri);

                await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
                    data: contentUri,
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                });
            }
        } catch (error) {
            console.error('Failed to download or install update:', error);
            Alert.alert('Erro', 'Não foi possível baixar ou instalar a atualização.');
        }
    }
};
