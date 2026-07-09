// kullanıcıdan gelen arama talepleri

namespace TaskManagement.API.DTOs
{
    public class TaskFilterDto
    {
        public string? SearchTerm { get; set; } // Başlık veya açıklamada kelime arama
        public Guid? CategoryId { get; set; }
        public Models.TaskStatus? Status { get; set; }
        public Models.Priority? Priority { get; set; }

        // Sayfalama (Varsayılan olarak 1. sayfa ve 10 kayıt)
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        // Sıralama
        public string? SortBy { get; set; } // "DueDate", "Priority" veya "CreatedAt" olabilir
        public bool IsDescending { get; set; } = true; // Varsayılan olarak en yeniler/en aciller üstte
    }
}