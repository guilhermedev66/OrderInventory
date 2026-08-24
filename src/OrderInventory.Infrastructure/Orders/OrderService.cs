using Microsoft.EntityFrameworkCore;
using OrderInventory.Core.Inventory;
using OrderInventory.Core.Orders;
using OrderInventory.Infrastructure.Inventory;
using OrderInventory.Infrastructure.Persistence;

namespace OrderInventory.Infrastructure.Orders;

public sealed class OrderService(OrderInventoryDbContext dbContext, InventoryService inventoryService)
{
    public async Task<Order> CreateDraftAsync(
        Guid customerId,
        CancellationToken cancellationToken = default)
    {
        var order = new Order(Guid.NewGuid(), customerId, DateTimeOffset.UtcNow);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync(cancellationToken);
        return order;
    }

    public async Task AddItemAsync(
        Guid orderId,
        Guid productId,
        int quantity,
        CancellationToken cancellationToken = default)
    {
        var order = await dbContext.Orders
            .Include(item => item.Items)
            .SingleOrDefaultAsync(item => item.Id == orderId, cancellationToken)
            ?? throw new KeyNotFoundException("Order was not found.");
        var product = await dbContext.Products
            .SingleOrDefaultAsync(item => item.Id == productId && item.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Product was not found or is inactive.");

        order.AddItem(product.Id, quantity, product.Price);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SubmitAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await dbContext.Orders
            .Include(item => item.Items)
            .SingleOrDefaultAsync(item => item.Id == orderId, cancellationToken)
            ?? throw new KeyNotFoundException("Order was not found.");

        order.Submit(DateTimeOffset.UtcNow);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ConfirmAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await LockAndLoadOrderAsync(orderId, cancellationToken);

            if (order.Status is OrderStatus.Confirmed or OrderStatus.Processing or OrderStatus.Completed)
            {
                await transaction.CommitAsync(cancellationToken);
                return;
            }

            if (order.Status != OrderStatus.Pending)
            {
                throw new InvalidOperationException($"Order cannot be confirmed from status {order.Status}.");
            }

            var productIds = order.Items.Select(item => item.ProductId).ToArray();
            var activeProductCount = await dbContext.Products.CountAsync(
                product => productIds.Contains(product.Id) && product.IsActive,
                cancellationToken);

            if (activeProductCount != productIds.Length)
            {
                throw new InvalidOperationException("One or more products are missing or inactive.");
            }

            foreach (var item in order.Items.OrderBy(item => item.ProductId))
            {
                await inventoryService.ReserveWithinTransactionAsync(
                    item.ProductId,
                    item.Quantity,
                    order.Id,
                    cancellationToken);
            }

            order.Confirm(DateTimeOffset.UtcNow);
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None);
            DetachPendingMovements(orderId);
            throw;
        }
    }

    public async Task CancelAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await LockAndLoadOrderAsync(orderId, cancellationToken);

            if (order.Status == OrderStatus.Cancelled)
            {
                await transaction.CommitAsync(cancellationToken);
                return;
            }

            var mustReleaseReservations = order.Status == OrderStatus.Confirmed;

            if (mustReleaseReservations)
            {
                foreach (var item in order.Items.OrderBy(item => item.ProductId))
                {
                    await inventoryService.ReleaseWithinTransactionAsync(
                        item.ProductId,
                        item.Quantity,
                        order.Id,
                        cancellationToken);
                }
            }

            order.Cancel(DateTimeOffset.UtcNow);
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None);
            DetachPendingMovements(orderId);
            throw;
        }
    }

    public Task StartProcessingAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        return ChangeStatusAsync(orderId, (order, now) => order.StartProcessing(now), cancellationToken);
    }

    public async Task CompleteAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await LockAndLoadOrderAsync(orderId, cancellationToken);

            if (order.Status != OrderStatus.Processing)
            {
                throw new InvalidOperationException($"Order cannot be completed from status {order.Status}.");
            }

            foreach (var item in order.Items.OrderBy(item => item.ProductId))
            {
                await inventoryService.FulfillWithinTransactionAsync(
                    item.ProductId,
                    item.Quantity,
                    order.Id,
                    cancellationToken);
            }

            order.Complete(DateTimeOffset.UtcNow);
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None);
            DetachPendingMovements(orderId);
            throw;
        }
    }

    private async Task ChangeStatusAsync(
        Guid orderId,
        Action<Order, DateTimeOffset> transition,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var order = await LockAndLoadOrderAsync(orderId, cancellationToken);
        transition(order, DateTimeOffset.UtcNow);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    private async Task<Order> LockAndLoadOrderAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var rowExists = await dbContext.Database
            .SqlQuery<int>($"SELECT 1 AS \"Value\" FROM orders WHERE id = {orderId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (rowExists == 0)
        {
            throw new KeyNotFoundException("Order was not found.");
        }

        return await dbContext.Orders
            .Include(order => order.Items)
            .SingleAsync(order => order.Id == orderId, cancellationToken);
    }

    private void DetachPendingMovements(Guid orderId)
    {
        foreach (var entry in dbContext.ChangeTracker.Entries<StockMovement>()
                     .Where(entry => entry.State == EntityState.Added && entry.Entity.OrderId == orderId))
        {
            entry.State = EntityState.Detached;
        }
    }
}
