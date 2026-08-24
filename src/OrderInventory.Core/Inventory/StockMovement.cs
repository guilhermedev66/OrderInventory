namespace OrderInventory.Core.Inventory;

public sealed class StockMovement
{
    public StockMovement(
        Guid id,
        Guid productId,
        StockMovementType type,
        int quantity,
        DateTimeOffset occurredAtUtc)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Movement identifier cannot be empty.", nameof(id));
        }

        if (productId == Guid.Empty)
        {
            throw new ArgumentException("Product identifier cannot be empty.", nameof(productId));
        }

        if (!Enum.IsDefined(type))
        {
            throw new ArgumentOutOfRangeException(nameof(type), "Movement type is invalid.");
        }

        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        }

        if (occurredAtUtc.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Movement timestamp must be in UTC.", nameof(occurredAtUtc));
        }

        Id = id;
        ProductId = productId;
        Type = type;
        Quantity = quantity;
        OccurredAtUtc = occurredAtUtc;
    }

    public Guid Id { get; }

    public Guid ProductId { get; }

    public StockMovementType Type { get; }

    public int Quantity { get; }

    public DateTimeOffset OccurredAtUtc { get; }
}
