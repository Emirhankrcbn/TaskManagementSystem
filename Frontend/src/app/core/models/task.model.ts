import { Category } from './category.model';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'Bekliyor' | 'Devam Ediyor' | 'Tamamlandı' | 'İptal Edildi'; 
  priority: 'Düşük' | 'Orta' | 'Yüksek';
  categoryId?: number; 
  category?: Category; // API'den kategori detayları gelirse diye
  dueDate?: string | Date; 
  createdAt?: string | Date;
}