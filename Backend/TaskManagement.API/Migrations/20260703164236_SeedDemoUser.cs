using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class SeedDemoUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FirstName", "IsActive", "LastName", "PasswordHash", "UpdatedAt", "Username" },
                values: new object[] { new Guid("d3b07384-d113-4467-89bc-980b6fb89b4f"), new DateTime(2026, 7, 3, 0, 0, 0, 0, DateTimeKind.Utc), "demo@connecto.com", "Demo", true, "Kullanıcı", "$2a$11$l135hQ1f3m3L/rD./U1H/eFhJ4x2t9x.z1w2y3u4v5w6x7y8z9A0B", new DateTime(2026, 7, 3, 0, 0, 0, 0, DateTimeKind.Utc), "demo_user" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("d3b07384-d113-4467-89bc-980b6fb89b4f"));
        }
    }
}
