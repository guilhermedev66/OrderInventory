using Microsoft.EntityFrameworkCore;
using OrderInventory.Core.Inventory;

namespace OrderInventory.Infrastructure.Persistence;

public sealed class OrderInventoryDbContext(DbContextOptions<OrderInventoryDbContext> options)
    : DbContext(options)
{
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OrderInventoryDbContext).Assembly);
    }
}
