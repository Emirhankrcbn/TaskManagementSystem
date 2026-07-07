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
        }
    }
}