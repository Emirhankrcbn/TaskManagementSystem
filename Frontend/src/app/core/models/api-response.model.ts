// <T> yapısı, içine Task koyarsak Task listesi, User koyarsak User listesi döndürmesini sağlar.

export interface ApiResponse<T> {
  success: boolean;       // İşlem başarılı mı? (true/false)
  message: string;        // Kullanıcıya gösterilecek mesaj
  data: T;                // Asıl veri yükümüz
  totalCount?: number;    // Pagination için toplam veri sayısı
}