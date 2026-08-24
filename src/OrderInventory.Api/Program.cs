using Microsoft.EntityFrameworkCore;
using OrderInventory.Infrastructure.Inventory;
using OrderInventory.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddDbContext<OrderInventoryDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("OrderInventory")
        ?? throw new InvalidOperationException(
            "Connection string 'OrderInventory' is not configured.")));
builder.Services.AddScoped<InventoryService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
