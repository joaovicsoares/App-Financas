using Financas.Domain.Entities;
using Financas.Domain.Interfaces;
using Financas.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Financas.Infrastructure.Repositories;

public class InvestmentRepository : IInvestmentRepository
{
    private readonly AppDbContext _context;

    public InvestmentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Investment>> GetByUserIdAsync(Guid userId)
        => await _context.Investments
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

    public async Task<Investment?> GetByIdAsync(Guid id)
        => await _context.Investments
            .FirstOrDefaultAsync(i => i.Id == id);

    public async Task<Investment> CreateAsync(Investment investment)
    {
        _context.Investments.Add(investment);
        await _context.SaveChangesAsync();
        return investment;
    }

    public async Task<Investment> UpdateAsync(Investment investment)
    {
        _context.Investments.Update(investment);
        await _context.SaveChangesAsync();
        return investment;
    }

    public async Task DeleteAsync(Guid id)
    {
        var investment = await _context.Investments.FindAsync(id);
        if (investment != null)
        {
            _context.Investments.Remove(investment);
            await _context.SaveChangesAsync();
        }
    }
}
