namespace OrderInventory.Core.Orders;

public sealed class OrderItem
{
    public OrderItem(Guid id, Guid orderId, Guid productId, int quantity, decimal unitPrice)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Order item identifier cannot be empty.", nameof(id));
        }

        if (orderId == Guid.Empty)
        {
            throw new ArgumentException("Order identifier cannot be empty.", nameof(orderId));
        }

        if (productId == Guid.Empty)
        {
            throw new ArgumentException("Product identifier cannot be empty.", nameof(productId));
        }

        Id = id;
        OrderId = orderId;
        ProductId = productId;
        SetQuantity(quantity);

        if (unitPrice <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(unitPrice), "Unit price must be greater than zero.");
        }

        UnitPrice = unitPrice;
    }

    public Guid Id { get; }

    public Guid OrderId { get; }

    public Guid ProductId { get; }

    public int Quantity { get; private set; }

    public decimal UnitPrice { get; }

    public decimal Total => Quantity * UnitPrice;

    internal void SetQuantity(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        }

        Quantity = quantity;
    }
}
