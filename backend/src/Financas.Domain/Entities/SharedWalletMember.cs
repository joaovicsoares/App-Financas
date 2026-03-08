using Financas.Domain.Enums;

namespace Financas.Domain.Entities;

public class SharedWalletMember
{
    public Guid Id { get; set; }
    public Guid SharedWalletId { get; set; }
    public Guid UserId { get; set; }
    public WalletRole Role { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public SharedWallet SharedWallet { get; set; } = null!;
    public User User { get; set; } = null!;
}
