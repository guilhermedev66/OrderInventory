using System.ComponentModel.DataAnnotations;

namespace OrderInventory.Api.Catalog;

public sealed record CreateProductRequest(
    [Required, MaxLength(200)] string Name,
    [Required, MaxLength(64)] string Sku,
    [MaxLength(1000)] string? Description,
    [Range(typeof(decimal), "0.01", "9999999999999999.99", ParseLimitsInInvariantCulture = true)] decimal Price,
    [Range(0, int.MaxValue)] int MinimumStock);

public sealed record UpdateProductRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(1000)] string? Description,
    [Range(0, int.MaxValue)] int MinimumStock);

public sealed record ChangePriceRequest(
    [Range(typeof(decimal), "0.01", "9999999999999999.99", ParseLimitsInInvariantCulture = true)] decimal Price);

public sealed record ProductResponse(
    Guid Id,
    string Name,
    string Sku,
    string? Description,
    decimal Price,
    bool IsActive,
    int MinimumStock,
    int AvailableStock,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public sealed record CreateSupplierRequest(
    [Required, MaxLength(200)] string Name,
    [EmailAddress, MaxLength(320)] string? ContactEmail);

public sealed record SupplierResponse(
    Guid Id,
    string Name,
    string? ContactEmail,
    bool IsActive,
    DateTimeOffset CreatedAtUtc);
