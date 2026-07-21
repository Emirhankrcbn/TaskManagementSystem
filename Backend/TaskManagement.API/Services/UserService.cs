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

        public async Task<string> UpdateUserProfileAsync(Guid userId, UpdateProfileDto updateDto)
        {
            var user = await _context.Users.FindAsync(userId);
            
            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            // 1. Kullanıcı Adı Güncelleme (Benzersizlik kontrolü ile)
            if (!string.IsNullOrEmpty(updateDto.Username) && updateDto.Username != user.Username)
            {
                var usernameExists = await _context.Users.AnyAsync(u => u.Username == updateDto.Username && u.Id != userId);
                if (usernameExists)
                {
                    throw new Exception("Bu kullanıcı adı başka bir kullanıcı tarafından kullanılıyor.");
                }
                user.Username = updateDto.Username;
            }

            // 2. Ad ve Soyad Güncelleme
            if (!string.IsNullOrEmpty(updateDto.FirstName))
            {
                user.FirstName = updateDto.FirstName;
            }

            if (!string.IsNullOrEmpty(updateDto.LastName))
            {
                user.LastName = updateDto.LastName;
            }

            // 3. E-posta Güncelleme (Benzersizlik kontrolü ile)
            if (!string.IsNullOrEmpty(updateDto.Email) && updateDto.Email != user.Email)
            {
                var emailExists = await _context.Users.AnyAsync(u => u.Email == updateDto.Email && u.Id != userId);
                if (emailExists)
                {
                    throw new Exception("Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.");
                }
                user.Email = updateDto.Email;
            }

            // 4. Şifre Güncelleme
            if (!string.IsNullOrEmpty(updateDto.NewPassword))
            {
                if (string.IsNullOrEmpty(updateDto.CurrentPassword))
                {
                    throw new Exception("Şifrenizi değiştirmek için lütfen mevcut şifrenizi girin.");
                }

                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(updateDto.CurrentPassword, user.PasswordHash);
                if (!isPasswordValid)
                {
                    throw new Exception("Mevcut şifrenizi yanlış girdiniz.");
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updateDto.NewPassword);
            }

            // 5. Güncelleme tarihini kaydet
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return "Profil bilgileri başarıyla güncellendi.";
        }
    }
}