using System.ComponentModel.DataAnnotations;
using Financas.Domain.Enums;

namespace Financas.Application.DTOs;

public class CreateTransactionDto
{
    [Required]
    public Guid CategoryId { get; set; }

    public Guid? SharedWalletId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    public TransactionType Type { get; set; }

    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime Date { get; set; }
}

public class UpdateTransactionDto
{
    [Required]
    public Guid CategoryId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    public TransactionType Type { get; set; }

    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime Date { get; set; }
}

public class TransactionResponseDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryIcon { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;
    public Guid? SharedWalletId { get; set; }
    public string? UserName { get; set; }
}
