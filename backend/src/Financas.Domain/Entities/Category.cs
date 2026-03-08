using Financas.Domain.Enums;

namespace Financas.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public TransactionType Type { get; set; }
    public bool IsDefault { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = [];
}
