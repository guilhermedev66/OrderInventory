using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderInventory.Core.Catalog;

namespace OrderInventory.Infrastructure.Persistence.Configurations;

internal sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products", tableBuilder =>
        {
            tableBuilder.HasCheckConstraint("ck_products_price_positive", "price > 0");
            tableBuilder.HasCheckConstraint("ck_products_minimum_stock_non_negative", "minimum_stock >= 0");
        });

        builder.HasKey(product => product.Id);
        builder.Property(product => product.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(product => product.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(product => product.Sku).HasColumnName("sku").HasMaxLength(64).IsRequired();
        builder.Property(product => product.Description).HasColumnName("description").HasMaxLength(1000);
        builder.Property(product => product.Price).HasColumnName("price").HasPrecision(18, 2).IsRequired();
        builder.Property(product => product.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(product => product.MinimumStock).HasColumnName("minimum_stock").IsRequired();
        builder.Property(product => product.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(product => product.UpdatedAtUtc).HasColumnName("updated_at_utc").IsRequired();

        builder.HasIndex(product => product.Sku).IsUnique();
    }
}
