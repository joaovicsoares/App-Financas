using System.Security.Claims;
using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Financas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var categories = await _categoryService.GetAllAsync(GetUserId());
        return Ok(categories);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryResponseDto>> Create([FromBody] CreateCategoryDto dto)
    {
        var result = await _categoryService.CreateAsync(GetUserId(), dto);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryResponseDto>> Update(Guid id, [FromBody] UpdateCategoryDto dto)
    {
        try
        {
            var result = await _categoryService.UpdateAsync(GetUserId(), id, dto);
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
            await _categoryService.DeleteAsync(GetUserId(), id);
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
