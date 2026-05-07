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
  return getApiBaseUrlCandidates()[0];
}

export function getApiBaseUrlCandidates() {
  const candidates = [];

  // Prefer values injected into the Expo runtime (app manifest / extra),
  // then fall back to process.env which is available in some dev setups.
  const manifestExtra =
    Constants.manifest?.extra ||
    Constants.expoConfig?.extra ||
    (Constants.manifest2 && Constants.manifest2.extra) ||
    null;

  const extraBaseUrl = manifestExtra && manifestExtra.EXPO_PUBLIC_API_BASE_URL
    ? sanitizeBaseUrl(manifestExtra.EXPO_PUBLIC_API_BASE_URL)
    : null;

  const envBaseUrl = extraBaseUrl || sanitizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envBaseUrl) {
    candidates.push(envBaseUrl);
  }

  const expoHost = getExpoHost();
  const expoHostBase = expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1'
    ? `http://${expoHost}:${API_PORT}${API_PREFIX}`
    : null;

  if (Platform.OS === 'android') {
    if (expoHostBase) {
      candidates.push(expoHostBase);
    }
    candidates.push(`http://10.0.2.2:${API_PORT}${API_PREFIX}`);
    candidates.push(`http://127.0.0.1:${API_PORT}${API_PREFIX}`);
  } else {
    if (expoHostBase) {
      candidates.push(expoHostBase);
    }
    candidates.push(`http://127.0.0.1:${API_PORT}${API_PREFIX}`);
  }

  return [...new Set(candidates.filter(Boolean))];
}

export const API_BASE_URL = getApiBaseUrl();
export const API_BASE_URL_CANDIDATES = getApiBaseUrlCandidates();