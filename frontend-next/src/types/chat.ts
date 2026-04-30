// src/types/chat.ts

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
}

export interface SavingsParseResponse {
  action: 'deposit' | 'withdraw';
  amount: number;
  date: string;
  note: string;
  goal_suggestions?: string[];
  missing_fields?: string[];
}

export interface TransactionParseResponse {
  type: 'income' | 'expense';
  amount: number;
  date: string;
  note: string;
  category_suggestions?: string[];
  missing_fields?: string[];
}