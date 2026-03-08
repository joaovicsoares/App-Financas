using Financas.Application.DTOs;

namespace Financas.Application.Interfaces;

public interface ITransactionService
{
    Task<IEnumerable<TransactionResponseDto>> GetAllAsync(Guid userId, DateTime? startDate, DateTime? endDate);
    Task<IEnumerable<TransactionResponseDto>> GetByWalletAsync(Guid userId, Guid walletId, DateTime? startDate, DateTime? endDate);
    Task<TransactionResponseDto> CreateAsync(Guid userId, CreateTransactionDto dto);
    Task<TransactionResponseDto> UpdateAsync(Guid userId, Guid id, UpdateTransactionDto dto);
    Task DeleteAsync(Guid userId, Guid id);
}
