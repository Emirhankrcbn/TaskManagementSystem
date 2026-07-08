using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddControllers(); // Projenin Controller kullanacağını belirtiyoruz

// --- Swagger ve JWT Butonu Konfigürasyonu Başlangıç ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "TaskManagement API", Version = "v1" });

    // Swagger'a Bearer Token (JWT) kullanacağını söylüyoruz
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Lütfen token'ı şu formatta girin: 'Bearer {senin_token_kodun}'",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
// --- Swagger Konfigürasyonu Bitiş ---

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    
    // Geliştirme ortamında Swagger arayüzünü aktif et
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "TaskManagement API v1"));
}

app.UseHttpsRedirection();

// --- HTTP İstek Hattı (Pipeline) ---

// 1. Önce kimlik kontrolü (Kişi kim? Token geçerli mi?)
app.UseAuthentication(); 

// 2. Sonra yetki kontrolü (Bu işlemi yapmaya izni var mı?)
app.UseAuthorization();  

// 3. İstekleri Controller'lara yönlendir
app.MapControllers();    

app.Run();