// sınıfı arayüze bağla
// ApplicationDbContext ve IMapper bağımlılıklarını kurucu metotla içeri al
// kayıt olma, giriş yapma, profil getirme

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IJwtService _jwtService;

        public UserService(ApplicationDbContext context, IMapper mapper, IJwtService jwtService)
        {
            _context = context;
            _mapper = mapper;
            _jwtService = jwtService;
        }

        public async Task<string> RegisterAsync(UserRegisterDto registerDto)
        {
            // 1. İş Mantığı: E-posta adresi zaten kullanılıyor mu kontrol et
            var userExists = await _context.Users.AnyAsync(u => u.Email == registerDto.Email);
            if (userExists)
            {
                throw new Exception("Bu e-posta adresi zaten kullanımda.");
            }

            // 2. İş Mantığı: Kullanıcı adının benzersizliğini kontrol et
            var usernameExists = await _context.Users.AnyAsync(u => u.Username == registerDto.Username);
            if (usernameExists)
            {
                throw new Exception("Bu kullanıcı adı zaten alınmış.");
            }

            // 3. Veritabanına kayıt işlemi için yeni User nesnesini oluştur
            var newUser = new User
            {
                Username = registerDto.Username,
                Email = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password), // Şifreyi hash'le
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return "Kullanıcı başarıyla kaydedildi.";
        }

        public async Task<string> LoginAsync(UserLoginDto loginDto)
        {
            // 1. Kullanıcıyı e-posta adresinden bul
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
            
            if (user == null)
            {
                throw new Exception("Geçersiz e-posta veya şifre.");
            }

            // 2. Şifreyi doğrula
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);
            
            if (!isPasswordValid)
            {
                throw new Exception("Geçersiz e-posta veya şifre.");
            }

            return _jwtService.GenerateToken(user);
        }

        public async Task<UserResponseDto> GetUserProfileAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            
            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            // Mapper kullanarak User (Entity) nesnesini UserResponseDto'ya dönüştür
            return _mapper.Map<UserResponseDto>(user);
        }
    }
}