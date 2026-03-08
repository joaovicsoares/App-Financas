using Financas.Application.DTOs;

namespace Financas.Application.Interfaces;

public interface ISharedWalletService
{
    Task<IEnumerable<SharedWalletResponseDto>> GetAllAsync(Guid userId);
    Task<SharedWalletResponseDto> CreateAsync(Guid userId, CreateSharedWalletDto dto);
    Task<SharedWalletResponseDto> InviteMemberAsync(Guid userId, Guid walletId, InviteMemberDto dto);
    Task RemoveMemberAsync(Guid userId, Guid walletId, Guid memberId);
    Task LeaveAsync(Guid userId, Guid walletId);
    Task DeleteAsync(Guid userId, Guid walletId);
}
