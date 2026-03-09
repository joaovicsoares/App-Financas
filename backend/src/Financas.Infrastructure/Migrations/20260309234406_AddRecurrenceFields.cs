using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Financas.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurrenceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurrentInstallment",
                table: "Transactions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RecurrenceGroupId",
                table: "Transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceType",
                table: "Transactions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalInstallments",
                table: "Transactions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_RecurrenceGroupId",
                table: "Transactions",
                column: "RecurrenceGroupId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transactions_RecurrenceGroupId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "CurrentInstallment",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "RecurrenceGroupId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "RecurrenceType",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "TotalInstallments",
                table: "Transactions");
        }
    }
}
