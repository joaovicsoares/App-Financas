using Financas.Domain.Enums;

namespace Financas.Domain.Entities;

public class Investment
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public InvestmentType Type { get; set; }
    public InvestmentStatus Status { get; set; } = InvestmentStatus.Active;
    public decimal AmountInvested { get; set; }
    public decimal AnnualRate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? MaturityDate { get; set; }
    public DateTime? RedeemedAt { get; set; }
    public decimal? RedeemedAmount { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
