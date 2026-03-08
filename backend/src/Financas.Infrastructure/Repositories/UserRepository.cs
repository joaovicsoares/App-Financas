using Financas.Domain.Entities;
using Financas.Domain.Interfaces;
using Financas.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Financas.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id)
        => await _context.Users.FindAsync(id);

    public async Task<User?> GetByEmailAsync(string email)
        => await _context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower());

    public async Task<User> CreateAsync(User user)
    {
        user.Email = user.Email.ToLower();
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<bool> EmailExistsAsync(string email)
        => await _context.Users.AnyAsync(u => u.Email == email.ToLower());
}
