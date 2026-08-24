using Microsoft.EntityFrameworkCore;
using Npgsql;
using OrderInventory.Core.Catalog;
using OrderInventory.Infrastructure.Inventory;
using OrderInventory.Infrastructure.Persistence;
using Testcontainers.PostgreSql;

namespace OrderInventory.IntegrationTests.Persistence;

public sealed class CatalogPersistenceTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:18-alpine")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        await using var context = CreateDbContext();
        await context.Database.MigrateAsync();
    }

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    [Fact]
    public async Task Catalog_EnforcesSkuAndSupplierReceiptRules()
    {
        var productId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();

        await using (var context = CreateDbContext())
        {
            context.Products.Add(new Product(
                productId,
                "Mechanical Keyboard",
                "KB-001",
                null,
                299.90m,
                5,
                DateTimeOffset.UtcNow));
            context.Suppliers.Add(new Supplier(
                supplierId,
                "Keyboard Supplier",
                "sales@example.test",
                DateTimeOffset.UtcNow));
            context.ProductSuppliers.Add(new ProductSupplier(productId, supplierId, "SUP-KB-01"));
            await context.SaveChangesAsync();

            await new InventoryService(context).ReceiveAsync(productId, 8, supplierId);
        }

        await using (var context = CreateDbContext())
        {
            var product = await context.Products.SingleAsync(item => item.Id == productId);
            var movement = await context.StockMovements.SingleAsync(
                item => item.ProductId == productId);

            Assert.Equal(299.90m, product.Price);
            Assert.Equal(supplierId, movement.SupplierId);
        }

        await using (var context = CreateDbContext())
        {
            context.Products.Add(new Product(
                Guid.NewGuid(),
                "Duplicate SKU",
                "kb-001",
                null,
                10m,
                0,
                DateTimeOffset.UtcNow));

            var exception = await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
            var postgresException = Assert.IsType<PostgresException>(exception.InnerException);
            Assert.Equal(PostgresErrorCodes.UniqueViolation, postgresException.SqlState);
        }

        await using (var context = CreateDbContext())
        {
            var product = await context.Products.SingleAsync(item => item.Id == productId);
            product.Deactivate(DateTimeOffset.UtcNow);
            await context.SaveChangesAsync();

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                new InventoryService(context).ReceiveAsync(productId, 1, supplierId));

            var supplier = await context.Suppliers.SingleAsync(item => item.Id == supplierId);
            product.Activate(DateTimeOffset.UtcNow);
            supplier.Deactivate();
            await context.SaveChangesAsync();

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                new InventoryService(context).ReceiveAsync(productId, 1, supplierId));
        }
    }

    private OrderInventoryDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<OrderInventoryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        return new OrderInventoryDbContext(options);
    }
}
