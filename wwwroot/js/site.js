/**
 * IntelliOps AI - Enterprise SaaS JavaScript Actions
 * Client-side interface interactive helpers, table search filters, 
 * CSV drag & drop triggers, and automatic flash alerts timers.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sidebar Navigation Highlighter relative to URL Path
    initializeNavigationHighlighter();

    // 1b. Update page header title
    updatePageHeaderTitle();

    // 2. Interactive Global Telemetry Search Box Filter
    initializeGlobalSearchFilter();

    // 3. Automated Alert Dismiss timers
    initializeToastDismissers();

    // 4. Drag and Drop CSV parser handlers for Upload section if present
    initializeCsvUploadInteractivity();

    // 5. Button and form field submit block protections
    initializeSubmitProtections();
});

/**
 * Ensures the correct sidebar navigation link receives focus/highlight styling based on location path
 */
function initializeNavigationHighlighter() {
    const activePath = window.location.pathname;
    const sidebarConfig = {
        "/": "nav-dashboard",
        "/ManualEntry": "nav-manual",
        "/Upload": "nav-upload",
        "/Alerts": "nav-alerts",
        "/Recommendations": "nav-recommendations",
        "/AiInsights": "nav-ai",
        "/Integrations": "nav-integrations"
    };

    const targetLinkId = sidebarConfig[activePath] || "nav-dashboard";
    const linkElement = document.getElementById(targetLinkId);
    if (linkElement) {
        linkElement.classList.add("bg-[#121c32]", "text-white", "border-l-4", "border-emerald-500");
    }
}

/**
 * Updates the page title dynamically in the layout header berdasarkan path URL
 */
function updatePageHeaderTitle() {
    const loc = window.location.pathname;
    const headerTitles = {
        "/": "Executive Insights Dashboard",
        "/ManualEntry": "Operational Manual Entry & Logs Intake",
        "/Upload": "CSV Analytics Pipeline & Bulk Ingestion",
        "/Alerts": "Incident Root Cause Resolution Desk",
        "/Recommendations": "SLA Queue Optimizer & Re-balancing Engine",
        "/AiInsights": "Corporate C-Suite AI Briefing Hub",
        "/Integrations": "SAP ERP Global Interfaces Controller"
    };
    const titleElement = document.getElementById("page-title");
    if (titleElement) {
        titleElement.textContent = headerTitles[loc] || "IntelliOps Control Panel";
    }
}

/**
 * Filter tables in the current workspace based on global header search input
 */
function initializeGlobalSearchFilter() {
    const searchInputs = document.querySelectorAll('input[placeholder*="query"], input[placeholder*="Global"]');
    if (searchInputs.length === 0) return;

    searchInputs.forEach(searchInput => {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const dataTables = document.querySelectorAll("table");

            dataTables.forEach(table => {
                const rows = table.querySelectorAll("tbody tr");
                rows.forEach(row => {
                    const rowText = row.textContent.toLowerCase();
                    if (rowText.includes(query)) {
                        row.style.display = "";
                    } else {
                        row.style.display = "none";
                    }
                });
            });

            // Additionally support filtering of log ledger panels or lists
            const customLogContainers = document.querySelectorAll(".leading-relaxed, .border-l-2");
            customLogContainers.forEach(log => {
                const logText = log.textContent.toLowerCase();
                if (logText.includes(query)) {
                    log.style.display = "";
                } else {
                    log.style.display = "none";
                }
            });
        });
    });
}

/**
 * Enables auto-fade timing out for success or error toast prompts
 */
function initializeToastDismissers() {
    const toastAlerts = document.querySelectorAll(".mb-5, [class*='toast-'], .bg-emerald-50\\/10");
    toastAlerts.forEach(toast => {
        // Append a click-to-close handler
        toast.style.cursor = "pointer";
        toast.title = "Click to close notification";
        
        toast.addEventListener("click", () => {
            toast.style.transition = "all 0.4s ease";
            toast.style.opacity = "0";
            toast.style.transform = "translateY(-10px)";
            setTimeout(() => {
                toast.remove();
            }, 400);
        });

        // Autoclose after 8 seconds
        setTimeout(() => {
            if (toast && document.body.contains(toast)) {
                toast.style.transition = "all 0.4s ease";
                toast.style.opacity = "0";
                toast.style.transform = "translateY(-10px)";
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        toast.remove();
                    }
                }, 400);
            }
        }, 8000);
    });
}

/**
 * Drag & Drop interactivity for clean user experience on Upload pages
 */
function initializeCsvUploadInteractivity() {
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("csvFile");
    
    if (!dropZone || !fileInput) return;

    // Trigger input on zone click
    dropZone.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            updateDropZoneState(dropZone, fileInput.files[0].name);
        }
    });

    // Handle Drag Events
    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add("border-cyan-500", "bg-sky-50/10");
        }, false);
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("border-cyan-500", "bg-sky-50/10");
        }, false);
    });

    dropZone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            fileInput.files = files;
            updateDropZoneState(dropZone, files[0].name);
        }
    });
}

function updateDropZoneState(dropZone, fileName) {
    const promptText = dropZone.querySelector("p");
    const helperText = dropZone.querySelector(".text-\\[10px\\]");
    const icon = dropZone.querySelector("i");

    if (promptText) {
        promptText.innerHTML = `<strong>Selected: ${fileName}</strong>`;
    }
    if (helperText) {
        helperText.textContent = "Valid spreadsheet queued. Press 'Begin Parsing Pipeline' to upload.";
    }
    if (icon) {
        icon.className = "lucide-file-spreadsheets text-emerald-500 text-3xl mb-3";
    }
    dropZone.classList.add("border-emerald-500", "bg-emerald-500/5");
}

/**
 * Adds form submission disabled-protection toggle to prevent duplicate operations
 */
function initializeSubmitProtections() {
    const forms = document.querySelectorAll("form");
    forms.forEach(form => {
        // Skip some lists that delete
        if (form.action && form.action.includes("DeleteBriefing")) return;
        
        form.addEventListener("submit", () => {
            const submitButtons = form.querySelectorAll("button[type='submit']");
            submitButtons.forEach(btn => {
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.style.opacity = "0.75";
                btn.style.cursor = "not-allowed";
                
                // Set loading status indicator
                if (btn.querySelector("span")) {
                    btn.querySelector("span").textContent = "Processing Operation...";
                } else {
                    btn.innerHTML = "Processing...";
                }
            });
        });
    });
}
