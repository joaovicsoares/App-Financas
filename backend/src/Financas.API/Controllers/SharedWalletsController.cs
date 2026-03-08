using System.Security.Claims;
using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Financas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SharedWalletsController : ControllerBase
{
    private readonly ISharedWalletService _walletService;

    public SharedWalletsController(ISharedWalletService walletService)
    {
        _walletService = walletService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var wallets = await _walletService.GetAllAsync(GetUserId());
        return Ok(wallets);
    }

    [HttpPost]
    public async Task<ActionResult<SharedWalletResponseDto>> Create([FromBody] CreateSharedWalletDto dto)
    {
        var result = await _walletService.CreateAsync(GetUserId(), dto);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpPost("{id}/invite")]
    public async Task<ActionResult<SharedWalletResponseDto>> InviteMember(Guid id, [FromBody] InviteMemberDto dto)
    {
        try
        {
            var result = await _walletService.InviteMemberAsync(GetUserId(), id, dto);
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

    [HttpDelete("{id}/members/{memberId}")]
    public async Task<ActionResult> RemoveMember(Guid id, Guid memberId)
    {
        try
        {
            await _walletService.RemoveMemberAsync(GetUserId(), id, memberId);
            return NoContent();
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

    [HttpPost("{id}/leave")]
    public async Task<ActionResult> Leave(Guid id)
    {
        try
        {
            await _walletService.LeaveAsync(GetUserId(), id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
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
            await _walletService.DeleteAsync(GetUserId(), id);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }
}
