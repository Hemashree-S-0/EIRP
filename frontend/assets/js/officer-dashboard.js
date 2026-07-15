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

  document.getElementById('officerName').textContent = user.fullName || 'Officer';

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

  try {
    const res = await fetch('/api/incidents', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const incidents = await res.json();
    const all = Array.isArray(incidents) ? incidents : [];

    // Stats
    document.getElementById('totalCount').textContent = all.length;
    document.getElementById('pendingCount').textContent = all.filter(i => i.status === 'submitted').length;
    document.getElementById('investigatingCount').textContent = all.filter(i => i.status === 'investigating').length;
    document.getElementById('resolvedCount').textContent = all.filter(i => i.status === 'resolved').length;

    // Recent 10 incidents
    const recent = all.slice(0, 10);
    const tbody = document.getElementById('incidentTableBody');

    if (!recent.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No incidents found.</td></tr>';
      return;
    }

    tbody.innerHTML = recent.map(i => `
      <tr>
        <td><span class="text-muted">#${i.id}</span></td>
        <td><strong>${i.title || '—'}</strong></td>
        <td>${i.category || '—'}</td>
        <td><span class="badge ${severityBadge[i.severity?.toLowerCase()] || 'bg-secondary'}">${i.severity || 'N/A'}</span></td>
        <td><i class="bi bi-geo-alt text-muted me-1"></i>${i.location || 'N/A'}</td>
        <td>${i.incident_date ? new Date(i.incident_date).toLocaleDateString() : 'N/A'}</td>
        <td><span class="badge ${statusBadge[i.status] || 'bg-secondary'}">${i.status || 'N/A'}</span></td>
        <td>
          <a href="incident-details.html?id=${i.id}" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-eye"></i> View
          </a>
        </td>
      </tr>`).join('');

  } catch (err) {
    console.error('Dashboard error:', err);
    document.getElementById('incidentTableBody').innerHTML =
      '<tr><td colspan="8" class="text-center text-danger py-4">Failed to load incidents.</td></tr>';
  }
});
