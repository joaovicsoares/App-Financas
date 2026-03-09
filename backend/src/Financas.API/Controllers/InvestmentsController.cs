using System.Security.Claims;
using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Financas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvestmentsController : ControllerBase
{
    private readonly IInvestmentService _investmentService;

    public InvestmentsController(IInvestmentService investmentService)
    {
        _investmentService = investmentService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var investments = await _investmentService.GetAllAsync(GetUserId());
        return Ok(investments);
    }

    [HttpGet("summary")]
    public async Task<ActionResult> GetSummary()
    {
        var summary = await _investmentService.GetSummaryAsync(GetUserId());
        return Ok(summary);
    }

    [HttpPost]
    public async Task<ActionResult<InvestmentResponseDto>> Create([FromBody] CreateInvestmentDto dto)
    {
        var result = await _investmentService.CreateAsync(GetUserId(), dto);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InvestmentResponseDto>> Update(Guid id, [FromBody] UpdateInvestmentDto dto)
    {
        try
        {
            var result = await _investmentService.UpdateAsync(GetUserId(), id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/redeem")]
    public async Task<ActionResult<InvestmentResponseDto>> Redeem(Guid id, [FromBody] RedeemInvestmentDto dto)
    {
        try
        {
            var result = await _investmentService.RedeemAsync(GetUserId(), id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        try
        {
            await _investmentService.DeleteAsync(GetUserId(), id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }
}
