using OrderInventory.Core.Catalog;

namespace OrderInventory.UnitTests.Catalog;

public sealed class ProductTests
{
    [Fact]
    public void Constructor_NormalizesSkuAndKeepsCatalogSeparateFromStock()
    {
        var product = new Product(
            Guid.NewGuid(),
            "  Mechanical Keyboard  ",
            " kb-001 ",
            "  Compact keyboard  ",
            299.90m,
            5,
            DateTimeOffset.UtcNow);

        Assert.Equal("Mechanical Keyboard", product.Name);
        Assert.Equal("KB-001", product.Sku);
        Assert.Equal("Compact keyboard", product.Description);
        Assert.Equal(299.90m, product.Price);
        Assert.Equal(5, product.MinimumStock);
        Assert.True(product.IsActive);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructor_WithNonPositivePrice_IsRejected(decimal price)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Product(
            Guid.NewGuid(),
            "Product",
            "SKU-001",
            null,
            price,
            0,
            DateTimeOffset.UtcNow));
    }

    [Fact]
    public void Deactivate_BlocksActiveStateAndUpdatesTimestamp()
    {
        var createdAt = DateTimeOffset.UtcNow.AddMinutes(-1);
        var updatedAt = DateTimeOffset.UtcNow;
        var product = new Product(
            Guid.NewGuid(),
            "Product",
            "SKU-001",
            null,
            10m,
            0,
            createdAt);

        product.Deactivate(updatedAt);

        Assert.False(product.IsActive);
        Assert.Equal(updatedAt, product.UpdatedAtUtc);
    }
}
