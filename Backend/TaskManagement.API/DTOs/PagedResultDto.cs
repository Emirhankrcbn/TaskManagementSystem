// kullanıcıya döneceğimiz sonuç paketi

namespace TaskManagement.API.DTOs
{
    public class PagedResultDto<T>
    {
        public List<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; } // Veritabanındaki toplam filtrelenmiş kayıt sayısı
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    }
}