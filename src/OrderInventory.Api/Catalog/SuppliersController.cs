using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderInventory.Api.Common;
using OrderInventory.Core.Catalog;
using OrderInventory.Infrastructure.Persistence;

namespace OrderInventory.Api.Catalog;

[ApiController]
[Authorize(Policy = "Management")]
[Route("api/suppliers")]
public sealed class SuppliersController(OrderInventoryDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<PageResponse<SupplierResponse>> List(
        bool includeInactive = false,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = dbContext.Suppliers.AsNoTracking().AsQueryable();
        if (!includeInactive) query = query.Where(supplier => supplier.IsActive);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(supplier => supplier.Name)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(supplier => new SupplierResponse(
                supplier.Id, supplier.Name, supplier.ContactEmail, supplier.IsActive, supplier.CreatedAtUtc))
            .ToListAsync(cancellationToken);
        return new PageResponse<SupplierResponse>(items, page, pageSize, total);
    }

    [HttpPost]
    public async Task<ActionResult<SupplierResponse>> Create(CreateSupplierRequest request, CancellationToken cancellationToken)
    {
        var supplier = new Supplier(Guid.NewGuid(), request.Name, request.ContactEmail, DateTimeOffset.UtcNow);
        dbContext.Suppliers.Add(supplier);
        await dbContext.SaveChangesAsync(cancellationToken);
        var response = new SupplierResponse(supplier.Id, supplier.Name, supplier.ContactEmail,
            supplier.IsActive, supplier.CreatedAtUtc);
        return CreatedAtAction(nameof(List), new { id = supplier.Id }, response);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromQuery] bool active, CancellationToken cancellationToken)
    {
        var supplier = await dbContext.Suppliers.SingleOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Supplier was not found.");
        if (active) supplier.Activate(); else supplier.Deactivate();
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPut("{supplierId:guid}/products/{productId:guid}")]
    public async Task<IActionResult> LinkProduct(
        Guid supplierId,
        Guid productId,
        [FromQuery] string? supplierProductCode,
        CancellationToken cancellationToken)
    {
        var entitiesExist = await dbContext.Suppliers.AnyAsync(item => item.Id == supplierId, cancellationToken) &&
                            await dbContext.Products.AnyAsync(item => item.Id == productId, cancellationToken);
        if (!entitiesExist) throw new KeyNotFoundException("Product or supplier was not found.");
        if (!await dbContext.ProductSuppliers.AnyAsync(
                item => item.SupplierId == supplierId && item.ProductId == productId, cancellationToken))
        {
            dbContext.ProductSuppliers.Add(new ProductSupplier(productId, supplierId, supplierProductCode));
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        return NoContent();
    }
}
