// Alt görev (checklist) oluşturma/güncelleme isteklerini ve yanıt verisini tutan DTO'lar

namespace TaskManagement.API.DTOs
{
    public class SubTaskCreateDto
    {
        public required string Title { get; set; }
    }

    public class SubTaskUpdateDto
    {
        public required string Title { get; set; }
        public bool Completed { get; set; }
    }

    public class SubTaskResponseDto
    {
        public Guid Id { get; set; }
        public Guid TaskId { get; set; }
        public required string Title { get; set; }
        public bool Completed { get; set; }
    }
}
