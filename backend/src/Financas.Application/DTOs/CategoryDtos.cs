using System.ComponentModel.DataAnnotations;
using Financas.Domain.Enums;

namespace Financas.Application.DTOs;

public class CreateCategoryDto
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Icon { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Color { get; set; } = string.Empty;

    [Required]
    public TransactionType Type { get; set; }
}

public class UpdateCategoryDto
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Icon { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Color { get; set; } = string.Empty;

    [Required]
    public TransactionType Type { get; set; }
}

public class CategoryResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public TransactionType Type { get; set; }
    public bool IsDefault { get; set; }
}
