namespace OrderInventory.Core.Inventory;

public sealed class InventoryItem
{
    public InventoryItem(Guid productId, int onHandStock = 0)
    {
        if (productId == Guid.Empty)
        {
            throw new ArgumentException("Product identifier cannot be empty.", nameof(productId));
        }

        if (onHandStock < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(onHandStock), "On-hand stock cannot be negative.");
        }

        ProductId = productId;
        OnHandStock = onHandStock;
    }

    public Guid ProductId { get; }

    public int OnHandStock { get; private set; }

    public int ReservedStock { get; private set; }

    public int AvailableStock => OnHandStock - ReservedStock;

    public void Receive(int quantity)
    {
        EnsurePositive(quantity);
        OnHandStock = checked(OnHandStock + quantity);
    }

    public void Reserve(int quantity)
    {
        EnsurePositive(quantity);

        if (quantity > AvailableStock)
        {
            throw new InvalidOperationException("Insufficient available stock for reservation.");
        }

        ReservedStock += quantity;
    }

    public void ReleaseReservation(int quantity)
    {
        EnsurePositive(quantity);

        if (quantity > ReservedStock)
        {
            throw new InvalidOperationException("Cannot release more stock than is reserved.");
        }

        ReservedStock -= quantity;
    }

    private static void EnsurePositive(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        }
    }
}
