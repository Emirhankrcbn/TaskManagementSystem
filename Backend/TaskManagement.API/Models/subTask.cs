// Gorevlere eklenecek alt gorevleri (checklist) tutan model.

namespace TaskManagement.API.Models
{
    public class SubTask
    {
        public Guid Id { get; set; }
        public Guid TaskId { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool Completed { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public TaskItem? Task { get; set; }
    }
}
