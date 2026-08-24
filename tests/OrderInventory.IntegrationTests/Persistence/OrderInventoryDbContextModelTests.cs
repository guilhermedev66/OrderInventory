using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using OrderInventory.Core.Inventory;
using OrderInventory.Infrastructure.Persistence;

namespace OrderInventory.IntegrationTests.Persistence;

public sealed class OrderInventoryDbContextModelTests
{
    [Fact]
    public void InventoryItem_HasDatabaseConstraintsForStockInvariants()
    {
        var options = new DbContextOptionsBuilder<OrderInventoryDbContext>()
            .UseNpgsql("Host=localhost;Database=order_inventory;Username=postgres")
            .Options;

        using var context = new OrderInventoryDbContext(options);
        var model = context.GetService<IDesignTimeModel>().Model;
        var entityType = model.FindEntityType(typeof(InventoryItem));

        Assert.NotNull(entityType);

        var constraints = entityType.GetCheckConstraints();

        Assert.Contains(constraints, constraint =>
            constraint.Name == "ck_inventory_items_on_hand_stock_non_negative"
            && constraint.Sql == "on_hand_stock >= 0");
        Assert.Contains(constraints, constraint =>
            constraint.Name == "ck_inventory_items_reserved_stock_non_negative"
            && constraint.Sql == "reserved_stock >= 0");
        Assert.Contains(constraints, constraint =>
            constraint.Name == "ck_inventory_items_reserved_stock_not_above_on_hand"
            && constraint.Sql == "reserved_stock <= on_hand_stock");
    }
}
