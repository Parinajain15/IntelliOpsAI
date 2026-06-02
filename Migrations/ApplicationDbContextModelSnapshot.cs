using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using IntelliOps.Data;

#nullable disable

namespace IntelliOps.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    public partial class ApplicationDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("ProductVersion", "8.0.2");
        }
    }
}
