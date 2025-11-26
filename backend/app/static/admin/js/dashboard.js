// Dashboard Logic

document.addEventListener('DOMContentLoaded', async () => {
    // Check auth
    requireAuth();

    // Set current date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // Set user info
    const username = localStorage.getItem('admin_user') || 'Admin';
    document.getElementById('userName').textContent = username;
    document.getElementById('userAvatar').textContent = username.charAt(0).toUpperCase();

    // Initialize charts
    initCharts();

    // Load data
    await loadStats();
    await loadRecentReports();
});

// Initialize Chart.js charts
let reportsChartInstance = null;
let tasksChartInstance = null;

function initCharts() {
    // Reports Chart (Line)
    const ctxReports = document.getElementById('reportsChart').getContext('2d');

    // Gradient for line chart
    const gradient = ctxReports.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    reportsChartInstance = new Chart(ctxReports, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'New Reports',
                data: [12, 19, 3, 5, 2, 3, 15], // Dummy data for now
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    // Tasks Chart (Doughnut)
    const ctxTasks = document.getElementById('tasksChart').getContext('2d');
    tasksChartInstance = new Chart(ctxTasks, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending', 'Failed'],
            datasets: [{
                data: [65, 25, 10], // Dummy data
                backgroundColor: [
                    '#10b981', // Green
                    '#eab308', // Yellow
                    '#ef4444'  // Red
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Load Dashboard Stats
async function loadStats() {
    try {
        // Fetch reports stats
        const reportsStats = await api.get('/admin/phones/stats');
        document.getElementById('statReports').textContent = reportsStats.total.toLocaleString();

        // Fetch queue stats
        const queueStats = await api.get('/admin/queue/stats');
        document.getElementById('statTasks').textContent = queueStats.pending.toLocaleString();

        // Fetch workers count
        const workers = await api.get('/admin/workers');
        document.getElementById('statWorkers').textContent = workers.length.toLocaleString();

        // Update Charts
        updateCharts(reportsStats, queueStats);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateCharts(reportsStats, queueStats) {
    // Update Tasks Chart
    if (tasksChartInstance) {
        tasksChartInstance.data.datasets[0].data = [
            0, // Completed (not tracked in simple stats yet)
            queueStats.pending,
            queueStats.failed
        ];
        tasksChartInstance.update();

        // Update Legend
        const totalTasks = queueStats.pending + queueStats.failed; // + completed if we had it
        // Avoid division by zero
        const pendingPct = totalTasks ? Math.round((queueStats.pending / totalTasks) * 100) : 0;
        const failedPct = totalTasks ? Math.round((queueStats.failed / totalTasks) * 100) : 0;

        document.getElementById('distCompleted').textContent = "0%"; // Placeholder until we track completed
        document.getElementById('distPending').textContent = `${pendingPct}% (${queueStats.pending})`;
        document.getElementById('distFailed').textContent = `${failedPct}% (${queueStats.failed})`;
    }

    // Update Reports Chart (Activity)
    // For now, we don't have a daily stats endpoint, so we'll show a flat line or 0
    // In a real implementation, we would fetch /admin/phones/stats/daily
    if (reportsChartInstance) {
        // Placeholder: just show total as a single point or similar
        // To make it look "alive" without real history, we might leave it empty or show the current total
        // For this iteration, let's just ensure it doesn't show misleading mock data
        reportsChartInstance.data.datasets[0].data = [0, 0, 0, 0, 0, 0, reportsStats.total];
        reportsChartInstance.update();
    }
}

// Load Recent Reports
async function loadRecentReports() {
    const tableBody = document.getElementById('recentReportsTable');

    try {
        // Fetch recent reports
        const response = await api.get('/admin/phones?limit=5');
        const reports = response.items || [];

        if (reports.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        No recent reports found.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = reports.map(report => `
            <tr class="hover:bg-white/5 transition-colors group">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mr-3">
                            <span class="material-icons-round text-sm">phone</span>
                        </div>
                        <span class="font-medium text-white">${report.phone_number}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-md bg-white/5 text-xs text-gray-300 border border-white/10">
                        ${report.report_type}
                    </span>
                </td>
                <td class="px-6 py-4">
                    ${getStatusBadge(report.status)}
                </td>
                <td class="px-6 py-4 text-gray-400">
                    ${new Date(report.created_at).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 text-right">
                    <a href="/static/admin/reports.html" class="text-gray-400 hover:text-blue-400 transition-colors p-1">
                        <span class="material-icons-round">visibility</span>
                    </a>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading reports:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-400">Error loading data</td></tr>';
    }
}

function getStatusBadge(status) {
    const styles = {
        pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
        approved: 'bg-green-500/20 text-green-400 border-green-500/20',
        rejected: 'bg-red-500/20 text-red-400 border-red-500/20'
    };

    const style = styles[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/20';

    return `<span class="px-2 py-1 rounded-full text-xs border ${style}">${status || 'Unknown'}</span>`;
}
