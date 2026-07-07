using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDemoUserEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("d3b07384-d113-4467-89bc-980b6fb89b4f"),
                column: "Email",
                value: "demo@milsoft.com.tr");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("d3b07384-d113-4467-89bc-980b6fb89b4f"),
                column: "Email",
                value: "demo@connecto.com");
        }
    }
}
