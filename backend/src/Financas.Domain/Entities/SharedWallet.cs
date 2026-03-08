namespace Financas.Domain.Entities;

public class SharedWallet
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<SharedWalletMember> Members { get; set; } = [];
    public ICollection<Transaction> Transactions { get; set; } = [];
}
