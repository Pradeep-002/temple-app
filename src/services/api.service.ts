import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 1. IP Configuration:
// - Physical Phone via Expo Go on Wi-Fi: use your laptop Wi-Fi IP (e.g. '10.222.153.17')
// - Android Studio Emulator: use '10.0.2.2'
// - Web Browser preview: use 'localhost'
const LAPTOP_WIFI_IP = '10.222.153.17'; 

export const API_URL = Platform.select({
  web: 'http://localhost:8082/api',
  android: `http://${LAPTOP_WIFI_IP}:8082/api`,
  ios: `http://${LAPTOP_WIFI_IP}:8082/api`,
  default: `http://${LAPTOP_WIFI_IP}:8082/api`,
});

export interface UserSession {
  token: string;
  userId: string;
  name: string;
  mobileNumber: string;
  role: 'SUPER_ADMIN' | 'SANGAM_ADMIN' | 'COLLECTOR' | 'MEMBER';
  sangamId: string;
  sangamName: string;
  slogan?: string;
  memberCode?: string;
  email?: string;
  address?: string;
  profileImageUrl?: string;
}

export const getMediaUrl = (path?: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const base = API_URL.replace(/\/api$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const saveUserSession = async (session: UserSession) => {
  const json = JSON.stringify(session);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('user_session', json);
    }
  } else {
    await SecureStore.setItemAsync('user_session', json);
  }
};

export const getUserSession = async (): Promise<UserSession | null> => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem('user_session');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }
  const data = await SecureStore.getItemAsync('user_session');
  return data ? JSON.parse(data) : null;
};

export const clearUserSession = async () => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user_session');
    }
  } else {
    await SecureStore.deleteItemAsync('user_session');
  }
};

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
  const session = await getUserSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json();
};
