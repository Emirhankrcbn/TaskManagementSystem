using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
    }
}