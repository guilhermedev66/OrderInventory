using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderInventory.Core.Catalog;

namespace OrderInventory.Infrastructure.Persistence.Configurations;

internal sealed class ProductSupplierConfiguration : IEntityTypeConfiguration<ProductSupplier>
{
    public void Configure(EntityTypeBuilder<ProductSupplier> builder)
    {
        builder.ToTable("product_suppliers");
        builder.HasKey(productSupplier => new { productSupplier.ProductId, productSupplier.SupplierId });
        builder.Property(productSupplier => productSupplier.ProductId).HasColumnName("product_id");
        builder.Property(productSupplier => productSupplier.SupplierId).HasColumnName("supplier_id");
        builder.Property(productSupplier => productSupplier.SupplierProductCode)
            .HasColumnName("supplier_product_code")
            .HasMaxLength(100);

        builder.HasOne<Product>()
            .WithMany()
            .HasForeignKey(productSupplier => productSupplier.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Supplier>()
            .WithMany()
            .HasForeignKey(productSupplier => productSupplier.SupplierId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(productSupplier => productSupplier.SupplierId);
    }
}
