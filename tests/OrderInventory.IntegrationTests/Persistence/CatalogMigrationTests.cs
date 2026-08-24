using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OrderInventory.Core.Catalog;
using OrderInventory.Infrastructure.Persistence;
using Testcontainers.PostgreSql;

namespace OrderInventory.IntegrationTests.Persistence;

public sealed class CatalogMigrationTests : IAsyncLifetime
{
    private const string PreviousMigration = "20260824163000_AddStockMovements";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:18-alpine")
        .Build();

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    [Fact]
    public async Task Migration_BackfillsProductsForExistingInventory()
    {
        var productId = Guid.NewGuid();

        await using var context = CreateDbContext();
        var migrator = context.GetService<IMigrator>();
        await migrator.MigrateAsync(PreviousMigration);

        await context.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO inventory_items (product_id, on_hand_stock, reserved_stock)
            VALUES ({productId}, 9, 2)
            """);

        await context.Database.MigrateAsync();

        var product = await context.Products.SingleAsync(item => item.Id == productId);
        var inventory = await context.InventoryItems.SingleAsync(item => item.ProductId == productId);

        Assert.StartsWith("MIG-", product.Sku);
        Assert.False(product.IsActive);
        Assert.Equal(0.01m, product.Price);
        Assert.Equal(9, inventory.OnHandStock);
        Assert.Equal(2, inventory.ReservedStock);
        Assert.Equal(7, inventory.AvailableStock);
    }

    private OrderInventoryDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<OrderInventoryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        return new OrderInventoryDbContext(options);
    }
}
