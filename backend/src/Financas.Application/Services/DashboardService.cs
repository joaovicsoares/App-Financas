using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Financas.Domain.Enums;
using Financas.Domain.Interfaces;

namespace Financas.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly ISharedWalletRepository _walletRepository;

    public DashboardService(ITransactionRepository transactionRepository, ISharedWalletRepository walletRepository)
    {
        _transactionRepository = transactionRepository;
        _walletRepository = walletRepository;
    }

    public async Task<DashboardDto> GetDashboardAsync(Guid userId)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

        var totalIncome = await _transactionRepository.GetTotalByTypeAsync(userId, TransactionType.Income, startOfMonth, endOfMonth);
        var totalExpenses = await _transactionRepository.GetTotalByTypeAsync(userId, TransactionType.Expense, startOfMonth, endOfMonth);
        var recentTransactions = await _transactionRepository.GetRecentByUserIdAsync(userId, 5);

        return new DashboardDto
        {
            Balance = totalIncome - totalExpenses,
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            RecentTransactions = recentTransactions.Select(t => new TransactionResponseDto
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
                CategoryColor = t.Category?.Color ?? ""
            }).ToList()
        };
    }

    public async Task<DashboardDto> GetWalletDashboardAsync(Guid userId, Guid walletId)
    {
        if (!await _walletRepository.IsMemberAsync(walletId, userId))
            throw new UnauthorizedAccessException("Você não é membro desta carteira.");

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

        var transactions = await _transactionRepository.GetByWalletIdAsync(walletId, startOfMonth, endOfMonth);

        var totalIncome = transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
        var totalExpenses = transactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

        var recent = await _transactionRepository.GetByWalletIdAsync(walletId);
        var recentList = recent.Take(5);

        return new DashboardDto
        {
            Balance = totalIncome - totalExpenses,
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            RecentTransactions = recentList.Select(t => new TransactionResponseDto
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
            }).ToList()
        };
    }
}
