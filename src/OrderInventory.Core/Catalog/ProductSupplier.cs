namespace OrderInventory.Core.Catalog;

public sealed class ProductSupplier
{
    public ProductSupplier(Guid productId, Guid supplierId, string? supplierProductCode = null)
    {
        if (productId == Guid.Empty)
        {
            throw new ArgumentException("Product identifier cannot be empty.", nameof(productId));
        }

        if (supplierId == Guid.Empty)
        {
            throw new ArgumentException("Supplier identifier cannot be empty.", nameof(supplierId));
        }

        var normalizedCode = string.IsNullOrWhiteSpace(supplierProductCode)
            ? null
            : supplierProductCode.Trim();

        if (normalizedCode?.Length > 100)
        {
            throw new ArgumentException("Supplier product code cannot exceed 100 characters.", nameof(supplierProductCode));
        }

        ProductId = productId;
        SupplierId = supplierId;
        SupplierProductCode = normalizedCode;
    }

    public Guid ProductId { get; }

    public Guid SupplierId { get; }

    public string? SupplierProductCode { get; }
}
