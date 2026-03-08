using Financas.Application.DTOs;

namespace Financas.Application.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<CategoryResponseDto>> GetAllAsync(Guid userId);
    Task<CategoryResponseDto> CreateAsync(Guid userId, CreateCategoryDto dto);
    Task<CategoryResponseDto> UpdateAsync(Guid userId, Guid id, UpdateCategoryDto dto);
    Task DeleteAsync(Guid userId, Guid id);
    Task SeedDefaultCategoriesAsync(Guid userId);
}
