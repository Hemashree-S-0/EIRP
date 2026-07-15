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

  const severityBadge = { low: 'bg-success', medium: 'bg-warning text-dark', high: 'bg-danger' };
  const statusBadge   = { submitted: 'bg-secondary', investigating: 'bg-info text-dark', resolved: 'bg-success', rejected: 'bg-danger' };

  let allIncidents = [];
  let usersMap = {};

  async function loadData() {
    try {
      const [incRes, usersRes] = await Promise.all([
        fetch('/api/incidents',   { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      allIncidents = await incRes.json();
      const users  = usersRes.ok ? await usersRes.json() : [];
      users.forEach(u => { usersMap[u.id] = u.fullName; });

      // Populate category filter dynamically
      const categories = [...new Set(allIncidents.map(i => i.category).filter(Boolean))];
      const catFilter  = document.getElementById('categoryFilter');
      categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        catFilter.appendChild(opt);
      });

      document.getElementById('incidentCount').textContent = `${allIncidents.length} total`;
      renderTable(allIncidents);
    } catch (err) {
      document.getElementById('incidentTableBody').innerHTML =
        '<tr><td colspan="9" class="text-center text-danger py-4">Failed to load incidents.</td></tr>';
    }
  }

  function renderTable(incidents) {
    const tbody = document.getElementById('incidentTableBody');
    document.getElementById('incidentCount').textContent = `${incidents.length} total`;
    if (incidents.length === 0) {
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
        <td><a href="incident-details.html?id=${i.id}" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i> View</a></td>
      </tr>`).join('');
  }

  function applyFilters() {
    const search   = document.getElementById('searchInput').value.toLowerCase();
    const status   = document.getElementById('statusFilter').value;
    const severity = document.getElementById('severityFilter').value;
    const category = document.getElementById('categoryFilter').value;
    renderTable(allIncidents.filter(i =>
      (!search   || i.title?.toLowerCase().includes(search) || i.category?.toLowerCase().includes(search) || i.location?.toLowerCase().includes(search)) &&
      (!status   || i.status === status) &&
      (!severity || i.severity?.toLowerCase() === severity) &&
      (!category || i.category === category)
    ));
  }

  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('statusFilter').addEventListener('change', applyFilters);
  document.getElementById('severityFilter').addEventListener('change', applyFilters);
  document.getElementById('categoryFilter').addEventListener('change', applyFilters);
  document.getElementById('clearFilter').addEventListener('click', () => {
    ['searchInput','statusFilter','severityFilter','categoryFilter'].forEach(id => {
      document.getElementById(id).value = '';
    });
    renderTable(allIncidents);
  });

  loadData();
});
