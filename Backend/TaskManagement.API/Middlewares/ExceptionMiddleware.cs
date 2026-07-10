using System.Net;
using System.Text.Json;

namespace TaskManagement.API.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger; // Hataları konsola yazdırmak için
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // Her şey yolundaysa isteği bir sonraki adıma geçir
                await _next(context); 
            }
            catch (Exception ex)
            {
                // Bir hata patlarsa burada yakala
                _logger.LogError(ex, "Sistemde beklenmeyen bir hata meydana geldi!");
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError; // 500 Hatası

            var response = new
            {
                StatusCode = context.Response.StatusCode,
                Message = "Sunucu tarafında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
                Detailed = exception.Message // Geliştirme aşamasında sorunu görebilmek için
            };

            var json = JsonSerializer.Serialize(response);
            return context.Response.WriteAsync(json);
        }
    }
}