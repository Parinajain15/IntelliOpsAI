using System;

namespace IntelliOps.Models
{
    public class DataSource
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Server { get; set; } = string.Empty;
        public string Database { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Status { get; set; } = "Connected"; // Connected, Disconnected, Error
        public string SyncSchedule { get; set; } = "Hourly"; // Hourly, Daily, Weekly
    }
}
