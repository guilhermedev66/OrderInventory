using Microsoft.EntityFrameworkCore;
using Npgsql;
using OrderInventory.Core.Catalog;
using OrderInventory.Core.Inventory;
using OrderInventory.Infrastructure.Inventory;
using OrderInventory.Infrastructure.Persistence;
using Testcontainers.PostgreSql;

namespace OrderInventory.IntegrationTests.Persistence;

public sealed class InventoryOperationsTests : IAsyncLifetime
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
    public async Task Operations_AreAtomicConcurrentAndAppendOnly()
    {
        var productId = Guid.NewGuid();

        await using (var context = CreateDbContext())
        {
            context.Products.Add(new Product(
                productId,
                "Concurrent product",
                $"SKU-{productId:N}",
                null,
                10.00m,
                0,
                DateTimeOffset.UtcNow));
            await context.SaveChangesAsync();
            await new InventoryService(context).ReceiveAsync(productId, 10);
        }

        var reservationResults = await Task.WhenAll(
            TryReserveAsync(productId, 7),
            TryReserveAsync(productId, 7));

        Assert.Single(reservationResults, succeeded => succeeded);

        await using (var context = CreateDbContext())
        {
            var service = new InventoryService(context);
            await service.ReleaseReservationAsync(productId, 2);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.ReleaseReservationAsync(productId, 6));
        }

        Guid movementId;

        await using (var context = CreateDbContext())
        {
            var item = await context.InventoryItems.SingleAsync(
                inventoryItem => inventoryItem.ProductId == productId);
            var movements = await context.StockMovements
                .Where(movement => movement.ProductId == productId)
                .ToListAsync();

            Assert.Equal(10, item.OnHandStock);
            Assert.Equal(5, item.ReservedStock);
            Assert.Equal(5, item.AvailableStock);
            Assert.Collection(
                movements.OrderBy(movement => movement.Type),
                movement => AssertMovement(movement, StockMovementType.Received, 10),
                movement => AssertMovement(movement, StockMovementType.Reserved, 7),
                movement => AssertMovement(movement, StockMovementType.ReservationReleased, 2));

            movementId = movements[0].Id;
        }

        await using (var context = CreateDbContext())
        {
            var movement = await context.StockMovements.SingleAsync(
                stockMovement => stockMovement.Id == movementId);
            context.StockMovements.Remove(movement);

            await Assert.ThrowsAsync<InvalidOperationException>(() => context.SaveChangesAsync());
        }

        await using (var context = CreateDbContext())
        {
            var deleteException = await Assert.ThrowsAsync<PostgresException>(() =>
                context.Database.ExecuteSqlInterpolatedAsync($"""
                    DELETE FROM stock_movements WHERE id = {movementId}
                    """));

            Assert.Equal("55000", deleteException.SqlState);
        }

        await using (var context = CreateDbContext())
        {
            var updateException = await Assert.ThrowsAsync<PostgresException>(() =>
                context.Database.ExecuteSqlInterpolatedAsync($"""
                    UPDATE stock_movements SET quantity = quantity + 1 WHERE id = {movementId}
                    """));

            Assert.Equal("55000", updateException.SqlState);
        }

        await using (var context = CreateDbContext())
        {
            Assert.Equal(3, await context.StockMovements.CountAsync(
                movement => movement.ProductId == productId));
        }
    }

    private async Task<bool> TryReserveAsync(Guid productId, int quantity)
    {
        await using var context = CreateDbContext();

        try
        {
            await new InventoryService(context).ReserveAsync(productId, quantity);
            return true;
        }
        catch (InvalidOperationException exception)
            when (exception.Message == "Inventory item was not found or has insufficient available stock.")
        {
            return false;
        }
    }

    private OrderInventoryDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<OrderInventoryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        return new OrderInventoryDbContext(options);
    }

    private static void AssertMovement(
        StockMovement movement,
        StockMovementType expectedType,
        int expectedQuantity)
    {
        Assert.Equal(expectedType, movement.Type);
        Assert.Equal(expectedQuantity, movement.Quantity);
        Assert.Equal(TimeSpan.Zero, movement.OccurredAtUtc.Offset);
    }
}
