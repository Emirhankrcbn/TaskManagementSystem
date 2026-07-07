// Kullanicilarin gorevlere yapacagi yorumlari tutan model.

namespace TaskManagement.API.Models
{
    public class TaskComment
    {
        public Guid Id { get; set; }
        public Guid TaskId { get; set; }
        public Guid UserId { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public TaskItem? Task { get; set; }
        public User? User { get; set; }
    }
}