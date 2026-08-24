using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderInventory.Core.Catalog;

namespace OrderInventory.Infrastructure.Persistence.Configurations;

internal sealed class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> builder)
    {
        builder.ToTable("suppliers");
        builder.HasKey(supplier => supplier.Id);
        builder.Property(supplier => supplier.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(supplier => supplier.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(supplier => supplier.ContactEmail).HasColumnName("contact_email").HasMaxLength(320);
        builder.Property(supplier => supplier.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(supplier => supplier.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
    }
}
