import { Category } from './category.model';

export interface SubTask {
  id?: string;
  taskId?: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
}

export interface Task {
  id?: string;
  title: string;

  // METİN YERİNE SAYI OLARAK GÜNCELLENDİ (Backend Enum Uyumlu)
  status: number;
  priority?: number;

  description?: string;
  subTasks?: SubTask[];
  startDate?: Date | null;
  endDate?: Date | null;
  dueDate?: string | null;
  createdAt?: string;

  categoryId?: string;
  category?: Category;
}

export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Görevin alt görev (checklist) tamamlanma yüzdesini hesaplar; alt görev yoksa null döner
export function getSubtaskProgress(task: Task): { completed: number; total: number; percent: number } | null {
  if (!task.subTasks || task.subTasks.length === 0) return null;
  const total = task.subTasks.length;
  const completed = task.subTasks.filter(st => st.completed).length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}