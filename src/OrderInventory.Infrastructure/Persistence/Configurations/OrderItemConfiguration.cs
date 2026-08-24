using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderInventory.Core.Catalog;
using OrderInventory.Core.Orders;

namespace OrderInventory.Infrastructure.Persistence.Configurations;

internal sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items", tableBuilder =>
        {
            tableBuilder.HasCheckConstraint("ck_order_items_quantity_positive", "quantity > 0");
            tableBuilder.HasCheckConstraint("ck_order_items_unit_price_positive", "unit_price > 0");
        });

        builder.HasKey(item => item.Id);
        builder.Property(item => item.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(item => item.OrderId).HasColumnName("order_id").IsRequired();
        builder.Property(item => item.ProductId).HasColumnName("product_id").IsRequired();
        builder.Property(item => item.Quantity).HasColumnName("quantity").IsRequired();
        builder.Property(item => item.UnitPrice).HasColumnName("unit_price").HasPrecision(18, 2).IsRequired();
        builder.Ignore(item => item.Total);

        builder.HasOne<Product>()
            .WithMany()
            .HasForeignKey(item => item.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(item => item.ProductId);
        builder.HasIndex(item => new { item.OrderId, item.ProductId }).IsUnique();
    }
}
