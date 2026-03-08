using Financas.Domain.Entities;
using Financas.Domain.Enums;

namespace Financas.Domain.Interfaces;

public interface ICategoryRepository
{
    Task<IEnumerable<Category>> GetAllByUserIdAsync(Guid userId);
    Task<IEnumerable<Category>> GetByUserIdAndTypeAsync(Guid userId, TransactionType type);
    Task<Category?> GetByIdAsync(Guid id);
    Task<Category> CreateAsync(Category category);
    Task CreateRangeAsync(IEnumerable<Category> categories);
    Task<Category> UpdateAsync(Category category);
    Task DeleteAsync(Guid id);
}
