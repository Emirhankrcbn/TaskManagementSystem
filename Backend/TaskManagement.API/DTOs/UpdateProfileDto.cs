// Kullanıcı sadece adını ve soyadını güncellemek istediğinde frontend'den gelecek verileri karşılayacak model

namespace TaskManagement.API.DTOs
{
    public class UpdateProfileDto
    {
        public string? Username { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        
        public string? Email { get; set; }
        public string? CurrentPassword { get; set; } // Güvenlik için eski şifre
        public string? NewPassword { get; set; }     // Yeni istenen şifre
    }
}