
export type AccountType = 'checking' | 'savings' | 'cash' | 'credit_card' | 'investment' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  current_balance: number;
  note?: string;
  created_at?: string;
}

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
  current_balance?: number;
  note?: string;
}