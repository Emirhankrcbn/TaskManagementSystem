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
                // Şifre yanlışsa 401 Unauthorized (Yetkisiz) hatası dönüyoruz
                return Unauthorized(new { error = ex.Message });
            }
        }

        [Authorize] // Sadece token'ı olanlar profiline erişebilir
        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            // Veritabanına gitmeye gerek bile yok, verileri kullanıcının token'ından (VIP Kartından) okuyoruz!
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = User.FindFirstValue(ClaimTypes.Email);

            return Ok(new 
            { 
                Message = "Profil bilgileri token üzerinden başarıyla okundu.",
                Id = userId, 
                Email = email 
            });
        }
    }
}