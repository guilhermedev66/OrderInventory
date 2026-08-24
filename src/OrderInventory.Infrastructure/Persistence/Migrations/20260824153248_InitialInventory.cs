using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderInventory.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "inventory_items",
                columns: table => new
                {
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    on_hand_stock = table.Column<int>(type: "integer", nullable: false),
                    reserved_stock = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_items", x => x.product_id);
                    table.CheckConstraint("ck_inventory_items_on_hand_stock_non_negative", "on_hand_stock >= 0");
                    table.CheckConstraint("ck_inventory_items_reserved_stock_non_negative", "reserved_stock >= 0");
                    table.CheckConstraint("ck_inventory_items_reserved_stock_not_above_on_hand", "reserved_stock <= on_hand_stock");
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "inventory_items");
        }
    }
}
