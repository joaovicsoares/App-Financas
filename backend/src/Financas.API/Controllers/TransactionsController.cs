using System.Security.Claims;
using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Financas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] Guid? walletId)
    {
        try
        {
            if (walletId.HasValue)
            {
                var walletTransactions = await _transactionService.GetByWalletAsync(GetUserId(), walletId.Value, startDate, endDate);
                return Ok(walletTransactions);
            }

            var transactions = await _transactionService.GetAllAsync(GetUserId(), startDate, endDate);
            return Ok(transactions);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpPost]
    public async Task<ActionResult<TransactionResponseDto>> Create([FromBody] CreateTransactionDto dto)
    {
        try
        {
            var result = await _transactionService.CreateAsync(GetUserId(), dto);
            return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TransactionResponseDto>> Update(Guid id, [FromBody] UpdateTransactionDto dto)
    {
        try
        {
            var result = await _transactionService.UpdateAsync(GetUserId(), id, dto);
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
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        try
        {
            await _transactionService.DeleteAsync(GetUserId(), id);
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
