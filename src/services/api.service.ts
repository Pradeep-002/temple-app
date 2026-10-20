import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Live HTTPS Tunnel URL for mobile app (Bypasses Windows Firewall and Wi-Fi AP isolation)
const TUNNEL_URL = 'https://neat-pets-check.loca.lt/api';
const LOCAL_WIFI_URL = 'http://10.222.153.17:8082/api';

export const API_URL = Platform.select({
  web: 'http://localhost:8082/api',
  android: TUNNEL_URL,
  ios: TUNNEL_URL,
  default: TUNNEL_URL,
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
    'Bypass-Tunnel-Reminder': 'true',
  };

  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  if (session?.sangamId) {
    headers['X-Sangam-ID'] = session.sangamId;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const rawText = await response.text();
    try {
      return JSON.parse(rawText);
    } catch {
      return {
        success: false,
        message: rawText || `HTTP ${response.status}`,
        data: null,
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
};
