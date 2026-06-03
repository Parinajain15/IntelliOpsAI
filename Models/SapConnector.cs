using System;

namespace IntelliOps.Models
{
    public class SapConnector
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Endpoint { get; set; } = string.Empty;
        public string Authentication { get; set; } = string.Empty; // Basic, OAuth2, API Key
        public string Status { get; set; } = "Connected"; // Connected, Disconnected, Syncing, Error
        public DateTime LastSyncTime { get; set; } = DateTime.UtcNow;
        public string Module { get; set; } = string.Empty; // SAP MM, SAP SD, SAP SuccessFactors, SAP PP
    }
}
