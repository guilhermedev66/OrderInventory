using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderInventory.Core.Inventory;

namespace OrderInventory.Infrastructure.Persistence.Configurations;

internal sealed class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.ToTable("stock_movements", tableBuilder =>
            tableBuilder.HasCheckConstraint(
                "ck_stock_movements_quantity_positive",
                "quantity > 0"));

        builder.HasKey(movement => movement.Id);

        builder.Property(movement => movement.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(movement => movement.ProductId)
            .HasColumnName("product_id")
            .IsRequired();

        builder.Property(movement => movement.Type)
            .HasColumnName("type")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(movement => movement.Quantity)
            .HasColumnName("quantity")
            .IsRequired();

        builder.Property(movement => movement.OccurredAtUtc)
            .HasColumnName("occurred_at_utc")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.HasOne<InventoryItem>()
            .WithMany()
            .HasForeignKey(movement => movement.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(movement => new { movement.ProductId, movement.OccurredAtUtc });
    }
}
