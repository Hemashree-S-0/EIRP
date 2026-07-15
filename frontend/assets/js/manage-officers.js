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

  let allOfficers = [];

  try {
    const [officersRes, incidentsRes] = await Promise.all([
      fetch('/api/admin/officers', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/incidents',      { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    allOfficers       = officersRes.ok  ? await officersRes.json()  : [];
    const incidents   = incidentsRes.ok ? await incidentsRes.json() : [];

    // Count incidents assigned to each officer
    const incidentCount = {};
    incidents.forEach(i => {
      if (i.assigned_to) incidentCount[i.assigned_to] = (incidentCount[i.assigned_to] || 0) + 1;
    });

    document.getElementById('officerCount').textContent = `${allOfficers.length} total`;
    renderTable(allOfficers, incidentCount);

    function renderTable(officers, countMap) {
      const tbody = document.getElementById('officersTableBody');
      document.getElementById('officerCount').textContent = `${officers.length} total`;
      if (officers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No officers found.</td></tr>';
        return;
      }
      tbody.innerHTML = officers.map(o => `
        <tr>
          <td><span class="text-muted">#${o.id}</span></td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="avatar-sm">${(o.fullName || '?')[0].toUpperCase()}</div>
              <strong>${o.fullName}</strong>
            </div>
          </td>
          <td>${o.email}</td>
          <td>${o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A'}</td>
          <td><span class="badge bg-primary">${countMap[o.id] || 0} incidents</span></td>
        </tr>`).join('');
    }

    document.getElementById('searchInput').addEventListener('input', function () {
      const search = this.value.toLowerCase();
      renderTable(
        allOfficers.filter(o => o.fullName?.toLowerCase().includes(search) || o.email?.toLowerCase().includes(search)),
        incidentCount
      );
    });

    document.getElementById('clearFilter').addEventListener('click', () => {
      document.getElementById('searchInput').value = '';
      renderTable(allOfficers, incidentCount);
    });

  } catch (err) {
    document.getElementById('officersTableBody').innerHTML =
      '<tr><td colspan="5" class="text-center text-danger py-4">Failed to load officers.</td></tr>';
  }
});
