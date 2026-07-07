// Kullanıcıdan yeni görev alırken kullanılacak veriler

using TaskManagement.API.Models;

namespace TaskManagement.API.DTOs
{
    public class TaskCreateDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Priority Priority { get; set; }
        public DateTime? DueDate { get; set; }
        public Guid UserId { get; set; }
        public Guid? CategoryId { get; set; }
    }
}