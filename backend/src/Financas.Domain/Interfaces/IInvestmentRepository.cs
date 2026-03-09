using Financas.Domain.Entities;

namespace Financas.Domain.Interfaces;

public interface IInvestmentRepository
{
    Task<IEnumerable<Investment>> GetByUserIdAsync(Guid userId);
    Task<Investment?> GetByIdAsync(Guid id);
    Task<Investment> CreateAsync(Investment investment);
    Task<Investment> UpdateAsync(Investment investment);
    Task DeleteAsync(Guid id);
}
