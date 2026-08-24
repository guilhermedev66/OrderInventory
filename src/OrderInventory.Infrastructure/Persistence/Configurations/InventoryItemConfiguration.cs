using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderInventory.Core.Inventory;

namespace OrderInventory.Infrastructure.Persistence.Configurations;

internal sealed class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.ToTable("inventory_items", tableBuilder =>
        {
            tableBuilder.HasCheckConstraint(
                "ck_inventory_items_on_hand_stock_non_negative",
                "on_hand_stock >= 0");
            tableBuilder.HasCheckConstraint(
                "ck_inventory_items_reserved_stock_non_negative",
                "reserved_stock >= 0");
            tableBuilder.HasCheckConstraint(
                "ck_inventory_items_reserved_stock_not_above_on_hand",
                "reserved_stock <= on_hand_stock");
        });

        builder.HasKey(item => item.ProductId);

        builder.Property(item => item.ProductId)
            .HasColumnName("product_id")
            .ValueGeneratedNever();

        builder.Property(item => item.OnHandStock)
            .HasColumnName("on_hand_stock")
            .IsRequired();

        builder.Property(item => item.ReservedStock)
            .HasColumnName("reserved_stock")
            .IsRequired();

        builder.Ignore(item => item.AvailableStock);
    }
}
