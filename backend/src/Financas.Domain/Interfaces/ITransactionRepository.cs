using Financas.Domain.Entities;

namespace Financas.Domain.Interfaces;

public interface ITransactionRepository
{
    Task<IEnumerable<Transaction>> GetByUserIdAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null);
    Task<IEnumerable<Transaction>> GetByWalletIdAsync(Guid walletId, DateTime? startDate = null, DateTime? endDate = null);
    Task<Transaction?> GetByIdAsync(Guid id);
    Task<Transaction> CreateAsync(Transaction transaction);
    Task<Transaction> UpdateAsync(Transaction transaction);
    Task DeleteAsync(Guid id);
    Task<decimal> GetTotalByTypeAsync(Guid userId, Domain.Enums.TransactionType type, DateTime startDate, DateTime endDate);
    Task<IEnumerable<Transaction>> GetRecentByUserIdAsync(Guid userId, int count = 5);
}
