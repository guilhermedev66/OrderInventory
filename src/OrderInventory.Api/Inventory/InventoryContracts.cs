using System.ComponentModel.DataAnnotations;
using OrderInventory.Core.Inventory;

namespace OrderInventory.Api.Inventory;

public sealed record ReceiveStockRequest(
    [Range(1, int.MaxValue)] int Quantity,
    Guid? SupplierId);

public sealed record InventoryResponse(
    Guid ProductId,
    string ProductName,
    string Sku,
    int OnHandStock,
    int ReservedStock,
    int AvailableStock,
    int MinimumStock,
    bool BelowMinimumStock);

public sealed record StockMovementResponse(
    Guid Id,
    Guid ProductId,
    StockMovementType Type,
    int Quantity,
    DateTimeOffset OccurredAtUtc,
    Guid? SupplierId,
    Guid? OrderId);
