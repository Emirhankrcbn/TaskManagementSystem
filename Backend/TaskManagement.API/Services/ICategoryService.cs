using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryResponseDto>> GetAllCategoriesByUserIdAsync(Guid userId);
        Task<CategoryResponseDto> GetCategoryByIdAsync(Guid categoryId, Guid userId);
        Task<CategoryResponseDto> CreateCategoryAsync(Guid userId, CategoryCreateDto categoryCreateDto);
        Task<CategoryResponseDto> UpdateCategoryAsync(Guid categoryId, Guid userId, CategoryUpdateDto categoryUpdateDto);
        Task<bool> DeleteCategoryAsync(Guid categoryId, Guid userId);
    }
}