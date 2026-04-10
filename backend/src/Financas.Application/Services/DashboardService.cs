using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Financas.Domain.Enums;
using Financas.Domain.Interfaces;

namespace Financas.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly ISharedWalletRepository _walletRepository;

    public DashboardService(ITransactionRepository transactionRepository, ISharedWalletRepository walletRepository)
    {
        _transactionRepository = transactionRepository;
        _walletRepository = walletRepository;
    }

    public async Task<DashboardDto> GetDashboardAsync(Guid userId)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

        var totalIncome = await _transactionRepository.GetTotalByTypeAsync(userId, TransactionType.Income, startOfMonth, endOfMonth);
        var totalExpenses = await _transactionRepository.GetTotalByTypeAsync(userId, TransactionType.Expense, startOfMonth, endOfMonth);
        var monthTransactions = await _transactionRepository.GetByUserIdAsync(userId, startOfMonth, endOfMonth);
        var recentTransactions = monthTransactions.Take(10);

        // Gastos por categoria (top 5)
        var expenseTransactions = monthTransactions.Where(t => t.Type == TransactionType.Expense).ToList();
        var categoryExpenses = expenseTransactions
            .GroupBy(t => new { t.CategoryId, t.Category?.Name, t.Category?.Icon, t.Category?.Color })
            .Select(g => new CategoryExpenseDto
            {
                CategoryName = g.Key.Name ?? "",
                CategoryIcon = g.Key.Icon ?? "",
                CategoryColor = g.Key.Color ?? "",
                TotalAmount = g.Sum(t => t.Amount),
                TransactionCount = g.Count(),
                Percentage = totalExpenses > 0 ? (g.Sum(t => t.Amount) / totalExpenses) * 100 : 0
            })
            .OrderByDescending(c => c.TotalAmount)
            .Take(5)
            .ToList();

        // Comparação com mês anterior
        var startOfPreviousMonth = startOfMonth.AddMonths(-1);
        var endOfPreviousMonth = startOfMonth.AddTicks(-1);
        var previousMonthExpenses = await _transactionRepository.GetTotalByTypeAsync(userId, TransactionType.Expense, startOfPreviousMonth, endOfPreviousMonth);
        
        var difference = totalExpenses - previousMonthExpenses;
        var percentageChange = previousMonthExpenses > 0 ? (difference / previousMonthExpenses) * 100 : 0;

        var monthComparison = new MonthComparisonDto
        {
            PreviousMonthExpenses = previousMonthExpenses,
            CurrentMonthExpenses = totalExpenses,
            Difference = difference,
            PercentageChange = percentageChange
        };

        // Média diária e projeção
        var daysElapsed = (now - startOfMonth).Days + 1;
        var daysInMonth = DateTime.DaysInMonth(now.Year, now.Month);
        var daysRemaining = daysInMonth - daysElapsed;
        var dailyAverage = daysElapsed > 0 ? totalExpenses / daysElapsed : 0;
        var projectedExpense = dailyAverage * daysInMonth;

        // Gastos por dia da semana
        var expensesByDayOfWeek = expenseTransactions
            .GroupBy(t => t.Date.DayOfWeek)
            .Select(g => new DayOfWeekExpenseDto
            {
                DayNumber = (int)g.Key,
                DayName = GetDayName(g.Key),
                TotalAmount = g.Sum(t => t.Amount)
            })
            .OrderBy(d => d.DayNumber)
            .ToList();

        return new DashboardDto
        {
            Balance = totalIncome - totalExpenses,
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            RecentTransactions = recentTransactions.Select(t => new TransactionResponseDto
            {
                Id = t.Id,
                Amount = t.Amount,
                Type = t.Type,
                RecurrenceType = t.RecurrenceType,
                TotalInstallments = t.TotalInstallments,
                CurrentInstallment = t.CurrentInstallment,
                RecurrenceGroupId = t.RecurrenceGroupId,
                Description = t.Description,
                Date = t.Date,
                CreatedAt = t.CreatedAt,
                CategoryId = t.CategoryId,
                CategoryName = t.Category?.Name ?? "",
                CategoryIcon = t.Category?.Icon ?? "",
                CategoryColor = t.Category?.Color ?? ""
            }).ToList(),
            TopExpenseCategories = categoryExpenses,
            MonthComparison = monthComparison,
            DailyAverageExpense = dailyAverage,
            ProjectedMonthExpense = projectedExpense,
            DaysRemainingInMonth = daysRemaining,
            ExpensesByDayOfWeek = expensesByDayOfWeek
        };
    }

    private static string GetDayName(DayOfWeek day)
    {
        return day switch
        {
            DayOfWeek.Sunday => "Domingo",
            DayOfWeek.Monday => "Segunda",
            DayOfWeek.Tuesday => "Terça",
            DayOfWeek.Wednesday => "Quarta",
            DayOfWeek.Thursday => "Quinta",
            DayOfWeek.Friday => "Sexta",
            DayOfWeek.Saturday => "Sábado",
            _ => ""
        };
    }

    public async Task<MonthlyInsightsDto> GetMonthlyInsightsAsync(Guid userId, int year, int month)
    {
        var startOfMonth = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

        var transactions = await _transactionRepository.GetByUserIdAsync(userId, startOfMonth, endOfMonth);
        var expenses = transactions.Where(t => t.Type == TransactionType.Expense).ToList();
        var incomes = transactions.Where(t => t.Type == TransactionType.Income).ToList();

        var totalExpenses = expenses.Sum(t => t.Amount);
        var totalIncome = incomes.Sum(t => t.Amount);

        var biggestExpense = expenses.OrderByDescending(t => t.Amount).FirstOrDefault();
        var biggestIncome = incomes.OrderByDescending(t => t.Amount).FirstOrDefault();

        var daysWithExpenses = expenses.Select(t => t.Date.Date).Distinct().Count();
        var daysWithIncome = incomes.Select(t => t.Date.Date).Distinct().Count();

        return new MonthlyInsightsDto
        {
            Year = year,
            Month = month,
            MonthName = GetMonthName(month),
            TotalExpenses = totalExpenses,
            TotalIncome = totalIncome,
            Balance = totalIncome - totalExpenses,
            TotalTransactions = transactions.Count(),
            AverageTransactionAmount = transactions.Any() ? transactions.Average(t => t.Amount) : 0,
            BiggestExpense = biggestExpense?.Amount ?? 0,
            BiggestExpenseCategory = biggestExpense?.Category?.Name,
            BiggestIncome = biggestIncome?.Amount ?? 0,
            DaysWithExpenses = daysWithExpenses,
            DaysWithIncome = daysWithIncome
        };
    }

    private static string GetMonthName(int month)
    {
        return month switch
        {
            1 => "Janeiro",
            2 => "Fevereiro",
            3 => "Março",
            4 => "Abril",
            5 => "Maio",
            6 => "Junho",
            7 => "Julho",
            8 => "Agosto",
            9 => "Setembro",
            10 => "Outubro",
            11 => "Novembro",
            12 => "Dezembro",
            _ => ""
        };
    }

    public async Task<DashboardDto> GetWalletDashboardAsync(Guid userId, Guid walletId)
    {
        if (!await _walletRepository.IsMemberAsync(walletId, userId))
            throw new UnauthorizedAccessException("Você não é membro desta carteira.");

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

        var transactions = await _transactionRepository.GetByWalletIdAsync(walletId, startOfMonth, endOfMonth);

        var totalIncome = transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
        var totalExpenses = transactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

        var recent = await _transactionRepository.GetByWalletIdAsync(walletId);
        var recentList = recent.Take(5);

        // Gastos por categoria (top 5)
        var expenseTransactions = transactions.Where(t => t.Type == TransactionType.Expense).ToList();
        var categoryExpenses = expenseTransactions
            .GroupBy(t => new { t.CategoryId, t.Category?.Name, t.Category?.Icon, t.Category?.Color })
            .Select(g => new CategoryExpenseDto
            {
                CategoryName = g.Key.Name ?? "",
                CategoryIcon = g.Key.Icon ?? "",
                CategoryColor = g.Key.Color ?? "",
                TotalAmount = g.Sum(t => t.Amount),
                TransactionCount = g.Count(),
                Percentage = totalExpenses > 0 ? (g.Sum(t => t.Amount) / totalExpenses) * 100 : 0
            })
            .OrderByDescending(c => c.TotalAmount)
            .Take(5)
            .ToList();

        // Comparação com mês anterior
        var startOfPreviousMonth = startOfMonth.AddMonths(-1);
        var endOfPreviousMonth = startOfMonth.AddTicks(-1);
        var previousTransactions = await _transactionRepository.GetByWalletIdAsync(walletId, startOfPreviousMonth, endOfPreviousMonth);
        var previousMonthExpenses = previousTransactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);
        
        var difference = totalExpenses - previousMonthExpenses;
        var percentageChange = previousMonthExpenses > 0 ? (difference / previousMonthExpenses) * 100 : 0;

        var monthComparison = new MonthComparisonDto
        {
            PreviousMonthExpenses = previousMonthExpenses,
            CurrentMonthExpenses = totalExpenses,
            Difference = difference,
            PercentageChange = percentageChange
        };

        // Média diária e projeção
        var daysElapsed = (now - startOfMonth).Days + 1;
        var daysInMonth = DateTime.DaysInMonth(now.Year, now.Month);
        var daysRemaining = daysInMonth - daysElapsed;
        var dailyAverage = daysElapsed > 0 ? totalExpenses / daysElapsed : 0;
        var projectedExpense = dailyAverage * daysInMonth;

        // Gastos por dia da semana
        var expensesByDayOfWeek = expenseTransactions
            .GroupBy(t => t.Date.DayOfWeek)
            .Select(g => new DayOfWeekExpenseDto
            {
                DayNumber = (int)g.Key,
                DayName = GetDayName(g.Key),
                TotalAmount = g.Sum(t => t.Amount)
            })
            .OrderBy(d => d.DayNumber)
            .ToList();

        return new DashboardDto
        {
            Balance = totalIncome - totalExpenses,
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            RecentTransactions = recentList.Select(t => new TransactionResponseDto
            {
                Id = t.Id,
                Amount = t.Amount,
                Type = t.Type,
                RecurrenceType = t.RecurrenceType,
                TotalInstallments = t.TotalInstallments,
                CurrentInstallment = t.CurrentInstallment,
                RecurrenceGroupId = t.RecurrenceGroupId,
                Description = t.Description,
                Date = t.Date,
                CreatedAt = t.CreatedAt,
                CategoryId = t.CategoryId,
                CategoryName = t.Category?.Name ?? "",
                CategoryIcon = t.Category?.Icon ?? "",
                CategoryColor = t.Category?.Color ?? "",
                SharedWalletId = t.SharedWalletId,
                UserName = t.User?.Name
            }).ToList(),
            TopExpenseCategories = categoryExpenses,
            MonthComparison = monthComparison,
            DailyAverageExpense = dailyAverage,
            ProjectedMonthExpense = projectedExpense,
            DaysRemainingInMonth = daysRemaining,
            ExpensesByDayOfWeek = expensesByDayOfWeek
        };
    }
}
