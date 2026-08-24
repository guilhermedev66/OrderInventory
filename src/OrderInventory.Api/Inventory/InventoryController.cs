using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderInventory.Api.Common;
using OrderInventory.Infrastructure.Inventory;
using OrderInventory.Infrastructure.Persistence;

namespace OrderInventory.Api.Inventory;

[ApiController]
[Authorize(Policy = "Management")]
[Route("api/inventory")]
public sealed class InventoryController(
    OrderInventoryDbContext dbContext,
    InventoryService inventoryService) : ControllerBase
{
    [HttpGet]
    public async Task<PageResponse<InventoryResponse>> List(
        bool belowMinimumOnly = false,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = dbContext.InventoryItems.AsNoTracking()
            .Join(dbContext.Products.AsNoTracking(), inventory => inventory.ProductId, product => product.Id,
                (inventory, product) => new { inventory, product });
        if (belowMinimumOnly)
        {
            query = query.Where(item => item.inventory.OnHandStock - item.inventory.ReservedStock < item.product.MinimumStock);
        }
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(item => item.product.Name)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(item => new InventoryResponse(
                item.product.Id, item.product.Name, item.product.Sku,
                item.inventory.OnHandStock, item.inventory.ReservedStock,
                item.inventory.OnHandStock - item.inventory.ReservedStock,
                item.product.MinimumStock,
                item.inventory.OnHandStock - item.inventory.ReservedStock < item.product.MinimumStock))
            .ToListAsync(cancellationToken);
        return new PageResponse<InventoryResponse>(items, page, pageSize, total);
    }

    [HttpPost("{productId:guid}/receipts")]
    public async Task<IActionResult> Receive(
        Guid productId,
        ReceiveStockRequest request,
        CancellationToken cancellationToken)
    {
        await inventoryService.ReceiveAsync(productId, request.Quantity, request.SupplierId, cancellationToken);
        return NoContent();
    }

    [HttpGet("movements")]
    public async Task<PageResponse<StockMovementResponse>> Movements(
        Guid? productId = null,
        Guid? orderId = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = dbContext.StockMovements.AsNoTracking().AsQueryable();
        if (productId.HasValue) query = query.Where(item => item.ProductId == productId);
        if (orderId.HasValue) query = query.Where(item => item.OrderId == orderId);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(item => item.OccurredAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(item => new StockMovementResponse(item.Id, item.ProductId, item.Type, item.Quantity,
                item.OccurredAtUtc, item.SupplierId, item.OrderId))
            .ToListAsync(cancellationToken);
        return new PageResponse<StockMovementResponse>(items, page, pageSize, total);
    }
}
