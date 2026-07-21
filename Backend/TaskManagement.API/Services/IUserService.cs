// arayüz

using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services
{
    public interface IUserService
    {
        // (Diğer mevcut metodlar aynı kalsın...)
        Task<string> RegisterAsync(UserRegisterDto registerDto);
        Task<string> LoginAsync(UserLoginDto loginDto);
        Task<UserResponseDto> GetUserProfileAsync(Guid userId);
        
        // YENİ EKLENEN METOT İMZASI:
        Task<string> UpdateUserProfileAsync(Guid userId, UpdateProfileDto updateDto);
    }
}