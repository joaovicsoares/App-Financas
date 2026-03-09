using Financas.Application.Interfaces;
using Financas.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Financas.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ITransactionService, TransactionService>();
        services.AddScoped<ISharedWalletService, SharedWalletService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IInvestmentService, InvestmentService>();

        return services;
    }
}
