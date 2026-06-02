using System;
using System.Collections.Generic;

namespace IntelliOps.Models
{
    public class IntegrationsViewModel
    {
        public List<SapConnectorViewModel> SapConnectors { get; set; } = new();
        public List<DatabaseViewModel> Databases { get; set; } = new();
    }

    public class SapConnectorViewModel
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Endpoint { get; set; } = string.Empty;
        public string Authentication { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime LastSyncTime { get; set; }
        public string Module { get; set; } = string.Empty;
        public int LatencyMs { get; set; }
    }

    public class DatabaseViewModel
    {
        public string Id { get; set; } = string.Empty;
        public string EngineId { get; set; } = string.Empty;
        public string ConnectionName { get; set; } = string.Empty;
        public string HostString { get; set; } = string.Empty;
        public string TargetDepartment { get; set; } = string.Empty;
        public string SyncState { get; set; } = string.Empty;
        public DateTime LastHealthCheck { get; set; }
    }
}
