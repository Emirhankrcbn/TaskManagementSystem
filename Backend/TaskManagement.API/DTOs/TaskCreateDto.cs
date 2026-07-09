// Kullanıcıdan yeni görev alırken kullanılacak veriler

using TaskManagement.API.Models;

namespace TaskManagement.API.DTOs
{
    public class TaskCreateDto
    {
        public required string Title { get; set; }
        public string? Description { get; set; }
        public int? Priority { get; set; } // Opsiyonel yapılabilir
        public DateTime? DueDate { get; set; } // Opsiyonel yapılabilir
        public Guid? CategoryId { get; set; } 
    }
}