using System.Diagnostics;

namespace TaskManagement.API.Middlewares
{
    // Her isteğin ne kadar sürdüğünü ölçer; belirlenen eşiği (500ms) aşan istekleri "yavaş istek" olarak loglar
    public class PerformanceMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<PerformanceMiddleware> _logger;
        private const int SlowRequestThresholdMs = 500;

        public PerformanceMiddleware(RequestDelegate next, ILogger<PerformanceMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();

            await _next(context);

            stopwatch.Stop();
            var elapsedMs = stopwatch.ElapsedMilliseconds;

            if (elapsedMs > SlowRequestThresholdMs)
            {
                _logger.LogWarning(
                    "Yavaş istek tespit edildi: {Method} {Path} - {ElapsedMs}ms (eşik: {ThresholdMs}ms)",
                    context.Request.Method,
                    context.Request.Path,
                    elapsedMs,
                    SlowRequestThresholdMs
                );
            }
        }
    }
}
