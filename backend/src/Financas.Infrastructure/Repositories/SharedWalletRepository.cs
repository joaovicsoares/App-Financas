using Financas.Domain.Entities;
using Financas.Domain.Interfaces;
using Financas.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Financas.Infrastructure.Repositories;

public class SharedWalletRepository : ISharedWalletRepository
{
    private readonly AppDbContext _context;

    public SharedWalletRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<SharedWallet?> GetByIdAsync(Guid id)
        => await _context.SharedWallets
            .Include(w => w.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(w => w.Id == id);

    public async Task<IEnumerable<SharedWallet>> GetByUserIdAsync(Guid userId)
        => await _context.SharedWallets
            .Include(w => w.Members)
                .ThenInclude(m => m.User)
            .Where(w => w.Members.Any(m => m.UserId == userId))
            .ToListAsync();

    public async Task<SharedWallet> CreateAsync(SharedWallet wallet)
    {
        _context.SharedWallets.Add(wallet);
        await _context.SaveChangesAsync();
        return wallet;
    }

    public async Task DeleteAsync(Guid id)
    {
        var wallet = await _context.SharedWallets.FindAsync(id);
        if (wallet != null)
        {
            _context.SharedWallets.Remove(wallet);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<SharedWalletMember?> GetMemberAsync(Guid walletId, Guid userId)
        => await _context.SharedWalletMembers
            .FirstOrDefaultAsync(m => m.SharedWalletId == walletId && m.UserId == userId);

    public async Task<SharedWalletMember> AddMemberAsync(SharedWalletMember member)
    {
        _context.SharedWalletMembers.Add(member);
        await _context.SaveChangesAsync();
        return member;
    }

    public async Task RemoveMemberAsync(Guid walletId, Guid userId)
    {
        var member = await _context.SharedWalletMembers
            .FirstOrDefaultAsync(m => m.SharedWalletId == walletId && m.UserId == userId);
        if (member != null)
        {
            _context.SharedWalletMembers.Remove(member);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> IsMemberAsync(Guid walletId, Guid userId)
        => await _context.SharedWalletMembers
            .AnyAsync(m => m.SharedWalletId == walletId && m.UserId == userId);
}
