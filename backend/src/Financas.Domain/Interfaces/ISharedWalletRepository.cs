using Financas.Domain.Entities;

namespace Financas.Domain.Interfaces;

public interface ISharedWalletRepository
{
    Task<SharedWallet?> GetByIdAsync(Guid id);
    Task<IEnumerable<SharedWallet>> GetByUserIdAsync(Guid userId);
    Task<SharedWallet> CreateAsync(SharedWallet wallet);
    Task DeleteAsync(Guid id);
    Task<SharedWalletMember?> GetMemberAsync(Guid walletId, Guid userId);
    Task<SharedWalletMember> AddMemberAsync(SharedWalletMember member);
    Task RemoveMemberAsync(Guid walletId, Guid userId);
    Task<bool> IsMemberAsync(Guid walletId, Guid userId);
}
