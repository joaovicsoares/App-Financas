using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Financas.Domain.Entities;
using Financas.Domain.Enums;
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

        var groupId = (dto.RecurrenceType != RecurrenceType.Unica) ? Guid.NewGuid() : (Guid?)null;

        int count = dto.RecurrenceType switch
        {
            RecurrenceType.Fixa => 12,
            RecurrenceType.Parcelada => dto.TotalInstallments ?? throw new ArgumentException("Informe a quantidade de parcelas."),
            _ => 1
        };

        Transaction? first = null;

        for (int i = 0; i < count; i++)
        {
            var desc = dto.RecurrenceType switch
            {
                RecurrenceType.Parcelada => $"{dto.Description} ({i + 1}/{count})",
                RecurrenceType.Fixa => dto.Description,
                _ => dto.Description
            };

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CategoryId = dto.CategoryId,
                SharedWalletId = dto.SharedWalletId,
                Amount = dto.Amount,
                Type = dto.Type,
                RecurrenceType = dto.RecurrenceType,
                TotalInstallments = count > 1 ? count : null,
                CurrentInstallment = count > 1 ? i + 1 : null,
                RecurrenceGroupId = groupId,
                Description = desc,
                Date = dto.Date.AddMonths(i),
                CreatedAt = DateTime.UtcNow
            };

            await _transactionRepository.CreateAsync(transaction);
            first ??= transaction;
        }

        var created = await _transactionRepository.GetByIdAsync(first!.Id);
        return MapToDto(created!);
    }

    public async Task<TransactionResponseDto> RenewRecurrenceAsync(Guid userId, Guid groupId)
    {
        var allTransactions = await _transactionRepository.GetByUserIdAsync(userId);
        var group = allTransactions
            .Where(t => t.RecurrenceGroupId == groupId && t.RecurrenceType == RecurrenceType.Fixa)
            .OrderByDescending(t => t.Date)
            .ToList();

        if (group.Count == 0)
            throw new KeyNotFoundException("Grupo de recorrência não encontrado.");

        var template = group.First();
        if (template.UserId != userId)
            throw new UnauthorizedAccessException("Sem permissão.");

        var lastDate = template.Date;
        var existingMax = group.Max(t => t.CurrentInstallment ?? 0);
        Transaction? first = null;

        for (int i = 1; i <= 12; i++)
        {
            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CategoryId = template.CategoryId,
                SharedWalletId = template.SharedWalletId,
                Amount = template.Amount,
                Type = template.Type,
                RecurrenceType = RecurrenceType.Fixa,
                TotalInstallments = existingMax + 12,
                CurrentInstallment = existingMax + i,
                RecurrenceGroupId = groupId,
                Description = template.Description,
                Date = lastDate.AddMonths(i),
                CreatedAt = DateTime.UtcNow
            };

            await _transactionRepository.CreateAsync(transaction);
            first ??= transaction;
        }

        // Update TotalInstallments on existing group members
        foreach (var t in group)
        {
            t.TotalInstallments = existingMax + 12;
            await _transactionRepository.UpdateAsync(t);
        }

        var created = await _transactionRepository.GetByIdAsync(first!.Id);
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
        RecurrenceType = t.RecurrenceType,
        TotalInstallments = t.TotalInstallments,
        CurrentInstallment = t.CurrentInstallment,
        RecurrenceGroupId = t.RecurrenceGroupId,
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
