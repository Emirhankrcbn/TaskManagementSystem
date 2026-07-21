// Kullanıcı bilgilerini veritabanından çekip frontend'e şifresiz, temiz bir şekilde gönderirken kullanacağımız model

namespace TaskManagement.API.DTOs
{
    public class UserProfileDto
    {
        public required string Username { get; set; }
        public required string Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }
}