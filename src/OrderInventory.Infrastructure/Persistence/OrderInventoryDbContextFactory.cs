using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace OrderInventory.Infrastructure.Persistence;

public sealed class OrderInventoryDbContextFactory : IDesignTimeDbContextFactory<OrderInventoryDbContext>
{
    public OrderInventoryDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable(
            "ConnectionStrings__OrderInventory")
            ?? "Host=localhost;Database=order_inventory;Username=postgres";

        var options = new DbContextOptionsBuilder<OrderInventoryDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new OrderInventoryDbContext(options);
    }
}
