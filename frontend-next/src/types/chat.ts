// src/types/chat.ts

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'card' | 'savings-card' | 'text';
  parsed?: any;
  confirmed?: boolean;
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
  warning?: string | null;
}

export interface TransactionParseResponse {
  type: 'income' | 'expense';
  amount: number;
  date: string;
  note: string;
  category_suggestions?: string[];
  missing_fields?: string[];
  warning?: string | null;
}