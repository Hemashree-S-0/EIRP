document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) { window.location.href = 'login.html'; return; }

  const statusBadge = { submitted: 'bg-secondary', investigating: 'bg-warning', resolved: 'bg-success', rejected: 'bg-danger' };
  const tbody = document.getElementById('reportsTableBody');

  try {
    const res = await fetch('/api/incidents', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const incidents = await res.json();
    const myReports = incidents.filter(i => i.submitted_by === user.id);

    if (myReports.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No reports found.</td></tr>';
      return;
    }

    tbody.innerHTML = myReports.map(i => `
      <tr>
        <td>${i.title}</td>
        <td>${i.category}</td>
        <td><span class="badge ${statusBadge[i.status] || 'bg-secondary'}">${i.status}</span></td>
        <td>${i.location || '-'}</td>
        <td><a href="incident-details.html?id=${i.id}" class="btn btn-sm btn-outline-success">View</a></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load reports.</td></tr>';
  }
});
