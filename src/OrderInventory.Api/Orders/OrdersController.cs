using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderInventory.Api.Common;
using OrderInventory.Core.Orders;
using OrderInventory.Infrastructure.Orders;
using OrderInventory.Infrastructure.Persistence;

namespace OrderInventory.Api.Orders;

[ApiController]
[Authorize]
[Route("api/orders")]
public sealed class OrdersController(
    OrderInventoryDbContext dbContext,
    OrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<PageResponse<OrderResponse>> ListMine(
        OrderStatus? status = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var customerId = User.GetUserId();
        return await ListAsync(customerId, status, page, pageSize, cancellationToken);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderResponse>> GetMine(Guid id, CancellationToken cancellationToken)
    {
        var response = await QueryOrders(User.GetUserId())
            .Where(order => order.Id == id)
            .Select(ToProjection())
            .SingleOrDefaultAsync(cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<OrderResponse>> Create(CancellationToken cancellationToken)
    {
        var order = await orderService.CreateDraftAsync(User.GetUserId(), cancellationToken);
        var response = EmptyResponse(order);
        return CreatedAtAction(nameof(GetMine), new { id = order.Id }, response);
    }

    [HttpPost("{id:guid}/items")]
    public async Task<IActionResult> AddItem(Guid id, AddOrderItemRequest request, CancellationToken cancellationToken)
    {
        await EnsureOwnedAsync(id, cancellationToken);
        await orderService.AddItemAsync(id, request.ProductId, request.Quantity, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken cancellationToken)
    {
        await EnsureOwnedAsync(id, cancellationToken);
        await orderService.SubmitAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        await EnsureOwnedAsync(id, cancellationToken);
        await orderService.CancelAsync(id, cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = "Management")]
    [HttpGet("management")]
    public Task<PageResponse<OrderResponse>> ListForManagement(
        Guid? customerId = null,
        OrderStatus? status = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        ListAsync(customerId, status, page, pageSize, cancellationToken);

    [Authorize(Policy = "Management")]
    [HttpPost("{id:guid}/confirm")]
    public async Task<IActionResult> Confirm(Guid id, CancellationToken cancellationToken)
    {
        await orderService.ConfirmAsync(id, cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = "Management")]
    [HttpPost("{id:guid}/process")]
    public async Task<IActionResult> Process(Guid id, CancellationToken cancellationToken)
    {
        await orderService.StartProcessingAsync(id, cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = "Management")]
    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, CancellationToken cancellationToken)
    {
        await orderService.CompleteAsync(id, cancellationToken);
        return NoContent();
    }

    private async Task EnsureOwnedAsync(Guid id, CancellationToken cancellationToken)
    {
        if (!await dbContext.Orders.AsNoTracking()
                .AnyAsync(order => order.Id == id && order.CustomerId == User.GetUserId(), cancellationToken))
        {
            throw new KeyNotFoundException("Order was not found.");
        }
    }

    private async Task<PageResponse<OrderResponse>> ListAsync(
        Guid? customerId,
        OrderStatus? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = QueryOrders(customerId);
        if (status.HasValue) query = query.Where(order => order.Status == status);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(order => order.CreatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(ToProjection())
            .ToListAsync(cancellationToken);
        return new PageResponse<OrderResponse>(items, page, pageSize, total);
    }

    private IQueryable<Order> QueryOrders(Guid? customerId)
    {
        var query = dbContext.Orders.AsNoTracking();
        return customerId.HasValue ? query.Where(order => order.CustomerId == customerId) : query;
    }

    private System.Linq.Expressions.Expression<Func<Order, OrderResponse>> ToProjection() => order =>
        new OrderResponse(
            order.Id, order.CustomerId, order.Status, order.Total,
            order.Items.Select(item => new OrderItemResponse(
                item.Id, item.ProductId,
                dbContext.Products.Where(product => product.Id == item.ProductId)
                    .Select(product => product.Name).Single(),
                dbContext.Products.Where(product => product.Id == item.ProductId)
                    .Select(product => product.Sku).Single(),
                item.Quantity, item.UnitPrice, item.Quantity * item.UnitPrice)).ToList(),
            order.CreatedAtUtc, order.UpdatedAtUtc, order.SubmittedAtUtc, order.ConfirmedAtUtc,
            order.ProcessingAtUtc, order.CompletedAtUtc, order.CancelledAtUtc);

    private static OrderResponse EmptyResponse(Order order) => new(
        order.Id, order.CustomerId, order.Status, order.Total, [], order.CreatedAtUtc, order.UpdatedAtUtc,
        order.SubmittedAtUtc, order.ConfirmedAtUtc, order.ProcessingAtUtc, order.CompletedAtUtc, order.CancelledAtUtc);
}
