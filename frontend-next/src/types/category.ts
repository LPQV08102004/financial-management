
export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string | number;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  description?: string;
}

export interface CategoryPayload {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  description?: string;
}