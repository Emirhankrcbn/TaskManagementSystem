using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// --- Serilog Konfigürasyonu Başlangıç ---
builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .WriteTo.Console() // Konsola yazmaya devam et
        .WriteTo.File("Logs/log-.txt", rollingInterval: RollingInterval.Day) // Her gün için yeni bir .txt dosyası oluştur
        .MinimumLevel.Information() // Sadece Information ve daha ciddi (Warning, Error) logları tut
        .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning); // Microsoft'un gereksiz HTTP loglarını filtrele
});
// --- Serilog Konfigürasyonu Bitiş ---

// AppSettings içerisinden aktif veritabanı sağlayıcısını oku
var dbProvider = builder.Configuration.GetValue<string>("DatabaseSettings:Provider");

// Veritabanı bağlantı konfigürasyonu (If/Else yapısı)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (dbProvider == "PostgreSQL")
    {
        options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSQLConnection"));
    }
    else if (dbProvider == "Oracle")
    {
        options.UseOracle(builder.Configuration.GetConnectionString("OracleConnection"));
    }
    else
    {
        throw new Exception("Desteklenmeyen veritabanı sağlayıcısı seçildi!");
    }
});

// Add services to the container.
builder.Services.AddOpenApi();

// AutoMapper konfigürasyonu
builder.Services.AddAutoMapper(options => 
{
    options.AddProfile<TaskManagement.API.Mappings.MappingProfile>();
});

// Servis Katmanı Kayıtları (Dependency Injection)
builder.Services.AddScoped<TaskManagement.API.Services.IUserService, TaskManagement.API.Services.UserService>();
builder.Services.AddScoped<TaskManagement.API.Services.ITaskService, TaskManagement.API.Services.TaskService>();
builder.Services.AddScoped<TaskManagement.API.Services.ICategoryService, TaskManagement.API.Services.CategoryService>();

// --- JWT Konfigürasyonu Başlangıç ---
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

builder.Services.AddScoped<TaskManagement.API.Services.IJwtService, TaskManagement.API.Services.JwtService>();
// --- JWT Konfigürasyonu Bitiş ---

builder.Services.AddResponseCaching();

builder.Services.AddControllers(); // Projenin Controller kullanacağını belirtiyoruz

// --- Swagger ve JWT Butonu Konfigürasyonu Başlangıç ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "TaskManagement API", Version = "v1" });

    // Swagger'a Bearer Token (JWT) kullanacağını söylüyoruz
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Lütfen token'ı şu formatta girin: 'Bearer {senin_token_kodun}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
// --- Swagger Konfigürasyonu Bitiş ---

// --- CORS Konfigürasyonu Başlangıç ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173") // React/Vue portları
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
// --- CORS Konfigürasyonu Bitiş ---

var app = builder.Build();

// Hata yakalayıcı Middleware'imiz tüm istekleri en başta karşılasın
app.UseMiddleware<TaskManagement.API.Middlewares.ExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    
    // Geliştirme ortamında Swagger arayüzünü aktif et
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "TaskManagement API v1"));
}

app.UseHttpsRedirection();

// API'nin fiziksel dosyaları (resim, pdf vb.) sunmasına izin
app.UseStaticFiles();

app.UseRouting(); // Yönlendirmeyi başlat

// CORS politikasını devreye al (Mutlaka UseAuthentication'dan ÖNCE olmalı)
app.UseCors("AllowFrontend");

app.UseResponseCaching();

// --- HTTP istek hattı (Pipeline) ---

// 1. Önce kimlik kontrolü (Kişi kim? Token geçerli mi?)
app.UseAuthentication(); 

// 2. Sonra yetki kontrolü (Bu işlemi yapmaya izni var mı?)
app.UseAuthorization();  

// 3. İstekleri Controller'lara yönlendir
app.MapControllers();    

app.Run();