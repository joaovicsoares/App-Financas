using Financas.Application.DTOs;

namespace Financas.Application.Interfaces;

public interface IAuthService
{
    Task<TokenResponseDto> RegisterAsync(RegisterDto dto);
    Task<TokenResponseDto> LoginAsync(LoginDto dto);
}
