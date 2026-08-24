using System.ComponentModel.DataAnnotations;
using OrderInventory.Core.Orders;

namespace OrderInventory.Api.Orders;

public sealed record AddOrderItemRequest(
    Guid ProductId,
    [Range(1, int.MaxValue)] int Quantity);

public sealed record OrderItemResponse(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string Sku,
    int Quantity,
    decimal UnitPrice,
    decimal Total);

public sealed record OrderResponse(
    Guid Id,
    Guid CustomerId,
    OrderStatus Status,
    decimal Total,
    IReadOnlyList<OrderItemResponse> Items,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    DateTimeOffset? SubmittedAtUtc,
    DateTimeOffset? ConfirmedAtUtc,
    DateTimeOffset? ProcessingAtUtc,
    DateTimeOffset? CompletedAtUtc,
    DateTimeOffset? CancelledAtUtc);
