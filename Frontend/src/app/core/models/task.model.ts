export interface SubTask {
  id: number;
  title: string;
  completed: boolean;
}

export interface Task {
  id: number;
  title: string;
  status: 'Bekliyor' | 'Devam Ediyor' | 'Tamamlandı' | 'İptal Edildi';
  priority?: string;
  description?: string;
  subTasks?: SubTask[];
  startDate?: Date | null;
  endDate?: Date | null;
}