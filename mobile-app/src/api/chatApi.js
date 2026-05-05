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

/**
 * Send a chat message to the AI financial assistant.
 */
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

/**
 * Parse a natural language savings deposit/withdraw description.
 * Returns: { action, amount, date, note, goal_suggestions, missing_fields }
 */
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

/**
 * Parse a natural language transaction description.
 * Returns: { type, amount, date, note, category_suggestions, missing_fields }
 */
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

/**
 * Extract transaction data from a receipt image via OCR.
 * @param {string} imageBase64 - Raw base64 string (no data URI prefix)
 * @param {string|null} hint - Optional store-type hint
 * Returns: { amount, merchant_name, date, raw_text, type, note, category_suggestions,
 *            confidence_level, missing_fields, warnings }
 */
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
