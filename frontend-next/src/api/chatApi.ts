// src/api/chatApi.ts
import Cookies from 'js-cookie';
import { 
  ChatMessage, 
  ChatResponse, 
  SavingsParseResponse, 
  TransactionParseResponse 
} from '../types/chat';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const ACCESS_TOKEN_KEY = 'access_token';

async function _headers(): Promise<HeadersInit> {
  const token = Cookies.get(ACCESS_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Gửi tin nhắn đến trợ lý tài chính AI */
export async function sendChatMessage(message: string, history: ChatMessage[] = []): Promise<string> {
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

  const data: ChatResponse = await res.json();
  return data.reply;
}

/** Phân tích ngôn ngữ tự nhiên cho các thao tác tiết kiệm */
export async function parseSavingsAction(message: string): Promise<SavingsParseResponse> {
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

/** Phân tích ngôn ngữ tự nhiên cho các mô tả giao dịch */
export async function parseTransaction(message: string): Promise<TransactionParseResponse> {
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