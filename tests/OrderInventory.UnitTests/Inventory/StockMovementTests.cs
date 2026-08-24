using OrderInventory.Core.Inventory;

namespace OrderInventory.UnitTests.Inventory;

public sealed class StockMovementTests
{
    [Fact]
    public void Constructor_WithValidValues_CreatesMovement()
    {
        var id = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var occurredAtUtc = DateTimeOffset.UtcNow;

        var movement = new StockMovement(
            id,
            productId,
            StockMovementType.Received,
            5,
            occurredAtUtc);

        Assert.Equal(id, movement.Id);
        Assert.Equal(productId, movement.ProductId);
        Assert.Equal(StockMovementType.Received, movement.Type);
        Assert.Equal(5, movement.Quantity);
        Assert.Equal(occurredAtUtc, movement.OccurredAtUtc);
    }

    [Fact]
    public void Constructor_WithNonPositiveQuantity_IsRejected()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new StockMovement(
            Guid.NewGuid(),
            Guid.NewGuid(),
            StockMovementType.Received,
            0,
            DateTimeOffset.UtcNow));
    }

    [Fact]
    public void Constructor_WithNonUtcTimestamp_IsRejected()
    {
        var nonUtcTimestamp = new DateTimeOffset(2026, 8, 24, 12, 0, 0, TimeSpan.FromHours(-3));

        Assert.Throws<ArgumentException>(() => new StockMovement(
            Guid.NewGuid(),
            Guid.NewGuid(),
            StockMovementType.Received,
            1,
            nonUtcTimestamp));
    }
}
