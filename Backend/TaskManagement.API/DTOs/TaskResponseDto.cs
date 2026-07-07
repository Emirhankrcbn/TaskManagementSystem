// Kullanıcıya görev bilgisi gönderirken kullanılacak, şifre vb. içermeyen temiz veri

using TaskManagement.API.Models;

namespace TaskManagement.API.DTOs
{
    public class TaskResponseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Priority Priority { get; set; }
        public Models.TaskStatus Status { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}