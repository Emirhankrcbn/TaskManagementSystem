using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.DTOs;
using TaskManagement.API.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;

        public AuthController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto registerDto)
        {
            try
            {
                // Garson siparişi aşçıya (Service'e) iletiyor
                var result = await _userService.RegisterAsync(registerDto);
                
                // İşlem başarılıysa müşteriye 200 OK dönüyoruz
                return Ok(new { message = result }); 
            }
            catch (Exception ex)
            {
                // hataları yakalayıp 400 Bad Request (Hatalı İstek) olarak dönüyo (Bu e-posta kullanımda)
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
        {
            try
            {
                // Başarılı giriş olursa aşçıdan JWT Token gelecek
                var token = await _userService.LoginAsync(loginDto);
                
                // Müşteriye Token'ı veriyoruz
                return Ok(new { token = token });
            }
            catch (Exception ex)
            {
                // Şifre yanlışsa 401 Unauthorized (Yetkisiz) hatası dönüyo
                return Unauthorized(new { error = ex.Message });
            }
        }

        [Authorize] // Sadece geçerli token'ı olanlar buraya girebilir
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                // 1. Kullanıcı ID'sini güvenli bir şekilde Token'dan (VIP Karttan) okuyoruz
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
                // 2. ID'yi Guid formatına çeviriyoruz
                if (Guid.TryParse(userIdString, out Guid userId))
                {
                    // 3. UserService'teki metodumuzu çağırarak veritabanında bu ID'ye sahip kullanıcı var mı kontrol ediyoruz
                    var userProfile = await _userService.GetUserProfileAsync(userId);
            
                    // Kullanıcı veritabanında bulunduysa profili (DTO formatında) dönüyoruz
                    return Ok(userProfile);
                }
        
                return BadRequest(new { error = "Geçersiz kullanıcı kimliği." });
            }
            catch (Exception ex)
            {
                // Eğer UserService'teki "Kullanıcı bulunamadı" hatası fırlatılırsa 404 Not Found dönüyoruz
                return NotFound(new { error = ex.Message });
            }
        }

        [Authorize]
[HttpPut("profile")]
public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto updateDto)
{
    try
    {
        // 1. Kullanıcı ID'sini Token'dan okuyoruz
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (Guid.TryParse(userIdString, out Guid userId))
        {
            // 2. UserService'teki güncelleme metodunu çağırıyoruz
            var result = await _userService.UpdateUserProfileAsync(userId, updateDto);
            
            return Ok(new { message = result });
        }

        return BadRequest(new { error = "Geçersiz kullanıcı kimliği." });
    }
    catch (Exception ex)
    {
        // Kullanıcı bulunamazsa veya başka bir hata olursa
        return BadRequest(new { error = ex.Message });
    }
}
    }
}