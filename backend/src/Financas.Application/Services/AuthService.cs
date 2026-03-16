using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Financas.Application.DTOs;
using Financas.Application.Interfaces;
using Financas.Domain.Entities;
using Financas.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Financas.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ICategoryService _categoryService;
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository userRepository, ICategoryService categoryService, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _categoryService = categoryService;
        _configuration = configuration;
    }

    public async Task<TokenResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (await _userRepository.EmailExistsAsync(dto.Email))
            throw new InvalidOperationException("Email já está em uso.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateAsync(user);
        await _categoryService.SeedDefaultCategoriesAsync(user.Id);

        return await GenerateToken(user);
    }

    public async Task<TokenResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(dto.Email)
            ?? throw new InvalidOperationException("Email ou senha inválidos.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new InvalidOperationException("Email ou senha inválidos.");

        return await GenerateToken(user);
    }

    public async Task<TokenResponseDto> RefreshTokenAsync(RefreshTokenDto dto)
    {
        var user = await _userRepository.GetByRefreshTokenAsync(dto.RefreshToken)
            ?? throw new InvalidOperationException("Refresh token inválido.");

        if (user.RefreshTokenExpiry < DateTime.UtcNow)
            throw new InvalidOperationException("Refresh token expirado.");

        return await GenerateToken(user);
    }

    private async Task<TokenResponseDto> GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured")));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name)
        };

        var accessTokenExpiry = DateTime.UtcNow.AddHours(1);
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: accessTokenExpiry,
            signingCredentials: credentials
        );

        var refreshToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        var refreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = refreshTokenExpiry;

        await _userRepository.UpdateAsync(user);

        return new TokenResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            TokenExpiry = accessTokenExpiry,
            RefreshToken = refreshToken,
            RefreshTokenExpiry = refreshTokenExpiry,
            UserName = user.Name,
            Email = user.Email,
            UserId = user.Id
        };
    }
}
