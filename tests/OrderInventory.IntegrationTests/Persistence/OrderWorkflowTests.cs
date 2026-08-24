using Microsoft.EntityFrameworkCore;
using OrderInventory.Core.Catalog;
using OrderInventory.Core.Inventory;
using OrderInventory.Core.Orders;
using OrderInventory.Infrastructure.Inventory;
using OrderInventory.Infrastructure.Orders;
using OrderInventory.Infrastructure.Persistence;
using Testcontainers.PostgreSql;

namespace OrderInventory.IntegrationTests.Persistence;

public sealed class OrderWorkflowTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:18-alpine")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        await using var context = CreateDbContext();
        await context.Database.MigrateAsync();
    }

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    [Fact]
    public async Task Orders_ReserveAtomicallyUnderConcurrencyAndCancelExactlyOnce()
    {
        var contestedProductId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        await CreateProductWithStockAsync(contestedProductId, "CONTENDED", 10m, 5);
        var firstOrderId = await CreatePendingOrderAsync((contestedProductId, 4));
        var secondOrderId = await CreatePendingOrderAsync((contestedProductId, 4));

        var competingResults = await Task.WhenAll(
            TryConfirmAsync(firstOrderId),
            TryConfirmAsync(secondOrderId));

        Assert.Single(competingResults, result => result);

        await using (var context = CreateDbContext())
        {
            var inventory = await context.InventoryItems.SingleAsync(
                item => item.ProductId == contestedProductId);
            var statuses = await context.Orders
                .Where(order => order.Id == firstOrderId || order.Id == secondOrderId)
                .Select(order => order.Status)
                .ToListAsync();

            Assert.Equal(4, inventory.ReservedStock);
            Assert.Contains(OrderStatus.Confirmed, statuses);
            Assert.Contains(OrderStatus.Pending, statuses);
            Assert.Equal(1, await context.StockMovements.CountAsync(movement =>
                movement.ProductId == contestedProductId
                && movement.OrderId != null
                && movement.Type == StockMovementType.Reserved));
        }

        var sufficientProductId = Guid.Parse("00000000-0000-0000-0000-000000000010");
        var insufficientProductId = Guid.Parse("00000000-0000-0000-0000-000000000020");
        await CreateProductWithStockAsync(sufficientProductId, "SUFFICIENT", 20m, 5);
        await CreateProductWithStockAsync(insufficientProductId, "INSUFFICIENT", 30m, 1);
        var atomicOrderId = await CreatePendingOrderAsync(
            (sufficientProductId, 2),
            (insufficientProductId, 2));

        await using (var context = CreateDbContext())
        {
            var service = CreateOrderService(context);
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.ConfirmAsync(atomicOrderId));
        }

        await using (var context = CreateDbContext())
        {
            var inventories = await context.InventoryItems
                .Where(item => item.ProductId == sufficientProductId || item.ProductId == insufficientProductId)
                .ToListAsync();

            Assert.All(inventories, inventory => Assert.Equal(0, inventory.ReservedStock));
            Assert.Equal(OrderStatus.Pending, (await context.Orders.FindAsync(atomicOrderId))!.Status);
            Assert.False(await context.StockMovements.AnyAsync(movement => movement.OrderId == atomicOrderId));
        }

        var idempotentProductId = Guid.Parse("00000000-0000-0000-0000-000000000030");
        await CreateProductWithStockAsync(idempotentProductId, "IDEMPOTENT", 15m, 5);
        var idempotentOrderId = await CreatePendingOrderAsync((idempotentProductId, 3));
        await ChangeProductPriceAsync(idempotentProductId, 99m);

        await Task.WhenAll(
            ConfirmAsync(idempotentOrderId),
            ConfirmAsync(idempotentOrderId));

        await using (var context = CreateDbContext())
        {
            var order = await context.Orders
                .Include(item => item.Items)
                .SingleAsync(item => item.Id == idempotentOrderId);
            var inventory = await context.InventoryItems.SingleAsync(
                item => item.ProductId == idempotentProductId);

            Assert.Equal(OrderStatus.Confirmed, order.Status);
            Assert.Equal(45m, order.Total);
            Assert.Equal(15m, Assert.Single(order.Items).UnitPrice);
            Assert.Equal(3, inventory.ReservedStock);
            Assert.Equal(1, await context.StockMovements.CountAsync(movement =>
                movement.OrderId == idempotentOrderId
                && movement.Type == StockMovementType.Reserved));
        }

        await CancelAsync(idempotentOrderId);
        await CancelAsync(idempotentOrderId);

        await using (var context = CreateDbContext())
        {
            var order = await context.Orders.FindAsync(idempotentOrderId);
            var inventory = await context.InventoryItems.SingleAsync(
                item => item.ProductId == idempotentProductId);

            Assert.Equal(OrderStatus.Cancelled, order!.Status);
            Assert.Equal(0, inventory.ReservedStock);
            Assert.Equal(1, await context.StockMovements.CountAsync(movement =>
                movement.OrderId == idempotentOrderId
                && movement.Type == StockMovementType.ReservationReleased));
        }

        var sharedProductId = Guid.Parse("00000000-0000-0000-0000-000000000050");
        await CreateProductWithStockAsync(sharedProductId, "SHARED", 12m, 10);
        var cancelledOrderId = await CreatePendingOrderAsync((sharedProductId, 3));
        var retainedOrderId = await CreatePendingOrderAsync((sharedProductId, 4));
        await ConfirmAsync(cancelledOrderId);
        await ConfirmAsync(retainedOrderId);
        await CancelAsync(cancelledOrderId);

        await using (var context = CreateDbContext())
        {
            var inventory = await context.InventoryItems.FindAsync(sharedProductId);
            Assert.Equal(4, inventory!.ReservedStock);
            Assert.Equal(1, await context.StockMovements.CountAsync(movement =>
                movement.OrderId == cancelledOrderId
                && movement.Type == StockMovementType.ReservationReleased
                && movement.Quantity == 3));
            Assert.Equal(1, await context.StockMovements.CountAsync(movement =>
                movement.OrderId == retainedOrderId
                && movement.Type == StockMovementType.Reserved
                && movement.Quantity == 4));
        }

        var inactiveProductId = Guid.Parse("00000000-0000-0000-0000-000000000060");
        await CreateProductWithStockAsync(inactiveProductId, "INACTIVE", 18m, 2);
        var inactiveOrderId = await CreatePendingOrderAsync((inactiveProductId, 1));

        await using (var context = CreateDbContext())
        {
            var product = await context.Products.FindAsync(inactiveProductId);
            product!.Deactivate(DateTimeOffset.UtcNow);
            await context.SaveChangesAsync();

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                CreateOrderService(context).ConfirmAsync(inactiveOrderId));
        }

        await using (var context = CreateDbContext())
        {
            Assert.Equal(OrderStatus.Pending, (await context.Orders.FindAsync(inactiveOrderId))!.Status);
            Assert.Equal(0, (await context.InventoryItems.FindAsync(inactiveProductId))!.ReservedStock);
            Assert.False(await context.StockMovements.AnyAsync(
                movement => movement.OrderId == inactiveOrderId));
        }
    }

    [Fact]
    public async Task CompletedOrder_CannotBeCancelled()
    {
        var productId = Guid.Parse("00000000-0000-0000-0000-000000000040");
        await CreateProductWithStockAsync(productId, "COMPLETED", 25m, 2);
        var orderId = await CreatePendingOrderAsync((productId, 1));

        await ConfirmAsync(orderId);

        await using (var context = CreateDbContext())
        {
            var service = CreateOrderService(context);
            await service.StartProcessingAsync(orderId);
            await service.CompleteAsync(orderId);
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.CancelAsync(orderId));
        }

        await using (var context = CreateDbContext())
        {
            Assert.Equal(OrderStatus.Completed, (await context.Orders.FindAsync(orderId))!.Status);
            var inventory = await context.InventoryItems.FindAsync(productId);
            Assert.Equal(1, inventory!.OnHandStock);
            Assert.Equal(0, inventory.ReservedStock);
            Assert.Equal(1, await context.StockMovements.CountAsync(movement =>
                movement.OrderId == orderId
                && movement.Type == StockMovementType.Fulfilled));
        }
    }

    private async Task CreateProductWithStockAsync(
        Guid productId,
        string sku,
        decimal price,
        int stock)
    {
        await using var context = CreateDbContext();
        context.Products.Add(new Product(
            productId,
            sku,
            sku,
            null,
            price,
            0,
            DateTimeOffset.UtcNow));
        await context.SaveChangesAsync();
        await new InventoryService(context).ReceiveAsync(productId, stock);
    }

    private async Task<Guid> CreatePendingOrderAsync(params (Guid ProductId, int Quantity)[] items)
    {
        await using var context = CreateDbContext();
        var service = CreateOrderService(context);
        var order = await service.CreateDraftAsync(Guid.NewGuid());

        foreach (var item in items)
        {
            await service.AddItemAsync(order.Id, item.ProductId, item.Quantity);
        }

        await service.SubmitAsync(order.Id);
        return order.Id;
    }

    private async Task ChangeProductPriceAsync(Guid productId, decimal price)
    {
        await using var context = CreateDbContext();
        var product = await context.Products.FindAsync(productId)
            ?? throw new InvalidOperationException("Test product was not found.");
        product.ChangePrice(price, DateTimeOffset.UtcNow);
        await context.SaveChangesAsync();
    }

    private async Task<bool> TryConfirmAsync(Guid orderId)
    {
        try
        {
            await ConfirmAsync(orderId);
            return true;
        }
        catch (InvalidOperationException exception)
            when (exception.Message == "Inventory item was not found or has insufficient available stock.")
        {
            return false;
        }
    }

    private async Task ConfirmAsync(Guid orderId)
    {
        await using var context = CreateDbContext();
        await CreateOrderService(context).ConfirmAsync(orderId);
    }

    private async Task CancelAsync(Guid orderId)
    {
        await using var context = CreateDbContext();
        await CreateOrderService(context).CancelAsync(orderId);
    }

    private static OrderService CreateOrderService(OrderInventoryDbContext context)
    {
        return new OrderService(context, new InventoryService(context));
    }

    private OrderInventoryDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<OrderInventoryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        return new OrderInventoryDbContext(options);
    }
}
