using AutoMapper;
using TaskManagement.API.Models;
using TaskManagement.API.DTOs;

namespace TaskManagement.API.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Entity -> DTO (Veritabanından kullanıcıya)
            CreateMap<TaskItem, TaskResponseDto>();

            // DTO -> Entity (Kullanıcıdan veritabanına)
            CreateMap<TaskCreateDto, TaskItem>();

            // Kullanıcı verisini DTO'ya çevir
            CreateMap<User, UserResponseDto>();

            // YENİ EKLENEN KURAL: Kategori Eşleştirmeleri
            CreateMap<Category, CategoryResponseDto>();
            CreateMap<CategoryCreateDto, Category>();
            CreateMap<CategoryUpdateDto, Category>();
        }
    }
}