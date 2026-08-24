using Microsoft.EntityFrameworkCore;
using OrderInventory.Core.Inventory;
using OrderInventory.Infrastructure.Persistence;

namespace OrderInventory.Infrastructure.Inventory;

public sealed class InventoryService(OrderInventoryDbContext dbContext)
{
    public async Task ReceiveAsync(
        Guid productId,
        int quantity,
        CancellationToken cancellationToken = default)
    {
        Validate(productId, quantity);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO inventory_items (product_id, on_hand_stock, reserved_stock)
            VALUES ({productId}, {quantity}, 0)
            ON CONFLICT (product_id) DO UPDATE
            SET on_hand_stock = inventory_items.on_hand_stock + EXCLUDED.on_hand_stock
            """, cancellationToken);

        AddMovement(productId, StockMovementType.Received, quantity);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task ReserveAsync(
        Guid productId,
        int quantity,
        CancellationToken cancellationToken = default)
    {
        Validate(productId, quantity);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var affectedRows = await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE inventory_items
            SET reserved_stock = reserved_stock + {quantity}
            WHERE product_id = {productId}
              AND on_hand_stock - reserved_stock >= {quantity}
            """, cancellationToken);

        if (affectedRows != 1)
        {
            throw new InvalidOperationException("Inventory item was not found or has insufficient available stock.");
        }

        AddMovement(productId, StockMovementType.Reserved, quantity);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task ReleaseReservationAsync(
        Guid productId,
        int quantity,
        CancellationToken cancellationToken = default)
    {
        Validate(productId, quantity);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var affectedRows = await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE inventory_items
            SET reserved_stock = reserved_stock - {quantity}
            WHERE product_id = {productId}
              AND reserved_stock >= {quantity}
            """, cancellationToken);

        if (affectedRows != 1)
        {
            throw new InvalidOperationException("Inventory item was not found or has insufficient reserved stock.");
        }

        AddMovement(productId, StockMovementType.ReservationReleased, quantity);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    private void AddMovement(Guid productId, StockMovementType type, int quantity)
    {
        dbContext.StockMovements.Add(new StockMovement(
            Guid.NewGuid(),
            productId,
            type,
            quantity,
            DateTimeOffset.UtcNow));
    }

    private static void Validate(Guid productId, int quantity)
    {
        if (productId == Guid.Empty)
        {
            throw new ArgumentException("Product identifier cannot be empty.", nameof(productId));
        }

        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        }
    }
}
