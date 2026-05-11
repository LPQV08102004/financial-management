
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface AnalyticsParams {
  period?: AnalyticsPeriod;
  date?: string;
  from_date?: string;
  to_date?: string;
  type?: 'income' | 'expense';
}

export interface BalanceResponse {
  total_balance: number;
  total_income: number;
  total_expense: number;
  currency?: string;
}

export interface CategoryStat {
  category_id: string;
  category_name: string;
  amount: number;
  percentage: number;
  color?: string;
}

export interface OverTimeStat {
  label: string;
  income: number;
  expense: number;
}