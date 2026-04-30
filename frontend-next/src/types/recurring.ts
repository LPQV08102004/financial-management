// src/types/recurring.ts

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTemplate {
  id: string | number;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: RecurringFrequency;
  start_date: string;
  next_run_date?: string;
  category_id: string | number;
  account_id: string | number;
  note?: string;
}

export interface CreateRecurringPayload {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: RecurringFrequency;
  start_date: string;
  category_id: string | number;
  account_id: string | number;
  note?: string;
}

export interface UpcomingOccurrence {
  template_id: string | number;
  template_name: string;
  scheduled_date: string;
  amount: number;
}

export interface GenerateResult {
  generated_count: number;
  transactions: any[]; // Bạn có thể thay bằng Transaction[] nếu đã định nghĩa
}