using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IntelliOpsAI.Migrations
{
    /// <inheritdoc />
    public partial class AddDateToWorkLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "System",
                table: "WorkLogs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "System",
                table: "WorkLogs");
        }
    }
}
