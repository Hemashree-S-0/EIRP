document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) { window.location.href = 'login.html'; return; }
  if (user.role !== 'admin') {
    if (user.role === 'officer') window.location.href = 'officer-dashboard.html';
    else window.location.href = 'citizen-dashboard.html';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear(); window.location.href = 'login.html';
  });

  try {
    const res = await fetch('/api/incidents', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const incidents = await res.json();

    // Stat cards
    document.getElementById('statTotal').textContent    = incidents.length;
    document.getElementById('statPending').textContent  = incidents.filter(i => i.status === 'submitted' || i.status === 'investigating').length;
    document.getElementById('statResolved').textContent = incidents.filter(i => i.status === 'resolved').length;
    document.getElementById('statRejected').textContent = incidents.filter(i => i.status === 'rejected').length;

    // --- Category Chart ---
    const categoryCounts = {};
    incidents.forEach(i => { categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1; });
    new Chart(document.getElementById('categoryChart'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryCounts),
        datasets: [{
          data: Object.values(categoryCounts),
          backgroundColor: ['#1a6b3a','#2e7d32','#43a047','#66bb6a','#a5d6a7','#0288d1','#0097a7']
        }]
      },
      options: { plugins: { legend: { position: 'bottom' } } }
    });

    // --- Severity Chart ---
    const severityOrder = ['low', 'medium', 'high'];
    const severityCounts = { low: 0, medium: 0, high: 0 };
    incidents.forEach(i => { if (i.severity) severityCounts[i.severity.toLowerCase()] = (severityCounts[i.severity.toLowerCase()] || 0) + 1; });
    new Chart(document.getElementById('severityChart'), {
      type: 'bar',
      data: {
        labels: ['Low', 'Medium', 'High'],
        datasets: [{
          label: 'Incidents',
          data: severityOrder.map(s => severityCounts[s]),
          backgroundColor: ['#43a047', '#fb8c00', '#e53935'],
          borderRadius: 8
        }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

    // --- Status Chart ---
    const statusCounts = { submitted: 0, investigating: 0, resolved: 0, rejected: 0 };
    incidents.forEach(i => { if (statusCounts[i.status] !== undefined) statusCounts[i.status]++; });
    new Chart(document.getElementById('statusChart'), {
      type: 'pie',
      data: {
        labels: ['Submitted', 'Investigating', 'Resolved', 'Rejected'],
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ['#78909c', '#0288d1', '#2e7d32', '#c62828']
        }]
      },
      options: { plugins: { legend: { position: 'bottom' } } }
    });

    // --- Timeline Chart (incidents per month) ---
    const monthCounts = {};
    incidents.forEach(i => {
      const d = new Date(i.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });
    const sortedMonths = Object.keys(monthCounts).sort();
    new Chart(document.getElementById('timelineChart'), {
      type: 'line',
      data: {
        labels: sortedMonths,
        datasets: [{
          label: 'Incidents',
          data: sortedMonths.map(m => monthCounts[m]),
          borderColor: '#1a6b3a',
          backgroundColor: 'rgba(26,107,58,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1a6b3a'
        }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
});
