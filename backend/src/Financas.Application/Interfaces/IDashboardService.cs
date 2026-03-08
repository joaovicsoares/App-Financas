using Financas.Application.DTOs;

namespace Financas.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(Guid userId);
    Task<DashboardDto> GetWalletDashboardAsync(Guid userId, Guid walletId);
}
