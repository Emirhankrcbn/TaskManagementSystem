// kullanıcının göndereceği yorum verisini ve ona yanıt verisini tutacak DTO'lar

namespace TaskManagement.API.DTOs
{
    // Kullanıcının yorum yaparken göndereceği veri (sadece metin)
    public class TaskCommentCreateDto
    {
        public required string Content { get; set; }
    }

    // Bizim kullanıcıya göstereceğimiz paket
    public class TaskCommentResponseDto
    {
        public Guid Id { get; set; }
        public Guid TaskId { get; set; }
        public Guid UserId { get; set; } 
        public required string Content { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}