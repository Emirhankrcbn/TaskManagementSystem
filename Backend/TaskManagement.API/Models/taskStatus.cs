// gorevlerin guncel durumlarini takip et 
// Sistemdeki diger "Status" siniflariyla karismamasi icin ismini TaskStatus olarak belirledim

namespace TaskManagement.API.Models
{
    public enum TaskStatus
    {
        Pending = 0,
        InProgress = 1,
        Completed = 2,
        Cancelled = 3
    }
}