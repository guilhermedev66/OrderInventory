using Microsoft.EntityFrameworkCore;
using Npgsql;
using OrderInventory.Core.Catalog;
using OrderInventory.Core.Inventory;
using OrderInventory.Infrastructure.Persistence;
using Testcontainers.PostgreSql;

namespace OrderInventory.IntegrationTests.Persistence;

public sealed class InventoryPersistenceTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:18-alpine")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        await using var context = CreateDbContext();
        await context.Database.MigrateAsync();
    }

    public Task DisposeAsync()
    {
        return _postgres.DisposeAsync().AsTask();
    }

    [Fact]
    public async Task PostgreSql_AppliesMigrationAndProtectsInventoryInvariants()
    {
        var productId = Guid.NewGuid();

        await using (var context = CreateDbContext())
        {
            context.Products.Add(CreateProduct(productId));
            var item = new InventoryItem(productId, 10);
            item.Reserve(4);

            context.InventoryItems.Add(item);
            await context.SaveChangesAsync();
        }

        await using (var context = CreateDbContext())
        {
            var item = await context.InventoryItems.SingleAsync(
                inventoryItem => inventoryItem.ProductId == productId);

            Assert.Equal(10, item.OnHandStock);
            Assert.Equal(4, item.ReservedStock);
            Assert.Equal(6, item.AvailableStock);
        }

        var invalidBalances = new[]
        {
            (OnHandStock: -1, ReservedStock: 0),
            (OnHandStock: 1, ReservedStock: -1),
            (OnHandStock: 1, ReservedStock: 2)
        };

        var invalidProductId = Guid.NewGuid();

        await using (var context = CreateDbContext())
        {
            context.Products.Add(CreateProduct(invalidProductId));
            await context.SaveChangesAsync();
        }

        foreach (var balance in invalidBalances)
        {
            await using var context = CreateDbContext();

            var exception = await Assert.ThrowsAsync<PostgresException>(() =>
                context.Database.ExecuteSqlInterpolatedAsync($"""
                    INSERT INTO inventory_items (product_id, on_hand_stock, reserved_stock)
                    VALUES ({invalidProductId}, {balance.OnHandStock}, {balance.ReservedStock})
                    """));

            Assert.Equal(PostgresErrorCodes.CheckViolation, exception.SqlState);
        }
    }

    private static Product CreateProduct(Guid productId)
    {
        return new Product(
            productId,
            "Integration product",
            $"SKU-{productId:N}",
            null,
            10.00m,
            0,
            DateTimeOffset.UtcNow);
    }

    private OrderInventoryDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<OrderInventoryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        return new OrderInventoryDbContext(options);
    }
}
