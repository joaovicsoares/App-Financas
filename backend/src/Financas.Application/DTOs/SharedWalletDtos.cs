using System.ComponentModel.DataAnnotations;
using Financas.Domain.Enums;

namespace Financas.Application.DTOs;

public class CreateSharedWalletDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}

public class InviteMemberDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class SharedWalletResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<WalletMemberDto> Members { get; set; } = [];
}

public class WalletMemberDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public WalletRole Role { get; set; }
    public DateTime JoinedAt { get; set; }
}

public class DashboardDto
{
    public decimal Balance { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public List<TransactionResponseDto> RecentTransactions { get; set; } = [];
}
