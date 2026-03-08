using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Financas.Domain.Entities;
using Financas.Domain.Enums;
using Financas.Domain.Interfaces;

namespace Financas.Application.Services;

public class SharedWalletService : ISharedWalletService
{
    private readonly ISharedWalletRepository _walletRepository;
    private readonly IUserRepository _userRepository;

    public SharedWalletService(ISharedWalletRepository walletRepository, IUserRepository userRepository)
    {
        _walletRepository = walletRepository;
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<SharedWalletResponseDto>> GetAllAsync(Guid userId)
    {
        var wallets = await _walletRepository.GetByUserIdAsync(userId);
        return wallets.Select(MapToDto);
    }

    public async Task<SharedWalletResponseDto> CreateAsync(Guid userId, CreateSharedWalletDto dto)
    {
        var wallet = new SharedWallet
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            CreatedAt = DateTime.UtcNow
        };

        await _walletRepository.CreateAsync(wallet);

        var member = new SharedWalletMember
        {
            Id = Guid.NewGuid(),
            SharedWalletId = wallet.Id,
            UserId = userId,
            Role = WalletRole.Owner,
            JoinedAt = DateTime.UtcNow
        };

        await _walletRepository.AddMemberAsync(member);

        var created = await _walletRepository.GetByIdAsync(wallet.Id);
        return MapToDto(created!);
    }

    public async Task<SharedWalletResponseDto> InviteMemberAsync(Guid userId, Guid walletId, InviteMemberDto dto)
    {
        var wallet = await _walletRepository.GetByIdAsync(walletId)
            ?? throw new KeyNotFoundException("Carteira não encontrada.");

        var member = await _walletRepository.GetMemberAsync(walletId, userId);
        if (member == null || member.Role != WalletRole.Owner)
            throw new UnauthorizedAccessException("Apenas o dono pode convidar membros.");

        var invitedUser = await _userRepository.GetByEmailAsync(dto.Email)
            ?? throw new KeyNotFoundException("Usuário com este email não encontrado.");

        if (await _walletRepository.IsMemberAsync(walletId, invitedUser.Id))
            throw new InvalidOperationException("Usuário já é membro desta carteira.");

        var newMember = new SharedWalletMember
        {
            Id = Guid.NewGuid(),
            SharedWalletId = walletId,
            UserId = invitedUser.Id,
            Role = WalletRole.Member,
            JoinedAt = DateTime.UtcNow
        };

        await _walletRepository.AddMemberAsync(newMember);

        var updated = await _walletRepository.GetByIdAsync(walletId);
        return MapToDto(updated!);
    }

    public async Task RemoveMemberAsync(Guid userId, Guid walletId, Guid memberId)
    {
        var currentMember = await _walletRepository.GetMemberAsync(walletId, userId);
        if (currentMember == null || currentMember.Role != WalletRole.Owner)
            throw new UnauthorizedAccessException("Apenas o dono pode remover membros.");

        if (memberId == userId)
            throw new InvalidOperationException("O dono não pode se remover. Use 'excluir carteira'.");

        await _walletRepository.RemoveMemberAsync(walletId, memberId);
    }

    public async Task LeaveAsync(Guid userId, Guid walletId)
    {
        var member = await _walletRepository.GetMemberAsync(walletId, userId)
            ?? throw new KeyNotFoundException("Você não é membro desta carteira.");

        if (member.Role == WalletRole.Owner)
            throw new InvalidOperationException("O dono não pode sair da carteira. Exclua a carteira ou transfira a propriedade.");

        await _walletRepository.RemoveMemberAsync(walletId, userId);
    }

    public async Task DeleteAsync(Guid userId, Guid walletId)
    {
        var member = await _walletRepository.GetMemberAsync(walletId, userId);
        if (member == null || member.Role != WalletRole.Owner)
            throw new UnauthorizedAccessException("Apenas o dono pode excluir a carteira.");

        await _walletRepository.DeleteAsync(walletId);
    }

    private static SharedWalletResponseDto MapToDto(SharedWallet wallet) => new()
    {
        Id = wallet.Id,
        Name = wallet.Name,
        CreatedAt = wallet.CreatedAt,
        Members = wallet.Members.Select(m => new WalletMemberDto
        {
            UserId = m.UserId,
            Name = m.User?.Name ?? "",
            Email = m.User?.Email ?? "",
            Role = m.Role,
            JoinedAt = m.JoinedAt
        }).ToList()
    };
}
