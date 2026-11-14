export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string;
}

export type FilterType = 'all' | 'active' | 'completed';
