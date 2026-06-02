using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using IntelliOps.Models;

namespace IntelliOps.Data
{
    public class ApplicationDbContext : IdentityDbContext<IdentityUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; } = null!;
        public DbSet<Department> Departments { get; set; } = null!;
        public DbSet<TaskRecord> Tasks { get; set; } = null!;
        public DbSet<OperationalLog> OperationalLogs { get; set; } = null!;
        public DbSet<Alert> Alerts { get; set; } = null!;
        public DbSet<DepartmentRisk> DepartmentRisks { get; set; } = null!;
        public DbSet<SapConnector> SapConnectors { get; set; } = null!;
        public DbSet<DataSource> DataSources { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<AiInsightLog> AiInsightLogs { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Serialization for Alert.Comments
            modelBuilder.Entity<Alert>()
                .Property(x => x.Comments)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<AlertComment>>(v, (JsonSerializerOptions?)null) ?? new List<AlertComment>()
                );

            // Serialization for AiInsightLog lists
            modelBuilder.Entity<AiInsightLog>()
                .Property(x => x.TopRisks)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
                );

            modelBuilder.Entity<AiInsightLog>()
                .Property(x => x.DepartmentIssues)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
                );

            modelBuilder.Entity<AiInsightLog>()
                .Property(x => x.SapConcerns)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
                );

            modelBuilder.Entity<AiInsightLog>()
                .Property(x => x.SlaConcerns)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
                );

            modelBuilder.Entity<AiInsightLog>()
                .Property(x => x.Bottlenecks)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
                );

            modelBuilder.Entity<AiInsightLog>()
                .Property(x => x.RecommendedActions)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
                );

            modelBuilder.Entity<AiInsightLog>()
                .Property(x => x.PriorityPlan24h)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
                );
        }
    }
}
