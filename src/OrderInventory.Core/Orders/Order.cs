namespace OrderInventory.Core.Orders;

public sealed class Order
{
    private readonly List<OrderItem> _items = [];

    public Order(Guid id, Guid customerId, DateTimeOffset createdAtUtc)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Order identifier cannot be empty.", nameof(id));
        }

        if (customerId == Guid.Empty)
        {
            throw new ArgumentException("Customer identifier cannot be empty.", nameof(customerId));
        }

        EnsureUtc(createdAtUtc, nameof(createdAtUtc));
        Id = id;
        CustomerId = customerId;
        Status = OrderStatus.Draft;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; }

    public Guid CustomerId { get; }

    public OrderStatus Status { get; private set; }

    public decimal Total { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; }

    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public DateTimeOffset? SubmittedAtUtc { get; private set; }

    public DateTimeOffset? ConfirmedAtUtc { get; private set; }

    public DateTimeOffset? ProcessingAtUtc { get; private set; }

    public DateTimeOffset? CompletedAtUtc { get; private set; }

    public DateTimeOffset? CancelledAtUtc { get; private set; }

    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    public void AddItem(Guid productId, int quantity, decimal unitPrice)
    {
        EnsureDraft();

        if (_items.Any(item => item.ProductId == productId))
        {
            throw new InvalidOperationException("Product is already part of the order.");
        }

        _items.Add(new OrderItem(Guid.NewGuid(), Id, productId, quantity, unitPrice));
        RecalculateTotal();
    }

    public void UpdateItemQuantity(Guid productId, int quantity)
    {
        EnsureDraft();
        var item = _items.SingleOrDefault(orderItem => orderItem.ProductId == productId)
            ?? throw new InvalidOperationException("Product is not part of the order.");
        item.SetQuantity(quantity);
        RecalculateTotal();
    }

    public void Submit(DateTimeOffset occurredAtUtc)
    {
        EnsureStatus(OrderStatus.Draft);

        if (_items.Count == 0)
        {
            throw new InvalidOperationException("An order must contain at least one item before submission.");
        }

        SetUpdatedAt(occurredAtUtc);
        Status = OrderStatus.Pending;
        SubmittedAtUtc = occurredAtUtc;
    }

    public void Confirm(DateTimeOffset occurredAtUtc)
    {
        EnsureStatus(OrderStatus.Pending);
        SetUpdatedAt(occurredAtUtc);
        Status = OrderStatus.Confirmed;
        ConfirmedAtUtc = occurredAtUtc;
    }

    public void StartProcessing(DateTimeOffset occurredAtUtc)
    {
        EnsureStatus(OrderStatus.Confirmed);
        SetUpdatedAt(occurredAtUtc);
        Status = OrderStatus.Processing;
        ProcessingAtUtc = occurredAtUtc;
    }

    public void Complete(DateTimeOffset occurredAtUtc)
    {
        EnsureStatus(OrderStatus.Processing);
        SetUpdatedAt(occurredAtUtc);
        Status = OrderStatus.Completed;
        CompletedAtUtc = occurredAtUtc;
    }

    public void Cancel(DateTimeOffset occurredAtUtc)
    {
        if (Status is not (OrderStatus.Draft or OrderStatus.Pending or OrderStatus.Confirmed))
        {
            throw new InvalidOperationException($"Order cannot be cancelled from status {Status}.");
        }

        SetUpdatedAt(occurredAtUtc);
        Status = OrderStatus.Cancelled;
        CancelledAtUtc = occurredAtUtc;
    }

    private void RecalculateTotal() => Total = _items.Sum(item => item.Total);

    private void EnsureDraft() => EnsureStatus(OrderStatus.Draft);

    private void EnsureStatus(OrderStatus expected)
    {
        if (Status != expected)
        {
            throw new InvalidOperationException($"Order must be {expected} but is {Status}.");
        }
    }

    private void SetUpdatedAt(DateTimeOffset occurredAtUtc)
    {
        EnsureUtc(occurredAtUtc, nameof(occurredAtUtc));

        if (occurredAtUtc < CreatedAtUtc)
        {
            throw new ArgumentOutOfRangeException(nameof(occurredAtUtc), "Timestamp cannot precede order creation.");
        }

        UpdatedAtUtc = occurredAtUtc;
    }

    private static void EnsureUtc(DateTimeOffset value, string parameterName)
    {
        if (value.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Timestamp must be in UTC.", parameterName);
        }
    }
}
