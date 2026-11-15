export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string;
}

export interface LegacyTodoInput {
  id?: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string;
}

export type FilterType = 'all' | 'active' | 'completed' | 'today' | 'upcoming' | 'overdue';
