
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string | number;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  note?: string;
  account_id: string | number;
  category_id?: string | number;
  created_at?: string;
}

export interface TransactionListParams {
  type?: TransactionType;
  account_id?: string | number;
  category_id?: string | number;
  from_date?: string;
  to_date?: string;
  q?: string;
  skip?: number;
  limit?: number;
}

export interface TransactionListResponse {
  items: Transaction[];
  total_count: number;
  total_amount: number;
}

export interface CreateTransactionPayload {
  account_id: string | number;
  amount: number;
  transaction_date: string;
  note?: string;
  category_id?: string | number;
}