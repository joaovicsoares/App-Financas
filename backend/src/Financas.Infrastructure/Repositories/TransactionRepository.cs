using Financas.Domain.Entities;
using Financas.Domain.Enums;
using Financas.Domain.Interfaces;
using Financas.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Financas.Infrastructure.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly AppDbContext _context;

    public TransactionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Transaction>> GetByUserIdAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.SharedWalletId == null);

        if (startDate.HasValue)
            query = query.Where(t => t.Date >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(t => t.Date <= endDate.Value);

        return await query.OrderByDescending(t => t.Date).ToListAsync();
    }

    public async Task<IEnumerable<Transaction>> GetByWalletIdAsync(Guid walletId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Transactions
            .Include(t => t.Category)
            .Include(t => t.User)
            .Where(t => t.SharedWalletId == walletId);

        if (startDate.HasValue)
            query = query.Where(t => t.Date >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(t => t.Date <= endDate.Value);

        return await query.OrderByDescending(t => t.Date).ToListAsync();
    }

    public async Task<Transaction?> GetByIdAsync(Guid id)
        => await _context.Transactions
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<Transaction> CreateAsync(Transaction transaction)
    {
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();
        return transaction;
    }

    public async Task<Transaction> UpdateAsync(Transaction transaction)
    {
        _context.Transactions.Update(transaction);
        await _context.SaveChangesAsync();
        return transaction;
    }

    public async Task DeleteAsync(Guid id)
    {
        var transaction = await _context.Transactions.FindAsync(id);
        if (transaction != null)
        {
            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<decimal> GetTotalByTypeAsync(Guid userId, TransactionType type, DateTime startDate, DateTime endDate)
        => await _context.Transactions
            .Where(t => t.UserId == userId && t.Type == type && t.SharedWalletId == null
                        && t.Date >= startDate && t.Date <= endDate)
            .SumAsync(t => t.Amount);

    public async Task<IEnumerable<Transaction>> GetRecentByUserIdAsync(Guid userId, int count = 5)
        => await _context.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.SharedWalletId == null)
            .OrderByDescending(t => t.Date)
            .Take(count)
            .ToListAsync();
}
