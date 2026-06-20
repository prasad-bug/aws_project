// State Management
let currentRole = 'administrator';
let chargingSessions = [
    { id: 'TX-9041', station: 'Metro Depot FastCharger 1A', vin: '1FTFW1ED8N21034', energy: 45.2, cost: 18.08, time: '2026-06-20 15:10:02', status: 'COMPLETED' },
    { id: 'TX-9042', station: 'Highway 101 Hub', vin: '5YJ3E1EA5KF12345', energy: 62.1, cost: 24.84, time: '2026-06-20 15:12:45', status: 'COMPLETED' },
    { id: 'TX-9043', station: 'Downtown Plaza Level 2', vin: '1N4AZ0CP6FC67890', energy: 18.7, cost: 7.48, time: '2026-06-20 15:18:19', status: 'CHARGING' },
    { id: 'TX-9044', station: 'Airport Terminal B Zone 1', vin: 'WBY1Z2C30FZ11121', energy: 32.4, cost: 12.96, time: '2026-06-20 15:20:00', status: 'COMPLETED' }
];

const regions = [
    { name: 'US East (N. Virginia)', code: 'us-east-1', chargers: '340/350', load: 82, status: 'Healthy' },
    { name: 'US West (Oregon)', code: 'us-west-2', chargers: '210/220', load: 61, status: 'Healthy' },
    { name: 'EU Central (Frankfurt)', code: 'eu-central-1', chargers: '180/200', load: 55, status: 'Healthy' },
    { name: 'AP Southeast (Singapore)', code: 'ap-southeast-1', chargers: '112/130', load: 42, status: 'Healthy' }
];

// Telemetry Histograms
let cpuHistory = [42, 45, 50, 48, 55, 60, 58, 62, 65, 70, 68, 62, 59, 64, 72, 75, 78, 80, 75, 72, 68, 65];
let ramHistory = [70, 70, 71, 72, 72, 73, 73, 74, 74, 75, 75, 76, 75, 75, 76, 76, 77, 77, 78, 78, 77, 77];
let netHistory = [12.4, 13.1, 14.0, 15.2, 13.9, 14.5, 15.8, 16.2, 17.0, 18.2, 19.5, 20.1, 19.2, 18.5, 17.2, 18.9, 21.0, 22.4, 21.8, 20.5, 19.0, 18.2];

// Initial Setup on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    renderRegions();
    renderSessions();
    renderGraphs();
    calculateAWSPricing();
    
    // Periodically update telemetry metrics to simulate live load
    setInterval(updateTelemetry, 3000);
    setInterval(updateLiveLogStream, 4000);
});

// View Navigation tab switching logic
function switchTab(tabId, element) {
    // Hide all sections
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show active section
    const activeSection = document.getElementById(tabId);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Update active nav link style
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

    // Update headers
    const titleText = {
        'dashboard': 'Real-Time EV Operations Dashboard',
        'networking': 'Cloud Networking & VPC Architecture',
        'database': 'Operational Database Console (MariaDB/RDS)',
        'linux-admin': 'Linux Administration & Container Control',
        'monitoring': 'CloudWatch Infrastructure Telemetry',
        'pricing': 'AWS Infrastructure Cost Optimizer'
    };

    const descText = {
        'dashboard': 'Consolidated operational metrics, fleet distribution, and network performance indicators.',
        'networking': 'Interactive view of VPC subnets, availability zones, load balancers, and EC2/ECS node topologies.',
        'database': 'Real-time billing/session records stored in the primary RDS cluster. Launch backup strategies.',
        'linux-admin': 'Execute secure maintenance scripts and access local container instances through SSH simulations.',
        'monitoring': 'Real-time CPU, Memory, Network metrics and automated CloudWatch alert rules.',
        'pricing': 'Analyze Total Cost of Ownership (TCO), resize instance fleets, estimate redundancy costs, and apply savings plans.'
    };

    document.getElementById('view-title').innerText = titleText[tabId];
    document.getElementById('view-description').innerText = descText[tabId];
}

// RBAC Role Changer
function changeUserRole(role) {
    currentRole = role;
    const activeRoleText = document.getElementById('activeRoleText');
    
    if (role === 'administrator') {
        activeRoleText.innerText = 'Admin Mode';
        activeRoleText.parentNode.style.backgroundColor = 'var(--primary-glow)';
        activeRoleText.style.color = 'var(--primary)';
        enableAdminPowers(true);
    } else if (role === 'operational_manager') {
        activeRoleText.innerText = 'Operations Mode';
        activeRoleText.parentNode.style.backgroundColor = 'var(--success-glow)';
        activeRoleText.style.color = 'var(--success)';
        enableAdminPowers(true); // Managers can view most things
    } else if (role === 'executive') {
        activeRoleText.innerText = 'Executive View (ReadOnly)';
        activeRoleText.parentNode.style.backgroundColor = 'var(--warning-glow)';
        activeRoleText.style.color = 'var(--warning)';
        enableAdminPowers(false); // Disable editing/script execution
    }
}

function enableAdminPowers(enabled) {
    // Disable inputs/buttons that are privileged
    const adminButtons = document.querySelectorAll('button:not(.btn-secondary), input[type="range"]');
    adminButtons.forEach(btn => {
        if (!enabled) {
            btn.setAttribute('disabled', 'true');
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        } else {
            btn.removeAttribute('disabled');
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    });

    const terminalInput = document.getElementById('terminal-cmd-input');
    if (terminalInput) {
        if (!enabled) {
            terminalInput.setAttribute('disabled', 'true');
            terminalInput.placeholder = 'Access Restricted to Admin/Operations Roles';
        } else {
            terminalInput.removeAttribute('disabled');
            terminalInput.placeholder = 'Type a command and press Enter...';
        }
    }
}

// Render Geographic Regions
function renderRegions() {
    const container = document.getElementById('regions-container');
    container.innerHTML = '';
    
    regions.forEach(r => {
        const item = document.createElement('div');
        item.className = 'status-pill';
        item.style.justifyContent = 'space-between';
        item.style.border = '1px solid var(--border-color)';
        
        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="status-dot active"></span>
                <strong>${r.name}</strong> <span style="font-size:0.75rem; color:var(--text-muted)">[${r.code}]</span>
            </div>
            <div style="display:flex; gap:15px; font-size:0.85rem;">
                <span>Active: <b>${r.chargers}</b></span>
                <span>Load: <b style="color:${r.load > 80 ? 'var(--danger)' : 'var(--success)'}">${r.load}%</b></span>
            </div>
        `;
        container.appendChild(item);
    });
}

// Render Database Table
function renderSessions() {
    const tbody = document.getElementById('db-sessions-tbody');
    tbody.innerHTML = '';
    
    chargingSessions.forEach(s => {
        const tr = document.createElement('tr');
        const badgeClass = s.status === 'COMPLETED' ? 'badge-success' : 'badge-warning';
        tr.innerHTML = `
            <td><strong>${s.id}</strong></td>
            <td>${s.station}</td>
            <td><code>${s.vin}</code></td>
            <td>${s.energy} kWh</td>
            <td>$${s.cost.toFixed(2)}</td>
            <td>${s.time}</td>
            <td><span class="badge ${badgeClass}">${s.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Interactive Subnet Architecture Details
function showNodeDetails(nodeName, nodeDescription) {
    const detailsBox = document.getElementById('network-node-details');
    const nameEl = document.getElementById('node-name');
    const descEl = document.getElementById('node-desc');
    
    nameEl.innerText = nodeName;
    descEl.innerText = nodeDescription;
    detailsBox.style.display = 'block';
    
    // Highlight node in VPC container
    document.querySelectorAll('.aws-node').forEach(node => {
        node.classList.remove('active');
        if (node.innerText === nodeName || node.innerText.toLowerCase().includes(nodeName.toLowerCase())) {
            node.classList.add('active');
        }
    });
}

// Simulate Incident Alerts
function simulateAlert() {
    const container = document.getElementById('incidents-container');
    const timeStr = new Date().toLocaleTimeString();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'status-pill';
    alertDiv.style.border = '1px solid var(--danger)';
    alertDiv.style.background = 'rgba(239, 68, 68, 0.08)';
    alertDiv.innerHTML = `
        <span class="status-dot" style="background-color:var(--danger)"></span>
        <span>[CRITICAL] ${timeStr} - CloudWatch Alarm: CPU utilization on Fargate Task 1b exceeded threshold. Current: 92%. Dispatching SNS alerts...</span>
    `;
    
    container.insertBefore(alertDiv, container.firstChild);
    
    // Add to dashboard metrics log
    const logContainer = document.getElementById('live-logs-container');
    const daemonLog = document.createElement('div');
    daemonLog.innerText = `[WARN] ${timeStr} Fargate ECS engine: Auto-scaling event triggered for cluster charginggrid-prod-api. Adding 2 replica tasks.`;
    logContainer.appendChild(daemonLog);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Script Executions Simulators
function loadScript(scriptType) {
    if (currentRole === 'executive') return;
    
    const term = document.getElementById('terminal-screen');
    const time = new Date().toLocaleTimeString();
    
    let output = '';
    if (scriptType === 'backup') {
        output = [
            `admin@charginggrid:~$ ./rds_backup_s3.sh`,
            `[${time}] Starting automated DB schema dump...`,
            `[${time}] Connecting to MariaDB Master Node at 10.0.3.109...`,
            `[${time}] Executing: mysqldump --opt -u admin -p****** charging_db | gzip > backup_tmp.sql.gz`,
            `[${time}] Backup successful! Size: 412.5 MB.`,
            `[${time}] Transferring backup_tmp.sql.gz to AWS S3 bucket 's3://charginggrid-db-backups/us-east-1/'...`,
            `[${time}] AWS S3 Upload completed. Storage Class: GLACIER_VAULT.`,
            `[${time}] Cleanup temporary cache... Done. System exit: 0`
        ];
    } else if (scriptType === 'upgrade') {
        output = [
            `admin@charginggrid:~$ ./sys_package_upgrade.sh`,
            `[${time}] Syncing package repositories on target host...`,
            `[${time}] sudo apt-get update -y && sudo apt-get upgrade -y`,
            `Hit:1 http://us-east-1.ec2.archive.ubuntu.com/ubuntu focal InRelease`,
            `Get:2 http://security.ubuntu.com/ubuntu focal-security InRelease [114 kB]`,
            `Fetched 114 kB in 1s (85.2 kB/s)`,
            `Reading package lists... Done`,
            `Building dependency tree... Done`,
            `Calculating upgrade... Done. 0 upgraded, 0 newly installed, 0 to remove.`,
            `[${time}] System security patches validated. Shell exit: 0`
        ];
    } else if (scriptType === 'docker') {
        output = [
            `admin@charginggrid:~$ ./deploy_docker_container.sh`,
            `[${time}] Pulling docker image: 'charginggrid/api-service:latest' from DockerHub...`,
            `latest: Pulling from charginggrid/api-service`,
            `4b63e6e: Pull complete`,
            `83e1a0b: Pull complete`,
            `Digest: sha256:d894ea9c1a5b81a2938a109a25b1b4a8e0f128c704`,
            `Status: Downloaded newer image for charginggrid/api-service:latest`,
            `[${time}] ECS Agent: Stopping container task: task-id-71092a (Grace period: 30s)...`,
            `[${time}] ECS Agent: Initiating Docker Run parameters for task-id-91823b...`,
            `docker run -d --name charginggrid-api -p 8080:8080 -e DB_HOST=rds-mysql-writer charginggrid/api-service:latest`,
            `[${time}] Container Health Check passed: 200 OK. Traffic route switched. Service online.`
        ];
    }
    
    output.forEach((line, index) => {
        setTimeout(() => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'terminal-line';
            if (line.startsWith('admin@')) {
                lineDiv.innerHTML = `<span class="terminal-prompt">${line.substring(0, 20)}</span>${line.substring(20)}`;
            } else {
                lineDiv.innerText = line;
            }
            term.appendChild(lineDiv);
            term.scrollTop = term.scrollHeight;
        }, index * 400);
    });
}

// Interactive Terminal CLI Input Parser
function handleTerminalCommand(e) {
    if (e.key !== 'Enter') return;
    
    const input = document.getElementById('terminal-cmd-input');
    const cmd = input.value.trim().toLowerCase();
    const term = document.getElementById('terminal-screen');
    
    // Print input line
    const promptDiv = document.createElement('div');
    promptDiv.className = 'terminal-line';
    promptDiv.innerHTML = `<span class="terminal-prompt">admin@charginggrid:~$</span> ${input.value}`;
    term.appendChild(promptDiv);
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'terminal-line';
    resultDiv.style.color = '#e2e8f0';
    
    if (cmd === 'help') {
        resultDiv.innerHTML = `
            Available Commands:<br>
            - <strong>help</strong>: Show commands list.<br>
            - <strong>clear</strong>: Wipe terminal terminal logs.<br>
            - <strong>uname -a</strong>: Show Host OS platform details.<br>
            - <strong>docker ps</strong>: Show running Docker container details.<br>
            - <strong>df -h</strong>: Print disk drive partitions utilization statistics.<br>
            - <strong>top</strong>: Snapshot active running processes CPU load.
        `;
    } else if (cmd === 'clear') {
        term.innerHTML = '';
        input.value = '';
        return;
    } else if (cmd === 'uname -a') {
        resultDiv.innerText = 'Linux charginggrid-node-1a 5.15.0-72-generic #79-Ubuntu SMP Wed Apr 19 14:38:00 UTC 2026 x86_64 x86_64 GNU/Linux';
    } else if (cmd === 'docker ps') {
        resultDiv.innerHTML = `
            CONTAINER ID   IMAGE                          COMMAND                  CREATED         STATUS         PORTS                    NAMES<br>
            91823b184fcd   charginggrid/api-service:lat   "docker-entrypoint.s…"   10 minutes ago  Up 10 minutes  0.0.0.0:8080->8080/tcp   charginggrid-api<br>
            a847f9382103   redis:alpine                   "docker-entrypoint.s…"   3 hours ago     Up 3 hours     6379/tcp                 session-cache
        `;
    } else if (cmd === 'df -h') {
        resultDiv.innerHTML = `
            Filesystem      Size  Used Avail Use% Mounted on<br>
            /dev/xvda1       20G  8.4G   11G  44% /<br>
            tmpfs           3.9G     0  3.9G   0% /dev/shm
        `;
    } else if (cmd === 'top') {
        resultDiv.innerHTML = `
            PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND<br>
            1840 root      20   0  910120  45120  28900 S   1.8   1.1   0:14.28 node-api<br>
            9032 admin     20   0   12450   3240   2100 R   0.7   0.1   0:00.08 top
        `;
    } else if (cmd === '') {
        input.value = '';
        return;
    } else {
        resultDiv.innerText = `bash: command not found: ${cmd}. Type 'help' for valid command lists.`;
        resultDiv.style.color = 'var(--danger)';
    }
    
    term.appendChild(resultDiv);
    input.value = '';
    term.scrollTop = term.scrollHeight;
}

// Simulated Database Modals & Operations
function openAddSessionModal() {
    if (currentRole === 'executive') return;
    document.getElementById('addSessionModal').style.display = 'flex';
}

function closeAddSessionModal() {
    document.getElementById('addSessionModal').style.display = 'none';
}

function saveNewSession() {
    const station = document.getElementById('modal-station-name').value;
    const vin = document.getElementById('modal-vehicle-vin').value;
    const energy = parseFloat(document.getElementById('modal-energy').value);
    const cost = parseFloat(document.getElementById('modal-cost').value);
    
    const id = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const newRecord = { id, station, vin, energy, cost, time, status: 'COMPLETED' };
    chargingSessions.unshift(newRecord);
    
    renderSessions();
    closeAddSessionModal();
    
    // Add UI status alerts
    const container = document.getElementById('incidents-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = 'status-pill';
    alertDiv.style.border = '1px solid var(--success)';
    alertDiv.style.background = 'rgba(16,185,129,0.05)';
    alertDiv.innerHTML = `
        <span class="status-dot active"></span>
        <span>[SUCCESS] Transaction DB Record ${id} inserted. RDS Table Write Lock released.</span>
    `;
    container.insertBefore(alertDiv, container.firstChild);
}

function triggerDBBackup() {
    if (currentRole === 'executive') return;
    
    // Simulated DB status alert
    const container = document.getElementById('incidents-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = 'status-pill';
    alertDiv.style.border = '1px solid var(--primary)';
    alertDiv.style.background = 'rgba(14,165,233,0.08)';
    alertDiv.innerHTML = `
        <span class="status-dot" style="background-color:var(--primary)"></span>
        <span>[SYSTEM] RDS cluster manual backup snapshot triggered. Saving to charginggrid-db-snapshot-${Date.now()}.</span>
    `;
    container.insertBefore(alertDiv, container.firstChild);
}

// Rendering Dynamic Telemetry Graphs
function renderGraphs() {
    renderGraphElement('cpu-graph', cpuHistory, '%');
    renderGraphElement('ram-graph', ramHistory, '%');
    renderGraphElement('network-graph', netHistory, ' MB/s');
}

function renderGraphElement(elementId, dataset, unit) {
    const graph = document.getElementById(elementId);
    graph.innerHTML = '';
    
    dataset.forEach(val => {
        const bar = document.createElement('div');
        bar.className = 'graph-bar';
        bar.style.height = `${val}%`;
        bar.setAttribute('data-val', val);
        graph.appendChild(bar);
    });
}

function updateTelemetry() {
    // Generate slight random variations
    const lastCpu = cpuHistory[cpuHistory.length - 1];
    const newCpu = Math.max(10, Math.min(95, Math.round(lastCpu + (Math.random() - 0.5) * 10)));
    cpuHistory.shift();
    cpuHistory.push(newCpu);

    const lastRam = ramHistory[ramHistory.length - 1];
    const newRam = Math.max(40, Math.min(95, Math.round(lastRam + (Math.random() - 0.5) * 3)));
    ramHistory.shift();
    ramHistory.push(newRam);

    const lastNet = netHistory[netHistory.length - 1];
    const newNet = Math.max(2, Math.min(50, parseFloat((lastNet + (Math.random() - 0.5) * 4).toFixed(1))));
    netHistory.shift();
    netHistory.push(newNet);

    renderGraphs();
    
    // Check Threshold Warnings
    const cpuThreshold = parseInt(document.getElementById('cpu-alert-slider').value);
    const ramThreshold = parseInt(document.getElementById('ram-alert-slider').value);
    
    if (newCpu > cpuThreshold) {
        dispatchAlertNotification('CPU Utilization Alert', `ECS task nodes aggregate CPU is at ${newCpu}%, exceeding configured ${cpuThreshold}% threshold.`);
    }
    if (newRam > ramThreshold) {
        dispatchAlertNotification('Memory Utilization Alert', `ECS task nodes memory load is at ${newRam}%, exceeding configured ${ramThreshold}% limit.`);
    }

    // Dynamic Header Stats Updates
    document.getElementById('stats-power-draw').innerText = `${(3.5 + Math.random() * 0.8).toFixed(2)} MW`;
    document.getElementById('stats-occupancy').innerText = `${(75 + Math.random() * 6).toFixed(1)}%`;
}

function dispatchAlertNotification(type, message) {
    const container = document.getElementById('incidents-container');
    const timeStr = new Date().toLocaleTimeString();
    
    // Ensure warning alerts do not overflow
    if (container.children.length > 8) {
        container.removeChild(container.lastChild);
    }
    
    const warnDiv = document.createElement('div');
    warnDiv.className = 'status-pill';
    warnDiv.style.border = '1px solid var(--warning)';
    warnDiv.style.background = 'rgba(245,158,11,0.08)';
    warnDiv.innerHTML = `
        <span class="status-dot" style="background-color:var(--warning)"></span>
        <span>[ALARM] ${timeStr} - ${type}: ${message}</span>
    `;
    container.insertBefore(warnDiv, container.firstChild);
}

function updateAlertThresholdText() {
    const cpuVal = document.getElementById('cpu-alert-slider').value;
    const ramVal = document.getElementById('ram-alert-slider').value;
    
    document.getElementById('cpu-alert-value').innerText = `${cpuVal}%`;
    document.getElementById('ram-alert-value').innerText = `${ramVal}%`;
}

function saveAlertConfigurations() {
    if (currentRole === 'executive') return;
    
    const cpuVal = document.getElementById('cpu-alert-slider').value;
    const ramVal = document.getElementById('ram-alert-slider').value;
    
    alert(`CloudWatch SNS configurations updated successfully!\nAlert rules:\n- CPU: >${cpuVal}%\n- Memory: >${ramVal}%`);
}

function updateLiveLogStream() {
    const logContainer = document.getElementById('live-logs-container');
    const timeStr = new Date().toLocaleTimeString();
    
    const logPool = [
        `[INFO] ${timeStr} - Connection established from API client: 10.0.1.203`,
        `[DEBUG] ${timeStr} - MySQL Connection pool query executed: 'SELECT * FROM charging_stations'`,
        `[INFO] ${timeStr} - WebSockets daemon routing telemetry updates to 84 active EV terminals.`,
        `[INFO] ${timeStr} - AWS Route53 health checks reporting healthy on primary zone us-east-1`,
        `[DEBUG] ${timeStr} - Log Rotation worker completed file compress system process.`
    ];
    
    const logLine = document.createElement('div');
    logLine.innerText = logPool[Math.floor(Math.random() * logPool.length)];
    logContainer.appendChild(logLine);
    
    // Auto-scroll logs
    logContainer.scrollTop = logContainer.scrollHeight;
}

// AWS Infrastructure Cost Calculator
function calculateAWSPricing() {
    const scale = parseInt(document.getElementById('slider-instances').value);
    const storage = parseInt(document.getElementById('slider-storage').value);
    const bandwidth = parseInt(document.getElementById('slider-bandwidth').value);
    const slaTier = document.getElementById('select-sla').value;
    
    // Update texts
    document.getElementById('scale-count-text').innerText = `${scale} ECS Tasks / VMs`;
    document.getElementById('storage-size-text').innerText = `${storage} TB`;
    document.getElementById('bandwidth-text').innerText = `${bandwidth} GB`;
    
    // Price breakdown constants (AWS Retail Estimates)
    const costPerECS = 18.00; // micro instances/fargate 0.5 vCPU 1GB RAM
    const costPerStorageTB = 23.00; // ebs general purpose gp3 or rds storage
    const costPerBandwidthGB = 0.09; // data egress
    
    let baseCompute = scale * costPerECS;
    let baseStorage = storage * costPerStorageTB;
    let baseNetwork = bandwidth * costPerBandwidthGB;
    
    let multiplier = 1.0;
    let slaLabelText = 'Single AZ (99.9%)';
    
    if (slaTier === 'multi-az') {
        multiplier = 2.0; // Redundant instances & storage replicas
        slaLabelText = 'Multi-AZ HA (99.99%)';
    } else if (slaTier === 'multi-region') {
        multiplier = 3.5; // Complete duplicate deployment + region data transfer
        slaLabelText = 'Multi-Region DR (99.999%)';
    }
    
    document.getElementById('sla-tier-text').innerText = slaLabelText;
    
    // Calculate total cost
    let totalCost = (baseCompute + baseStorage + baseNetwork) * multiplier;
    
    document.getElementById('total-aws-cost').innerText = `$${totalCost.toFixed(2)}`;
    
    // Update optimizations dynamically based on sliders
    const tip1 = document.getElementById('opt-tip-1');
    const tip2 = document.getElementById('opt-tip-2');
    
    if (scale > 10) {
        tip1.innerHTML = `<strong>TCO Alert:</strong> Scaling at ${scale} instances warrants purchasing 3-Year AWS ECS Compute Savings Plans, reducing costs by <strong>$${(baseCompute * 0.45).toFixed(0)}/mo</strong>.`;
        tip1.style.borderLeftColor = 'var(--danger)';
    } else {
        tip1.innerHTML = `Use AWS Savings Plans for container instances to save up to 72% on compute costs.`;
        tip1.style.borderLeftColor = 'var(--primary)';
    }
    
    if (storage > 20) {
        tip2.innerHTML = `<strong>Storage TCO alert:</strong> Databases sizes >20TB can leverage RDS Storage Autoscaling and S3 Intelligent-Tiering to save up to <strong>$${(baseStorage * 0.3).toFixed(0)}/mo</strong>.`;
        tip2.style.borderLeftColor = 'var(--warning)';
    } else {
        tip2.innerHTML = `Implement lifecycle policies on Amazon S3 to transition older logs to S3 Glacier Deep Archive.`;
        tip2.style.borderLeftColor = 'var(--success)';
    }
}
