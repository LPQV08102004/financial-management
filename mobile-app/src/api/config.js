import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '8000';
const API_PREFIX = process.env.EXPO_PUBLIC_API_PREFIX || '/api/v1';

function sanitizeBaseUrl(url) {
  if (!url) {
    return null;
  }
  return url.replace(/\/+$/, '');
}

function getExpoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    null;

  return hostUri ? hostUri.split(':')[0] : null;
}

export function getApiBaseUrl() {
  const envBaseUrl = sanitizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envBaseUrl) {
    return envBaseUrl;
  }

  const expoHost = getExpoHost();
  if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
    return `http://${expoHost}:${API_PORT}${API_PREFIX}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}${API_PREFIX}`;
  }

  return `http://127.0.0.1:${API_PORT}${API_PREFIX}`;
}

export const API_BASE_URL = getApiBaseUrl();