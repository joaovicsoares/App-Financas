using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Financas.Domain.Entities;
using Financas.Domain.Interfaces;

namespace Financas.Application.Services;

public class TransactionService : ITransactionService
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly ISharedWalletRepository _walletRepository;

    public TransactionService(ITransactionRepository transactionRepository, ISharedWalletRepository walletRepository)
    {
        _transactionRepository = transactionRepository;
        _walletRepository = walletRepository;
    }

    public async Task<IEnumerable<TransactionResponseDto>> GetAllAsync(Guid userId, DateTime? startDate, DateTime? endDate)
    {
        var transactions = await _transactionRepository.GetByUserIdAsync(userId, startDate, endDate);
        return transactions.Select(MapToDto);
    }

    public async Task<IEnumerable<TransactionResponseDto>> GetByWalletAsync(Guid userId, Guid walletId, DateTime? startDate, DateTime? endDate)
    {
        if (!await _walletRepository.IsMemberAsync(walletId, userId))
            throw new UnauthorizedAccessException("Você não é membro desta carteira.");

        var transactions = await _transactionRepository.GetByWalletIdAsync(walletId, startDate, endDate);
        return transactions.Select(MapToDto);
    }

    public async Task<TransactionResponseDto> CreateAsync(Guid userId, CreateTransactionDto dto)
    {
        if (dto.SharedWalletId.HasValue)
        {
            if (!await _walletRepository.IsMemberAsync(dto.SharedWalletId.Value, userId))
                throw new UnauthorizedAccessException("Você não é membro desta carteira.");
        }

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CategoryId = dto.CategoryId,
            SharedWalletId = dto.SharedWalletId,
            Amount = dto.Amount,
            Type = dto.Type,
            Description = dto.Description,
            Date = dto.Date,
            CreatedAt = DateTime.UtcNow
        };

        await _transactionRepository.CreateAsync(transaction);

        var created = await _transactionRepository.GetByIdAsync(transaction.Id);
        return MapToDto(created!);
    }

    public async Task<TransactionResponseDto> UpdateAsync(Guid userId, Guid id, UpdateTransactionDto dto)
    {
        var transaction = await _transactionRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Transação não encontrada.");

        if (transaction.UserId != userId)
            throw new UnauthorizedAccessException("Sem permissão para editar esta transação.");

        transaction.CategoryId = dto.CategoryId;
        transaction.Amount = dto.Amount;
        transaction.Type = dto.Type;
        transaction.Description = dto.Description;
        transaction.Date = dto.Date;

        await _transactionRepository.UpdateAsync(transaction);

        var updated = await _transactionRepository.GetByIdAsync(transaction.Id);
        return MapToDto(updated!);
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var transaction = await _transactionRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Transação não encontrada.");

        if (transaction.UserId != userId)
            throw new UnauthorizedAccessException("Sem permissão para excluir esta transação.");

        await _transactionRepository.DeleteAsync(id);
    }

    private static TransactionResponseDto MapToDto(Transaction t) => new()
    {
        Id = t.Id,
        Amount = t.Amount,
        Type = t.Type,
        Description = t.Description,
        Date = t.Date,
        CreatedAt = t.CreatedAt,
        CategoryId = t.CategoryId,
        CategoryName = t.Category?.Name ?? "",
        CategoryIcon = t.Category?.Icon ?? "",
        CategoryColor = t.Category?.Color ?? "",
        SharedWalletId = t.SharedWalletId,
        UserName = t.User?.Name
    };
}
