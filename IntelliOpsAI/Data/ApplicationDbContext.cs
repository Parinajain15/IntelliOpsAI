using Microsoft.EntityFrameworkCore;
using IntelliOpsAI.Models;

namespace IntelliOpsAI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<WorkLog> WorkLogs { get; set; }
    }
}