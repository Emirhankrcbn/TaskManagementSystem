// Alt görevler (Checklist) için interface
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
  
  // --- DETAY ÖZELLİKLERİ ---
  description?: string;      // Görev açıklaması
  subTasks?: SubTask[];      // Alt başlıklar
  startDate?: Date | null;   // Başlama tarihi
  endDate?: Date | null;     // Bitiş tarihi
}