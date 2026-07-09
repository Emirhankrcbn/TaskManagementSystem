// kullanıcıya döneceğimiz istatistik paketi

namespace TaskManagement.API.DTOs
{
    public class TaskStatisticsDto
    {
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int PendingTasks { get; set; }
    }
}