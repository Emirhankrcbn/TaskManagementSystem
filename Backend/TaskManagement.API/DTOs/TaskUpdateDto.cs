using System.ComponentModel.DataAnnotations;
using TaskManagement.API.Models;

namespace TaskManagement.API.DTOs
{
    public class TaskUpdateDto
    {
        [Required(ErrorMessage = "Görev adı zorunludur.")]
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        [EnumDataType(typeof(Priority), ErrorMessage = "Geçersiz öncelik değeri.")]
        public Priority Priority { get; set; }
        [EnumDataType(typeof(Models.TaskStatus), ErrorMessage = "Geçersiz durum değeri.")]
        public Models.TaskStatus Status { get; set; }
        public DateTime? DueDate { get; set; }
        public Guid? CategoryId { get; set; }
    }
}