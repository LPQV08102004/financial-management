// src/types/recurring.ts

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTemplate {
  id: number;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: RecurringFrequency;
  frequency_label: string;
  start_date: string;
  end_date?: string | null;
  next_run_date: string;
  category_id?: number | null;
  category_name?: string | null;
  account_id: number;
  account_name?: string | null;
  note?: string | null;
  is_active: boolean;
}

export interface CreateRecurringPayload {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string | null;
  category_id?: number | null;
  account_id: number;
  note?: string | null;
}

export interface UpcomingOccurrence {
  template_id: number;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  category_id?: number | null;
  category_name?: string | null;
  account_id: number;
  account_name?: string | null;
  scheduled_date: string;
  frequency_label: string;
  note?: string | null;
}

export interface UpcomingListResponse {
  items: UpcomingOccurrence[];
  total_expense: number;
  total_income: number;
}

export interface GenerateResult {
  generated_count: number;
  transactions: any[];
}