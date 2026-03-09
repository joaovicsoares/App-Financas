using Financas.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Financas.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<SharedWallet> SharedWallets => Set<SharedWallet>();
    public DbSet<SharedWalletMember> SharedWalletMembers => Set<SharedWalletMember>();
    public DbSet<Investment> Investments => Set<Investment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Name).IsRequired().HasMaxLength(100);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(200);
            entity.Property(u => u.PasswordHash).IsRequired();
        });

        // Category
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(50);
            entity.Property(c => c.Icon).HasMaxLength(50);
            entity.Property(c => c.Color).HasMaxLength(20);

            entity.HasOne(c => c.User)
                .WithMany(u => u.Categories)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Transaction
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Amount).HasPrecision(18, 2);
            entity.Property(t => t.Description).HasMaxLength(200);

            entity.HasOne(t => t.User)
                .WithMany(u => u.Transactions)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Category)
                .WithMany(c => c.Transactions)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.SharedWallet)
                .WithMany(w => w.Transactions)
                .HasForeignKey(t => t.SharedWalletId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(t => new { t.UserId, t.Date });
            entity.HasIndex(t => t.RecurrenceGroupId);
        });

        // SharedWallet
        modelBuilder.Entity<SharedWallet>(entity =>
        {
            entity.HasKey(w => w.Id);
            entity.Property(w => w.Name).IsRequired().HasMaxLength(100);
        });

        // SharedWalletMember
        modelBuilder.Entity<SharedWalletMember>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.HasIndex(m => new { m.SharedWalletId, m.UserId }).IsUnique();

            entity.HasOne(m => m.SharedWallet)
                .WithMany(w => w.Members)
                .HasForeignKey(m => m.SharedWalletId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.User)
                .WithMany(u => u.SharedWalletMemberships)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Investment
        modelBuilder.Entity<Investment>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Name).IsRequired().HasMaxLength(100);
            entity.Property(i => i.AmountInvested).HasPrecision(18, 2);
            entity.Property(i => i.AnnualRate).HasPrecision(10, 6);
            entity.Property(i => i.RedeemedAmount).HasPrecision(18, 2);
            entity.Property(i => i.Notes).HasMaxLength(500);

            entity.HasOne(i => i.User)
                .WithMany(u => u.Investments)
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(i => i.UserId);
        });
    }
}
