using System.Security.Claims;
using Financas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Financas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult> GetDashboard()
    {
        var dashboard = await _dashboardService.GetDashboardAsync(GetUserId());
        return Ok(dashboard);
    }

    [HttpGet("wallet/{walletId}")]
    public async Task<ActionResult> GetWalletDashboard(Guid walletId)
    {
        try
        {
            var dashboard = await _dashboardService.GetWalletDashboardAsync(GetUserId(), walletId);
            return Ok(dashboard);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpGet("insights/{year}/{month}")]
    public async Task<ActionResult> GetMonthlyInsights(int year, int month)
    {
        if (month < 1 || month > 12)
            return BadRequest("Mês inválido");

        var insights = await _dashboardService.GetMonthlyInsightsAsync(GetUserId(), year, month);
        return Ok(insights);
    }
}
