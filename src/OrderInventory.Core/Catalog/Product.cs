namespace OrderInventory.Core.Catalog;

public sealed class Product
{
    public Product(
        Guid id,
        string name,
        string sku,
        string? description,
        decimal price,
        int minimumStock,
        DateTimeOffset createdAtUtc)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Product identifier cannot be empty.", nameof(id));
        }

        Id = id;
        Name = NormalizeRequired(name, nameof(name), 200);
        Sku = NormalizeRequired(sku, nameof(sku), 64).ToUpperInvariant();
        Description = NormalizeOptional(description, nameof(description), 1000);
        Price = EnsurePositivePrice(price);
        MinimumStock = EnsureNonNegativeMinimumStock(minimumStock);
        EnsureUtc(createdAtUtc, nameof(createdAtUtc));
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
        IsActive = true;
    }

    public Guid Id { get; }

    public string Name { get; private set; }

    public string Sku { get; }

    public string? Description { get; private set; }

    public decimal Price { get; private set; }

    public bool IsActive { get; private set; }

    public int MinimumStock { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; }

    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public void UpdateDetails(
        string name,
        string? description,
        int minimumStock,
        DateTimeOffset updatedAtUtc)
    {
        Name = NormalizeRequired(name, nameof(name), 200);
        Description = NormalizeOptional(description, nameof(description), 1000);
        MinimumStock = EnsureNonNegativeMinimumStock(minimumStock);
        SetUpdatedAt(updatedAtUtc);
    }

    public void ChangePrice(decimal price, DateTimeOffset updatedAtUtc)
    {
        Price = EnsurePositivePrice(price);
        SetUpdatedAt(updatedAtUtc);
    }

    public void Activate(DateTimeOffset updatedAtUtc)
    {
        IsActive = true;
        SetUpdatedAt(updatedAtUtc);
    }

    public void Deactivate(DateTimeOffset updatedAtUtc)
    {
        IsActive = false;
        SetUpdatedAt(updatedAtUtc);
    }

    private void SetUpdatedAt(DateTimeOffset updatedAtUtc)
    {
        EnsureUtc(updatedAtUtc, nameof(updatedAtUtc));

        if (updatedAtUtc < CreatedAtUtc)
        {
            throw new ArgumentOutOfRangeException(nameof(updatedAtUtc), "Update timestamp cannot precede creation.");
        }

        UpdatedAtUtc = updatedAtUtc;
    }

    private static decimal EnsurePositivePrice(decimal price)
    {
        if (price <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(price), "Price must be greater than zero.");
        }

        return price;
    }

    private static int EnsureNonNegativeMinimumStock(int minimumStock)
    {
        if (minimumStock < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(minimumStock), "Minimum stock cannot be negative.");
        }

        return minimumStock;
    }

    private static string NormalizeRequired(string value, string parameterName, int maximumLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value cannot be empty.", parameterName);
        }

        var normalized = value.Trim();

        if (normalized.Length > maximumLength)
        {
            throw new ArgumentException($"Value cannot exceed {maximumLength} characters.", parameterName);
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? value, string parameterName, int maximumLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return NormalizeRequired(value, parameterName, maximumLength);
    }

    private static void EnsureUtc(DateTimeOffset value, string parameterName)
    {
        if (value.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Timestamp must be in UTC.", parameterName);
        }
    }
}
