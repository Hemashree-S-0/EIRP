document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) { window.location.href = 'login.html'; return; }
  if (user.role !== 'admin') {
    if (user.role === 'officer') window.location.href = 'officer-dashboard.html';
    else window.location.href = 'citizen-dashboard.html';
    return;
  }

  document.getElementById('adminName').textContent = user.fullName || 'Admin';

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });

  const severityBadge = { low: 'bg-success', medium: 'bg-warning text-dark', high: 'bg-danger' };
  const statusBadge = {
    submitted:    'bg-secondary',
    investigating:'bg-info text-dark',
    resolved:     'bg-success',
    rejected:     'bg-danger'
  };

  let allIncidents = [];
  let usersMap = {};

  async function loadData() {
    try {
      const [incRes, statsRes, usersRes] = await Promise.all([
        fetch('/api/incidents',       { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users',     { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!statsRes.ok) {
        console.error('Stats API error:', statsRes.status, await statsRes.text());
      }

      allIncidents = await incRes.json();
      const stats  = statsRes.ok ? await statsRes.json() : {};
      const users  = usersRes.ok ? await usersRes.json() : [];

      // Stat cards — from DB directly
      document.getElementById('totalUsers').textContent     = stats.totalUsers     ?? 0;
      document.getElementById('totalOfficers').textContent  = stats.totalOfficers  ?? 0;
      document.getElementById('totalIncidents').textContent = stats.totalIncidents ?? 0;
      document.getElementById('resolvedIncidents').textContent = stats.resolvedIncidents ?? 0;

      // Build id → name map for Submitted By column
      users.forEach(u => { usersMap[u.id] = u.fullName; });

      renderTable(allIncidents);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      document.getElementById('incidentTableBody').innerHTML =
        '<tr><td colspan="9" class="text-center text-danger py-4">Failed to load data. Check console for details.</td></tr>';
    }
  }

  function renderTable(incidents) {
    const tbody = document.getElementById('incidentTableBody');
    if (!Array.isArray(incidents) || incidents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No incidents found.</td></tr>';
      return;
    }

    tbody.innerHTML = incidents.map(i => `
      <tr>
        <td><span class="text-muted">#${i.id}</span></td>
        <td><strong>${i.title}</strong></td>
        <td>${i.category}</td>
        <td><span class="badge ${severityBadge[i.severity?.toLowerCase()] || 'bg-secondary'}">${i.severity || 'N/A'}</span></td>
        <td><i class="bi bi-geo-alt text-muted me-1"></i>${i.location || 'N/A'}</td>
        <td>${i.incident_date ? new Date(i.incident_date).toLocaleDateString() : 'N/A'}</td>
        <td>${usersMap[i.submitted_by] || (i.submitted_by ? `User #${i.submitted_by}` : 'N/A')}</td>
        <td><span class="badge ${statusBadge[i.status] || 'bg-secondary'}">${i.status}</span></td>
        <td>
          <a href="incident-details.html?id=${i.id}" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-eye"></i> View
          </a>
        </td>
      </tr>`).join('');
  }

  function applyFilters() {
    const search   = document.getElementById('searchInput').value.toLowerCase();
    const status   = document.getElementById('statusFilter').value;
    const severity = document.getElementById('severityFilter').value;
    const filtered = allIncidents.filter(i => {
      const matchSearch   = !search   || i.title?.toLowerCase().includes(search) || i.category?.toLowerCase().includes(search) || i.location?.toLowerCase().includes(search);
      const matchStatus   = !status   || i.status === status;
      const matchSeverity = !severity || i.severity?.toLowerCase() === severity;
      return matchSearch && matchStatus && matchSeverity;
    });
    renderTable(filtered);
  }

  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('statusFilter').addEventListener('change', applyFilters);
  document.getElementById('severityFilter').addEventListener('change', applyFilters);
  document.getElementById('clearFilter').addEventListener('click', () => {
    document.getElementById('searchInput').value  = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('severityFilter').value = '';
    renderTable(allIncidents);
  });

  loadData();
});
