using System.ComponentModel.DataAnnotations;
using Financas.Domain.Enums;

namespace Financas.Application.DTOs;

public class CreateInvestmentDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public InvestmentType Type { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal AmountInvested { get; set; }

    [Required]
    [Range(0.0001, 10.0)]
    public decimal AnnualRate { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? MaturityDate { get; set; }

    [MaxLength(500)]
    public string Notes { get; set; } = string.Empty;
}

public class UpdateInvestmentDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal AmountInvested { get; set; }

    [Required]
    [Range(0.0001, 10.0)]
    public decimal AnnualRate { get; set; }

    public DateTime? MaturityDate { get; set; }

    [MaxLength(500)]
    public string Notes { get; set; } = string.Empty;
}

public class RedeemInvestmentDto
{
    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal RedeemedAmount { get; set; }
}

public class InvestmentResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public InvestmentType Type { get; set; }
    public InvestmentStatus Status { get; set; }
    public decimal AmountInvested { get; set; }
    public decimal AnnualRate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? MaturityDate { get; set; }
    public DateTime? RedeemedAt { get; set; }
    public decimal? RedeemedAmount { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Calculated fields
    public decimal CurrentValue { get; set; }
    public decimal TotalYield { get; set; }
    public decimal YieldPercentage { get; set; }
}

public class InvestmentSummaryDto
{
    public decimal TotalInvested { get; set; }
    public decimal TotalCurrentValue { get; set; }
    public decimal TotalYield { get; set; }
    public decimal YieldPercentage { get; set; }
    public int ActiveCount { get; set; }
}
