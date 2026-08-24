using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderInventory.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductsAndSuppliers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "supplier_id",
                table: "stock_movements",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    sku = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    minimum_stock = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.id);
                    table.CheckConstraint("ck_products_minimum_stock_non_negative", "minimum_stock >= 0");
                    table.CheckConstraint("ck_products_price_positive", "price > 0");
                });

            migrationBuilder.CreateTable(
                name: "suppliers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    contact_email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suppliers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "product_suppliers",
                columns: table => new
                {
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    supplier_id = table.Column<Guid>(type: "uuid", nullable: false),
                    supplier_product_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_suppliers", x => new { x.product_id, x.supplier_id });
                    table.ForeignKey(
                        name: "FK_product_suppliers_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_suppliers_suppliers_supplier_id",
                        column: x => x.supplier_id,
                        principalTable: "suppliers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_stock_movements_supplier_id",
                table: "stock_movements",
                column: "supplier_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_suppliers_supplier_id",
                table: "product_suppliers",
                column: "supplier_id");

            migrationBuilder.CreateIndex(
                name: "IX_products_sku",
                table: "products",
                column: "sku",
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO products (
                    id,
                    name,
                    sku,
                    description,
                    price,
                    is_active,
                    minimum_stock,
                    created_at_utc,
                    updated_at_utc)
                SELECT
                    product_id,
                    'Migrated product ' || product_id,
                    'MIG-' || replace(product_id::text, '-', ''),
                    'Created automatically while adding the product catalog.',
                    0.01,
                    FALSE,
                    0,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                FROM inventory_items
                ON CONFLICT (id) DO NOTHING;
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_inventory_items_products_product_id",
                table: "inventory_items",
                column: "product_id",
                principalTable: "products",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_stock_movements_suppliers_supplier_id",
                table: "stock_movements",
                column: "supplier_id",
                principalTable: "suppliers",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_inventory_items_products_product_id",
                table: "inventory_items");

            migrationBuilder.DropForeignKey(
                name: "FK_stock_movements_suppliers_supplier_id",
                table: "stock_movements");

            migrationBuilder.DropTable(
                name: "product_suppliers");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "suppliers");

            migrationBuilder.DropIndex(
                name: "IX_stock_movements_supplier_id",
                table: "stock_movements");

            migrationBuilder.DropColumn(
                name: "supplier_id",
                table: "stock_movements");
        }
    }
}
