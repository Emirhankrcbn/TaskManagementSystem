// arayüz

using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services
{
    public interface IUserService
    {
        // Yeni kullanıcı kaydı yapar, başarılı olursa giriş için bir metin veya token döner
        Task<string> RegisterAsync(UserRegisterDto registerDto);

        // Kullanıcı girişi yapar, başarılı olursa JWT token döner
        Task<string> LoginAsync(UserLoginDto loginDto);

        // ID'si verilen kullanıcının profil bilgilerini güvenli bir şekilde döner
        Task<UserResponseDto> GetUserProfileAsync(Guid userId);
    }
}