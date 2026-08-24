namespace OrderInventory.Core.Catalog;

public sealed class Supplier
{
    public Supplier(Guid id, string name, string? contactEmail, DateTimeOffset createdAtUtc)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Supplier identifier cannot be empty.", nameof(id));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Supplier name cannot be empty.", nameof(name));
        }

        var normalizedName = name.Trim();

        if (normalizedName.Length > 200)
        {
            throw new ArgumentException("Supplier name cannot exceed 200 characters.", nameof(name));
        }

        var normalizedEmail = string.IsNullOrWhiteSpace(contactEmail)
            ? null
            : contactEmail.Trim().ToLowerInvariant();

        if (normalizedEmail?.Length > 320)
        {
            throw new ArgumentException("Contact email cannot exceed 320 characters.", nameof(contactEmail));
        }

        if (createdAtUtc.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Timestamp must be in UTC.", nameof(createdAtUtc));
        }

        Id = id;
        Name = normalizedName;
        ContactEmail = normalizedEmail;
        IsActive = true;
        CreatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; }

    public string Name { get; private set; }

    public string? ContactEmail { get; private set; }

    public bool IsActive { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;
}
