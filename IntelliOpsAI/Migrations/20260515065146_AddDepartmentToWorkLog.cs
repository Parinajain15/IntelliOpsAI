using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IntelliOpsAI.Migrations
{
    /// <inheritdoc />
    public partial class AddDepartmentToWorkLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "System",
                table: "WorkLogs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Department",
                table: "WorkLogs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Department",
                table: "WorkLogs");

            migrationBuilder.AlterColumn<string>(
                name: "System",
                table: "WorkLogs",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }
    }
}
