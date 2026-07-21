// Tüm kategori işlemlerini gerçekleştiren DTO sınıfları

namespace TaskManagement.API.DTOs
{
    public class CategoryCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Color { get; set; } = "#007bff"; // Varsayılan mavi renk
    }

    public class CategoryUpdateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Color { get; set; } = "#007bff";
    }

    public class CategoryResponseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Color { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}