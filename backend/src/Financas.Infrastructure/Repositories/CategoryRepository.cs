using Financas.Domain.Entities;
using Financas.Domain.Enums;
using Financas.Domain.Interfaces;
using Financas.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Financas.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly AppDbContext _context;

    public CategoryRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Category>> GetAllByUserIdAsync(Guid userId)
        => await _context.Categories
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name)
            .ToListAsync();

    public async Task<IEnumerable<Category>> GetByUserIdAndTypeAsync(Guid userId, TransactionType type)
        => await _context.Categories
            .Where(c => c.UserId == userId && c.Type == type)
            .OrderBy(c => c.Name)
            .ToListAsync();

    public async Task<Category?> GetByIdAsync(Guid id)
        => await _context.Categories.FindAsync(id);

    public async Task<Category> CreateAsync(Category category)
    {
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task CreateRangeAsync(IEnumerable<Category> categories)
    {
        _context.Categories.AddRange(categories);
        await _context.SaveChangesAsync();
    }

    public async Task<Category> UpdateAsync(Category category)
    {
        _context.Categories.Update(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task DeleteAsync(Guid id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category != null)
        {
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
        }
    }
}
