
export interface SavingsGoal {
  id: string | number;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string;
  note?: string;
  created_at?: string;
}

export interface SavingsListResponse {
  items: SavingsGoal[];
  total_locked: number;
}

export interface CreateGoalPayload {
  name: string;
  target_amount: number;
  deadline: string;
  note?: string;
}

export interface GoalTransactionPayload {
  amount: number;
  account_id: string | number;
  transaction_date: string;
}