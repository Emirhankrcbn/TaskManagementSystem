using Microsoft.AspNetCore.Http;

namespace TaskManagement.API.DTOs
{
    public class TaskAttachmentUploadDto
    {
        // "required" verinin boş gelmeyecek şekilde zorunlu olmasını sağlar. Eğer boş gelirse model validation hatası döner.
        public required IFormFile File { get; set; } 
    }

    public class TaskAttachmentResponseDto
    {
        public Guid Id { get; set; }
        public required string FileName { get; set; } // string nesneleri için de aynı uyarıyı verir
        public required string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}