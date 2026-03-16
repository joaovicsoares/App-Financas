using System.ComponentModel.DataAnnotations;

namespace Financas.Domain.Entities;

public class TelegramIntegration
{
    public long Id { get; set; }
    
    public long TelegramUserId { get; set; }
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string RefreshToken { get; set; } = string.Empty;
    
    public string? AccessToken { get; set; }
    
    public DateTime? AccessTokenExpiresAt { get; set; }
    
    public DateTime? RefreshTokenExpiresAt { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
