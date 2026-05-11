import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const BASE_URL = API_BASE_URL;

const ACCESS_TOKEN_KEY = 'access_token';

async function _headers() {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function sendChatMessage(message, history = []) {
  const headers = await _headers();
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Lỗi kết nối AI');
  }
  const data = await res.json();
  return data.reply;
}

export async function parseSavingsAction(message) {
  const headers = await _headers();
  const res = await fetch(`${BASE_URL}/chat/parse-savings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Không thể phân tích thao tác tiết kiệm');
  }
  return res.json();
}

export async function parseTransaction(message) {
  const headers = await _headers();
  const res = await fetch(`${BASE_URL}/chat/parse-transaction`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Không thể phân tích giao dịch');
  }
  return res.json();
}

export async function parseReceipt(imageBase64, hint = null) {
  const headers = await _headers();
  const res = await fetch(`${BASE_URL}/chat/parse-receipt`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image_base64: imageBase64, hint }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Không thể đọc hóa đơn');
  }
  return res.json();
}
