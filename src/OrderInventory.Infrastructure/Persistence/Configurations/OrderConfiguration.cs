using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderInventory.Core.Orders;

namespace OrderInventory.Infrastructure.Persistence.Configurations;

internal sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders", tableBuilder =>
            tableBuilder.HasCheckConstraint("ck_orders_total_non_negative", "total >= 0"));

        builder.HasKey(order => order.Id);
        builder.Property(order => order.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(order => order.CustomerId).HasColumnName("customer_id").IsRequired();
        builder.Property(order => order.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(order => order.Total).HasColumnName("total").HasPrecision(18, 2).IsRequired();
        builder.Property(order => order.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(order => order.UpdatedAtUtc).HasColumnName("updated_at_utc").IsRequired();
        builder.Property(order => order.SubmittedAtUtc).HasColumnName("submitted_at_utc");
        builder.Property(order => order.ConfirmedAtUtc).HasColumnName("confirmed_at_utc");
        builder.Property(order => order.ProcessingAtUtc).HasColumnName("processing_at_utc");
        builder.Property(order => order.CompletedAtUtc).HasColumnName("completed_at_utc");
        builder.Property(order => order.CancelledAtUtc).HasColumnName("cancelled_at_utc");

        builder.HasMany(order => order.Items)
            .WithOne()
            .HasForeignKey(item => item.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(order => order.Items)
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasIndex(order => new { order.CustomerId, order.CreatedAtUtc });
        builder.HasIndex(order => order.Status);
    }
}
