import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await SecureStore.getItemAsync('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { token, refreshToken: newRefreshToken } = response.data;

                await SecureStore.setItemAsync('token', token);
                await SecureStore.setItemAsync('refreshToken', newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                await SecureStore.deleteItemAsync('token');
                await SecureStore.deleteItemAsync('refreshToken');
                // Could potentially trigger a logout event here if there's a listener
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
