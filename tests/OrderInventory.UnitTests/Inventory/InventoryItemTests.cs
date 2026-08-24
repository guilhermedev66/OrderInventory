using OrderInventory.Core.Inventory;

namespace OrderInventory.UnitTests.Inventory;

public sealed class InventoryItemTests
{
    [Fact]
    public void Constructor_WithInitialStock_SetsAvailableStock()
    {
        var item = new InventoryItem(Guid.NewGuid(), 10);

        Assert.Equal(10, item.OnHandStock);
        Assert.Equal(0, item.ReservedStock);
        Assert.Equal(10, item.AvailableStock);
    }

    [Fact]
    public void Reserve_WithAvailableStock_UpdatesReservedAndAvailableStock()
    {
        var item = new InventoryItem(Guid.NewGuid(), 10);

        item.Reserve(4);

        Assert.Equal(10, item.OnHandStock);
        Assert.Equal(4, item.ReservedStock);
        Assert.Equal(6, item.AvailableStock);
    }

    [Fact]
    public void Reserve_AboveAvailableStock_DoesNotChangeBalances()
    {
        var item = new InventoryItem(Guid.NewGuid(), 5);

        var exception = Assert.Throws<InvalidOperationException>(() => item.Reserve(6));

        Assert.Equal("Insufficient available stock for reservation.", exception.Message);
        Assert.Equal(5, item.OnHandStock);
        Assert.Equal(0, item.ReservedStock);
        Assert.Equal(5, item.AvailableStock);
    }

    [Fact]
    public void ReleaseReservation_WithReservedStock_RestoresAvailability()
    {
        var item = new InventoryItem(Guid.NewGuid(), 10);
        item.Reserve(7);

        item.ReleaseReservation(3);

        Assert.Equal(4, item.ReservedStock);
        Assert.Equal(6, item.AvailableStock);
    }

    [Fact]
    public void Receive_IncreasesOnHandAndAvailableStock()
    {
        var item = new InventoryItem(Guid.NewGuid(), 3);
        item.Reserve(2);

        item.Receive(5);

        Assert.Equal(8, item.OnHandStock);
        Assert.Equal(2, item.ReservedStock);
        Assert.Equal(6, item.AvailableStock);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void StockOperations_WithNonPositiveQuantity_AreRejected(int quantity)
    {
        var item = new InventoryItem(Guid.NewGuid(), 10);

        Assert.Throws<ArgumentOutOfRangeException>(() => item.Receive(quantity));
        Assert.Throws<ArgumentOutOfRangeException>(() => item.Reserve(quantity));
        Assert.Throws<ArgumentOutOfRangeException>(() => item.ReleaseReservation(quantity));
    }
}
