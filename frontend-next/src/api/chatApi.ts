// src/api/chatApi.ts
import { API_BASE_URL } from './config';
import { 
  ChatMessage, 
  ChatResponse, 
  SavingsParseResponse, 
  TransactionParseResponse 
} from '../types/chat';
import { apiFetch } from './authApi';

/** Gửi tin nhắn đến trợ lý tài chính AI */
export async function sendChatMessage(message: string, history: ChatMessage[] = []): Promise<string> {
  const res = await apiFetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
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
  const res = await apiFetch(`${API_BASE_URL}/chat/parse-savings`, {
    method: 'POST',
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
  const res = await apiFetch(`${API_BASE_URL}/chat/parse-transaction`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Không thể phân tích giao dịch');
  }

  return res.json();
}