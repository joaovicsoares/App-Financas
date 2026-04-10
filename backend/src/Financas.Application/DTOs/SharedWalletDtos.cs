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
    public List<CategoryExpenseDto> TopExpenseCategories { get; set; } = [];
    public MonthComparisonDto? MonthComparison { get; set; }
    public decimal DailyAverageExpense { get; set; }
    public decimal ProjectedMonthExpense { get; set; }
    public int DaysRemainingInMonth { get; set; }
    public List<DayOfWeekExpenseDto> ExpensesByDayOfWeek { get; set; } = [];
}

public class CategoryExpenseDto
{
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryIcon { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int TransactionCount { get; set; }
    public decimal Percentage { get; set; }
}

public class MonthComparisonDto
{
    public decimal PreviousMonthExpenses { get; set; }
    public decimal CurrentMonthExpenses { get; set; }
    public decimal Difference { get; set; }
    public decimal PercentageChange { get; set; }
}

public class DayOfWeekExpenseDto
{
    public string DayName { get; set; } = string.Empty;
    public int DayNumber { get; set; }
    public decimal TotalAmount { get; set; }
}

public class MonthlyInsightsDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public decimal TotalExpenses { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal Balance { get; set; }
    public int TotalTransactions { get; set; }
    public decimal AverageTransactionAmount { get; set; }
    public decimal BiggestExpense { get; set; }
    public string? BiggestExpenseCategory { get; set; }
    public decimal BiggestIncome { get; set; }
    public int DaysWithExpenses { get; set; }
    public int DaysWithIncome { get; set; }
}
