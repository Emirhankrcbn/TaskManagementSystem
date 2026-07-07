// Tüm kategori işlemlerini gerçekleştiren DTO sınıfları

namespace TaskManagement.API.DTOs
{
    public class CategoryCreateDto
    {
        public string Name { get; set; } = string.Empty;
    }

    public class CategoryUpdateDto
    {
        public string Name { get; set; } = string.Empty;
    }

    public class CategoryResponseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid UserId { get; set; }
    }
}