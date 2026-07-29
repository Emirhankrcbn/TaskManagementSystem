// Kullanıcı giriş yaparken alınacak veriler

using System.ComponentModel.DataAnnotations;

namespace TaskManagement.API.DTOs
{
    public class UserLoginDto
    {
        [Required(ErrorMessage = "E-posta zorunludur.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre zorunludur.")]
        public string Password { get; set; } = string.Empty;
    }
}