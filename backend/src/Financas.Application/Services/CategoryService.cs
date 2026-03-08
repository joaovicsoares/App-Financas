using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Financas.Domain.Entities;
using Financas.Domain.Enums;
using Financas.Domain.Interfaces;

namespace Financas.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<IEnumerable<CategoryResponseDto>> GetAllAsync(Guid userId)
    {
        var categories = await _categoryRepository.GetAllByUserIdAsync(userId);
        return categories.Select(MapToDto);
    }

    public async Task<CategoryResponseDto> CreateAsync(Guid userId, CreateCategoryDto dto)
    {
        var category = new Category
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = dto.Name,
            Icon = dto.Icon,
            Color = dto.Color,
            Type = dto.Type,
            IsDefault = false
        };

        await _categoryRepository.CreateAsync(category);
        return MapToDto(category);
    }

    public async Task<CategoryResponseDto> UpdateAsync(Guid userId, Guid id, UpdateCategoryDto dto)
    {
        var category = await _categoryRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Categoria não encontrada.");

        if (category.UserId != userId)
            throw new UnauthorizedAccessException("Sem permissão para editar esta categoria.");

        category.Name = dto.Name;
        category.Icon = dto.Icon;
        category.Color = dto.Color;
        category.Type = dto.Type;

        await _categoryRepository.UpdateAsync(category);
        return MapToDto(category);
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var category = await _categoryRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Categoria não encontrada.");

        if (category.UserId != userId)
            throw new UnauthorizedAccessException("Sem permissão para excluir esta categoria.");

        await _categoryRepository.DeleteAsync(id);
    }

    public async Task SeedDefaultCategoriesAsync(Guid userId)
    {
        var defaults = new List<Category>
        {
            // Despesas
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Alimentação", Icon = "food", Color = "#FF6B6B", Type = TransactionType.Expense, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Transporte", Icon = "car", Color = "#4ECDC4", Type = TransactionType.Expense, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Moradia", Icon = "home", Color = "#45B7D1", Type = TransactionType.Expense, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Lazer", Icon = "gamepad-variant", Color = "#96CEB4", Type = TransactionType.Expense, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Saúde", Icon = "hospital-box", Color = "#FFEAA7", Type = TransactionType.Expense, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Educação", Icon = "school", Color = "#DDA0DD", Type = TransactionType.Expense, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Compras", Icon = "shopping", Color = "#F0E68C", Type = TransactionType.Expense, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Outros", Icon = "dots-horizontal", Color = "#B0BEC5", Type = TransactionType.Expense, IsDefault = true },
            // Receitas
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Salário", Icon = "cash", Color = "#00C897", Type = TransactionType.Income, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Freelance", Icon = "laptop", Color = "#26D0CE", Type = TransactionType.Income, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Investimentos", Icon = "chart-line", Color = "#6C5CE7", Type = TransactionType.Income, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Outros", Icon = "dots-horizontal", Color = "#A8E6CF", Type = TransactionType.Income, IsDefault = true },
        };

        await _categoryRepository.CreateRangeAsync(defaults);
    }

    private static CategoryResponseDto MapToDto(Category category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Icon = category.Icon,
        Color = category.Color,
        Type = category.Type,
        IsDefault = category.IsDefault
    };
}
