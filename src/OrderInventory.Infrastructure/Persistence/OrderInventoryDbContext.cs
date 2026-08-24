using Microsoft.EntityFrameworkCore;
using OrderInventory.Core.Inventory;

namespace OrderInventory.Infrastructure.Persistence;

public sealed class OrderInventoryDbContext(DbContextOptions<OrderInventoryDbContext> options)
    : DbContext(options)
{
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();

    public DbSet<StockMovement> StockMovements => Set<StockMovement>();

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
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OrderInventoryDbContext).Assembly);
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
