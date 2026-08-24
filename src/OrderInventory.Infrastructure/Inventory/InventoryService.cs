using Microsoft.EntityFrameworkCore;
using OrderInventory.Core.Inventory;
using OrderInventory.Infrastructure.Persistence;

namespace OrderInventory.Infrastructure.Inventory;

public sealed class InventoryService(OrderInventoryDbContext dbContext)
{
    public async Task ReceiveAsync(
        Guid productId,
        int quantity,
        Guid? supplierId = null,
        CancellationToken cancellationToken = default)
    {
        Validate(productId, quantity);

        if (supplierId == Guid.Empty)
        {
            throw new ArgumentException("Supplier identifier cannot be empty.", nameof(supplierId));
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var affectedRows = supplierId is null
            ? await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO inventory_items (product_id, on_hand_stock, reserved_stock)
                SELECT {productId}, {quantity}, 0
                FROM products
                WHERE id = {productId}
                  AND is_active
                ON CONFLICT (product_id) DO UPDATE
                SET on_hand_stock = inventory_items.on_hand_stock + EXCLUDED.on_hand_stock
                """, cancellationToken)
            : await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO inventory_items (product_id, on_hand_stock, reserved_stock)
                SELECT p.id, {quantity}, 0
                FROM products p
                INNER JOIN product_suppliers ps ON ps.product_id = p.id
                INNER JOIN suppliers s ON s.id = ps.supplier_id
                WHERE p.id = {productId}
                  AND p.is_active
                  AND ps.supplier_id = {supplierId.Value}
                  AND s.is_active
                ON CONFLICT (product_id) DO UPDATE
                SET on_hand_stock = inventory_items.on_hand_stock + EXCLUDED.on_hand_stock
                """, cancellationToken);

        if (affectedRows != 1)
        {
            throw new InvalidOperationException(
                "Product was not found, is inactive, or is not linked to the active supplier.");
        }

        AddMovement(productId, StockMovementType.Received, quantity, supplierId, null);
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
        await ReserveWithinTransactionAsync(productId, quantity, null, cancellationToken);
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

        await ReleaseWithinTransactionAsync(productId, quantity, null, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    internal async Task ReserveWithinTransactionAsync(
        Guid productId,
        int quantity,
        Guid? orderId,
        CancellationToken cancellationToken)
    {
        Validate(productId, quantity);
        EnsureActiveTransaction();

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

        AddMovement(productId, StockMovementType.Reserved, quantity, null, orderId);
    }

    internal async Task ReleaseWithinTransactionAsync(
        Guid productId,
        int quantity,
        Guid? orderId,
        CancellationToken cancellationToken)
    {
        Validate(productId, quantity);
        EnsureActiveTransaction();

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

        AddMovement(productId, StockMovementType.ReservationReleased, quantity, null, orderId);
    }

    internal async Task FulfillWithinTransactionAsync(
        Guid productId,
        int quantity,
        Guid orderId,
        CancellationToken cancellationToken)
    {
        Validate(productId, quantity);
        EnsureActiveTransaction();

        var affectedRows = await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE inventory_items
            SET on_hand_stock = on_hand_stock - {quantity},
                reserved_stock = reserved_stock - {quantity}
            WHERE product_id = {productId}
              AND on_hand_stock >= {quantity}
              AND reserved_stock >= {quantity}
            """, cancellationToken);

        if (affectedRows != 1)
        {
            throw new InvalidOperationException("Inventory item does not contain the expected reservation.");
        }

        AddMovement(productId, StockMovementType.Fulfilled, quantity, null, orderId);
    }

    private void AddMovement(
        Guid productId,
        StockMovementType type,
        int quantity,
        Guid? supplierId,
        Guid? orderId)
    {
        dbContext.StockMovements.Add(new StockMovement(
            Guid.NewGuid(),
            productId,
            type,
            quantity,
            DateTimeOffset.UtcNow,
            supplierId,
            orderId));
    }

    private void EnsureActiveTransaction()
    {
        if (dbContext.Database.CurrentTransaction is null)
        {
            throw new InvalidOperationException("An active transaction is required for this stock operation.");
        }
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
