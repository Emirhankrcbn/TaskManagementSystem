// Kullanıcı giriş yaparken alınacak veriler

namespace TaskManagement.API.DTOs
{
    public class UserLoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}