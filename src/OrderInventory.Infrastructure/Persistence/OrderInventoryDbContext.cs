using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using OrderInventory.Core.Catalog;
using OrderInventory.Core.Inventory;
using OrderInventory.Core.Orders;
using OrderInventory.Infrastructure.Identity;

namespace OrderInventory.Infrastructure.Persistence;

public sealed class OrderInventoryDbContext(DbContextOptions<OrderInventoryDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Product> Products => Set<Product>();

    public DbSet<Supplier> Suppliers => Set<Supplier>();

    public DbSet<ProductSupplier> ProductSuppliers => Set<ProductSupplier>();

    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();

    public DbSet<StockMovement> StockMovements => Set<StockMovement>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        EnsureStockMovementsAreAppendOnly();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        EnsureStockMovementsAreAppendOnly();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        ConfigureIdentityTables(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OrderInventoryDbContext).Assembly);
    }

    private static void ConfigureIdentityTables(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApplicationUser>().ToTable("users");
        modelBuilder.Entity<IdentityRole<Guid>>().ToTable("roles");
        modelBuilder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles");
        modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        modelBuilder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims");
        modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");
        modelBuilder.Entity<ApplicationUser>()
            .Property(user => user.CreatedAtUtc)
            .HasColumnName("created_at_utc");
    }

    private void EnsureStockMovementsAreAppendOnly()
    {
        var hasMutation = ChangeTracker.Entries<StockMovement>()
            .Any(entry => entry.State is EntityState.Modified or EntityState.Deleted);

        if (hasMutation)
        {
            throw new InvalidOperationException("Stock movements are append-only and cannot be changed or deleted.");
        }
    }
}
