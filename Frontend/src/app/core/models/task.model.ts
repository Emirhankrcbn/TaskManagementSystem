import { Category } from './category.model';

export interface SubTask {
  id?: string;
  title: string;
  completed: boolean;
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
  
  categoryId?: string; 
  category?: Category; 
}