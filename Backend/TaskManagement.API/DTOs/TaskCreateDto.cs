// Kullanıcıdan yeni görev alırken kullanılacak veriler

using System.ComponentModel.DataAnnotations;
using TaskManagement.API.Models;

namespace TaskManagement.API.DTOs
{
    public class TaskCreateDto
    {
        [Required(ErrorMessage = "Görev adı zorunludur.")]
        public required string Title { get; set; }
        public string? Description { get; set; }
        [Range(1, 5, ErrorMessage = "Öncelik 1 ile 5 arasında olmalıdır.")]
        public int? Priority { get; set; } // Opsiyonel yapılabilir
        public Models.TaskStatus? Status { get; set; } // Belirtilmezse Pending varsayılır
        public DateTime? DueDate { get; set; } // Opsiyonel yapılabilir
        public Guid? CategoryId { get; set; }
    }
}