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

  const roleBadge = { citizen: 'bg-success', officer: 'bg-info text-dark', admin: 'bg-danger' };
  let allUsers = [];

  try {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    allUsers = await res.json();
    document.getElementById('userCount').textContent = `${allUsers.length} total`;
    renderTable(allUsers);
  } catch (err) {
    document.getElementById('usersTableBody').innerHTML =
      '<tr><td colspan="5" class="text-center text-danger py-4">Failed to load users.</td></tr>';
  }

  function renderTable(users) {
    const tbody = document.getElementById('usersTableBody');
    document.getElementById('userCount').textContent = `${users.length} total`;
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No users found.</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><span class="text-muted">#${u.id}</span></td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-sm">${(u.fullName || '?')[0].toUpperCase()}</div>
            <strong>${u.fullName}</strong>
          </div>
        </td>
        <td>${u.email}</td>
        <td><span class="badge ${roleBadge[u.role] || 'bg-secondary'}">${u.role}</span></td>
        <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A'}</td>
      </tr>`).join('');
  }

  function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const role   = document.getElementById('roleFilter').value;
    renderTable(allUsers.filter(u =>
      (!search || u.fullName?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search)) &&
      (!role   || u.role === role)
    ));
  }

  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('roleFilter').addEventListener('change', applyFilters);
  document.getElementById('clearFilter').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('roleFilter').value  = '';
    renderTable(allUsers);
  });
});
