using Financas.Domain.Enums;

namespace Financas.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid CategoryId { get; set; }
    public Guid? SharedWalletId { get; set; }
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public RecurrenceType RecurrenceType { get; set; } = RecurrenceType.Unica;
    public int? TotalInstallments { get; set; }
    public int? CurrentInstallment { get; set; }
    public Guid? RecurrenceGroupId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public SharedWallet? SharedWallet { get; set; }
}
