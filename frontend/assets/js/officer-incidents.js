document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) { window.location.href = 'login.html'; return; }
  if (user.role !== 'officer') {
    if (user.role === 'admin') window.location.href = 'admin-dashboard.html';
    else if (user.role === 'citizen') window.location.href = 'citizen-dashboard.html';
    else window.location.href = 'login.html';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
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
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      allIncidents = Array.isArray(data) ? data : [];
      renderTable(allIncidents);
    } catch (err) {
      console.error('loadIncidents error:', err);
      document.getElementById('incidentTableBody').innerHTML =
        '<tr><td colspan="9" class="text-center text-danger py-4">Failed to load incidents.</td></tr>';
    }
  }

  function renderTable(incidents) {
    const tbody = document.getElementById('incidentTableBody');
    if (!incidents.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No incidents found.</td></tr>';
      return;
    }

    tbody.innerHTML = incidents.map(i => `
      <tr>
        <td><span class="text-muted">#${i.id}</span></td>
        <td><strong>${i.title || '—'}</strong></td>
        <td>${i.category || '—'}</td>
        <td><span class="badge ${severityBadge[i.severity?.toLowerCase()] || 'bg-secondary'}">${i.severity || 'N/A'}</span></td>
        <td><i class="bi bi-geo-alt text-muted me-1"></i>${i.location || 'N/A'}</td>
        <td>${i.incident_date ? new Date(i.incident_date).toLocaleDateString() : 'N/A'}</td>
        <td><span class="badge ${statusBadge[i.status] || 'bg-secondary'}">${i.status || 'N/A'}</span></td>
        <td>
          <select class="form-select form-select-sm status-select" data-id="${i.id}" style="min-width:140px">
            <option value="submitted"     ${i.status === 'submitted'     ? 'selected' : ''}>Submitted</option>
            <option value="investigating" ${i.status === 'investigating' ? 'selected' : ''}>Investigating</option>
            <option value="resolved"      ${i.status === 'resolved'      ? 'selected' : ''}>Resolved</option>
            <option value="rejected"      ${i.status === 'rejected'      ? 'selected' : ''}>Rejected</option>
          </select>
        </td>
        <td>
          <a href="incident-details.html?id=${i.id}" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-eye"></i> View
          </a>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async function () {
        const id = this.dataset.id;
        const newStatus = this.value;
        const original = allIncidents.find(i => i.id == id)?.status;
        try {
          const res = await fetch(`/api/incidents/${id}/status`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) {
            const inc = allIncidents.find(i => i.id == id);
            if (inc) inc.status = newStatus;
            applyFilters();
          } else {
            alert('Failed to update status.');
            this.value = original;
          }
        } catch {
          alert('Network error while updating status.');
          this.value = original;
        }
      });
    });
  }

  function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const status = document.getElementById('statusFilter').value;
    const severity = document.getElementById('severityFilter').value;
    const filtered = allIncidents.filter(i => {
      const matchSearch = !search ||
        i.title?.toLowerCase().includes(search) ||
        i.category?.toLowerCase().includes(search) ||
        i.location?.toLowerCase().includes(search);
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
