using OrderInventory.Core.Orders;

namespace OrderInventory.UnitTests.Orders;

public sealed class OrderTests
{
    [Fact]
    public void Workflow_TransitionsThroughCompletion()
    {
        var now = DateTimeOffset.UtcNow;
        var order = new Order(Guid.NewGuid(), Guid.NewGuid(), now);
        order.AddItem(Guid.NewGuid(), 2, 12.50m);

        order.Submit(now.AddSeconds(1));
        order.Confirm(now.AddSeconds(2));
        order.StartProcessing(now.AddSeconds(3));
        order.Complete(now.AddSeconds(4));

        Assert.Equal(OrderStatus.Completed, order.Status);
        Assert.Equal(25m, order.Total);
        Assert.Throws<InvalidOperationException>(() => order.Cancel(now.AddSeconds(5)));
    }

    [Fact]
    public void Submit_WithoutItems_IsRejected()
    {
        var order = new Order(Guid.NewGuid(), Guid.NewGuid(), DateTimeOffset.UtcNow);

        Assert.Throws<InvalidOperationException>(() => order.Submit(DateTimeOffset.UtcNow));
        Assert.Equal(OrderStatus.Draft, order.Status);
    }

    [Fact]
    public void Item_PreservesCapturedPrice()
    {
        var order = new Order(Guid.NewGuid(), Guid.NewGuid(), DateTimeOffset.UtcNow);
        var productId = Guid.NewGuid();

        order.AddItem(productId, 3, 19.90m);
        order.UpdateItemQuantity(productId, 4);

        var item = Assert.Single(order.Items);
        Assert.Equal(19.90m, item.UnitPrice);
        Assert.Equal(79.60m, order.Total);
    }

    [Fact]
    public void DraftOperations_AfterSubmission_AreRejected()
    {
        var order = new Order(Guid.NewGuid(), Guid.NewGuid(), DateTimeOffset.UtcNow);
        var productId = Guid.NewGuid();
        order.AddItem(productId, 1, 10m);
        order.Submit(DateTimeOffset.UtcNow);

        Assert.Throws<InvalidOperationException>(() => order.AddItem(Guid.NewGuid(), 1, 5m));
        Assert.Throws<InvalidOperationException>(() => order.UpdateItemQuantity(productId, 2));
    }
}
