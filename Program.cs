using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using IntelliOps.Data;
using IntelliOps.Services;

var builder = WebApplication.CreateBuilder(args);

// Ensure Kestrel binds strictly to port 3000 to comply with network constraints
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(3000);
});

// Configure EF Core Connection
// Default to SQLite for sandboxed container portability, with SQL Server options available in appsettings for Visual Studio LocalDB
string connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=IntelliOps.db";
if (connectionString.Contains("IntelliOps.db"))
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlite(connectionString));
}
else
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString));
}

// Add ASP.NET Core Identity configuration
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 4;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.LogoutPath = "/Account/Logout";
    options.AccessDeniedPath = "/Account/AccessDenied";
    options.Cookie.Name = "IntelliOpsAuth";
    options.Cookie.HttpOnly = true;
    options.ExpireTimeSpan = TimeSpan.FromHours(2);
});

// Register HttpClient for external API calls like OpenRouter / Gemini
builder.Services.AddHttpClient();

// Register Core Enterprise Operations Intelligence Services
builder.Services.AddScoped<OperationalHealthService>();
builder.Services.AddScoped<AnomalyDetectionService>();
builder.Services.AddScoped<PredictionService>();
builder.Services.AddScoped<RecommendationService>();
builder.Services.AddScoped<RiskEngineService>();
builder.Services.AddScoped<AuditLogService>();
builder.Services.AddScoped<CsvImportService>();
builder.Services.AddScoped<ManualEntryService>();
builder.Services.AddScoped<AlertService>();
builder.Services.AddScoped<OpenRouterAiService>();
builder.Services.AddScoped<AnalyticsPipelineService>();

// Register MVC controllers and view mapping engines
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Auto-migration & Database Seeding inside startup scope
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        
        // Ensure database structure is up to date with migrations
        context.Database.Migrate();
        
        // Feed mock enterprise records (SAP links, initial tasks, audit logs, active departments catalog)
        DbInitializer.Initialize(context);

        // Seed ASP.NET Core Identity users and roles
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        DbInitializer.SeedIdentityAsync(userManager, roleManager).GetAwaiter().GetResult();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An instruction warning occurred while initiating database indices.");
    }
}

// Standard HTTP middleware setup
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// Setup routing conventions
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
