// Arayüzdeki sözleşmeleri veritabanı kurallarıyla birleştir

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CategoryService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<CategoryResponseDto>> GetAllCategoriesByUserIdAsync(Guid userId)
        {
            var categories = await _context.Categories
                .Where(c => c.UserId == userId)
                .ToListAsync();

            return _mapper.Map<IEnumerable<CategoryResponseDto>>(categories);
        }

        public async Task<CategoryResponseDto> GetCategoryByIdAsync(Guid categoryId, Guid userId)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == categoryId && c.UserId == userId);

            if (category == null)
                throw new Exception("Kategori bulunamadı veya erişim yetkiniz yok.");

            return _mapper.Map<CategoryResponseDto>(category);
        }

        public async Task<CategoryResponseDto> CreateCategoryAsync(Guid userId, CategoryCreateDto categoryCreateDto)
        {
            var categoryEntity = _mapper.Map<Category>(categoryCreateDto);
            categoryEntity.UserId = userId; // Kategoriyi oluşturan kullanıcıya bağla

            _context.Categories.Add(categoryEntity);
            await _context.SaveChangesAsync();

            return _mapper.Map<CategoryResponseDto>(categoryEntity);
        }

        public async Task<CategoryResponseDto> UpdateCategoryAsync(Guid categoryId, Guid userId, CategoryUpdateDto categoryUpdateDto)
        {
            var existingCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == categoryId && c.UserId == userId);

            if (existingCategory == null)
                throw new Exception("Güncellenecek kategori bulunamadı.");

            existingCategory.Name = categoryUpdateDto.Name;

            _context.Categories.Update(existingCategory);
            await _context.SaveChangesAsync();

            return _mapper.Map<CategoryResponseDto>(existingCategory);
        }

        public async Task<bool> DeleteCategoryAsync(Guid categoryId, Guid userId)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == categoryId && c.UserId == userId);

            if (category == null)
                throw new Exception("Silinecek kategori bulunamadı.");

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}