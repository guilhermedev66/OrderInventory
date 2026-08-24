using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderInventory.Api.Common;
using OrderInventory.Core.Catalog;
using OrderInventory.Infrastructure.Persistence;

namespace OrderInventory.Api.Catalog;

[ApiController]
[Route("api/products")]
public sealed class ProductsController(OrderInventoryDbContext dbContext) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<PageResponse<ProductResponse>> List(
        string? search = null,
        bool includeInactive = false,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var canViewInactive = includeInactive && (User.IsInRole("Manager") || User.IsInRole("Admin"));
        var query = dbContext.Products.AsNoTracking().AsQueryable();

        if (!canViewInactive)
        {
            query = query.Where(product => product.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(product => EF.Functions.ILike(product.Name, $"%{term}%") ||
                                           EF.Functions.ILike(product.Sku, $"%{term}%"));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(product => product.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .GroupJoin(
                dbContext.InventoryItems.AsNoTracking(),
                product => product.Id,
                inventory => inventory.ProductId,
                (product, inventory) => new { product, inventory = inventory.FirstOrDefault() })
            .Select(item => new ProductResponse(
                item.product.Id,
                item.product.Name,
                item.product.Sku,
                item.product.Description,
                item.product.Price,
                item.product.IsActive,
                item.product.MinimumStock,
                item.inventory == null ? 0 : item.inventory.OnHandStock - item.inventory.ReservedStock,
                item.product.CreatedAtUtc,
                item.product.UpdatedAtUtc))
            .ToListAsync(cancellationToken);

        return new PageResponse<ProductResponse>(items, page, pageSize, total);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var canViewInactive = User.IsInRole("Manager") || User.IsInRole("Admin");
        var item = await dbContext.Products.AsNoTracking()
            .Where(product => product.Id == id && (product.IsActive || canViewInactive))
            .GroupJoin(
                dbContext.InventoryItems.AsNoTracking(),
                product => product.Id,
                inventory => inventory.ProductId,
                (product, inventory) => new { product, inventory = inventory.FirstOrDefault() })
            .Select(item => new ProductResponse(
                item.product.Id, item.product.Name, item.product.Sku, item.product.Description,
                item.product.Price, item.product.IsActive, item.product.MinimumStock,
                item.inventory == null ? 0 : item.inventory.OnHandStock - item.inventory.ReservedStock,
                item.product.CreatedAtUtc, item.product.UpdatedAtUtc))
            .SingleOrDefaultAsync(cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [Authorize(Policy = "Management")]
    [HttpPost]
    public async Task<ActionResult<ProductResponse>> Create(CreateProductRequest request, CancellationToken cancellationToken)
    {
        var product = new Product(Guid.NewGuid(), request.Name, request.Sku, request.Description,
            request.Price, request.MinimumStock, DateTimeOffset.UtcNow);
        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = product.Id }, ToResponse(product));
    }

    [Authorize(Policy = "Management")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult> Update(Guid id, UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var product = await FindAsync(id, cancellationToken);
        product.UpdateDetails(request.Name, request.Description, request.MinimumStock, DateTimeOffset.UtcNow);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = "Management")]
    [HttpPut("{id:guid}/price")]
    public async Task<ActionResult> ChangePrice(Guid id, ChangePriceRequest request, CancellationToken cancellationToken)
    {
        var product = await FindAsync(id, cancellationToken);
        product.ChangePrice(request.Price, DateTimeOffset.UtcNow);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = "Management")]
    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult> ChangeStatus(Guid id, [FromQuery] bool active, CancellationToken cancellationToken)
    {
        var product = await FindAsync(id, cancellationToken);
        if (active) product.Activate(DateTimeOffset.UtcNow); else product.Deactivate(DateTimeOffset.UtcNow);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<Product> FindAsync(Guid id, CancellationToken cancellationToken) =>
        await dbContext.Products.SingleOrDefaultAsync(product => product.Id == id, cancellationToken)
        ?? throw new KeyNotFoundException("Product was not found.");

    private static ProductResponse ToResponse(Product product) => new(
        product.Id, product.Name, product.Sku, product.Description, product.Price, product.IsActive,
        product.MinimumStock, 0, product.CreatedAtUtc, product.UpdatedAtUtc);
}
