document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) { window.location.href = 'login.html'; return; }
  if (user.role !== 'citizen') {
    if (user.role === 'admin') window.location.href = 'admin-dashboard.html';
    else if (user.role === 'officer') window.location.href = 'officer-dashboard.html';
    else window.location.href = 'login.html';
    return;
  }

  document.getElementById('citizenName').textContent = user.fullName || 'Citizen';

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });

  const severityBadge = { low: 'bg-success', medium: 'bg-warning text-dark', high: 'bg-danger' };
  const statusBadge = {
    submitted: 'bg-secondary',
    investigating: 'bg-info text-dark',
    resolved: 'bg-success',
    rejected: 'bg-danger'
  };

  let allIncidents = [];

  async function loadIncidents() {
    try {
      const res = await fetch('/api/incidents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const incidents = await res.json();
      allIncidents = incidents.filter(i => i.submitted_by === user.id);
      updateStats(allIncidents);
      renderTable(allIncidents);
    } catch (err) {
      document.getElementById('incidentTableBody').innerHTML =
        '<tr><td colspan="8" class="text-center text-danger py-4">Failed to load reports.</td></tr>';
    }
  }

  function updateStats(incidents) {
    document.getElementById('totalReports').textContent = incidents.length;
    document.getElementById('pendingReports').textContent = incidents.filter(i => i.status === 'submitted' || i.status === 'investigating').length;
    document.getElementById('resolvedReports').textContent = incidents.filter(i => i.status === 'resolved').length;
    document.getElementById('rejectedReports').textContent = incidents.filter(i => i.status === 'rejected').length;
  }

  function renderTable(incidents) {
    const tbody = document.getElementById('incidentTableBody');
    if (incidents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No reports found.</td></tr>';
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
        <td><span class="badge ${statusBadge[i.status] || 'bg-secondary'}">${i.status}</span></td>
        <td>
          <a href="incident-details.html?id=${i.id}" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-eye"></i> View
          </a>
        </td>
      </tr>`).join('');
  }

  function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const severity = document.getElementById('severityFilter').value;
    const filtered = allIncidents.filter(i => {
      const matchSearch = !search || i.title?.toLowerCase().includes(search) || i.category?.toLowerCase().includes(search) || i.location?.toLowerCase().includes(search);
      const matchStatus = !status || i.status === status;
      const matchSeverity = !severity || i.severity?.toLowerCase() === severity;
      return matchSearch && matchStatus && matchSeverity;
    });
    renderTable(filtered);
  }

  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('statusFilter').addEventListener('change', applyFilters);
  document.getElementById('severityFilter').addEventListener('change', applyFilters);
  document.getElementById('clearFilter').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('severityFilter').value = '';
    renderTable(allIncidents);
  });

  loadIncidents();
});
