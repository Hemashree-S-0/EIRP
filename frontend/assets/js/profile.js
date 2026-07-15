document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) { window.location.href = 'login.html'; return; }

  // Build sidebar based on role
  const sidebarLinks = {
    citizen: [
      { href: 'citizen-dashboard.html', icon: 'bi-speedometer2', label: 'Dashboard' },
      { href: 'report-incident.html',   icon: 'bi-plus-circle',  label: 'Report Incident' },
      { href: 'my-reports.html',        icon: 'bi-file-earmark-text', label: 'My Reports' },
      { href: 'profile.html',           icon: 'bi-person',       label: 'Profile', active: true },
      { href: '#',                      icon: 'bi-box-arrow-right', label: 'Logout', id: 'logoutBtn' }
    ],
    officer: [
      { href: 'officer-dashboard.html', icon: 'bi-speedometer2',   label: 'Dashboard' },
      { href: 'officer-incidents.html', icon: 'bi-clipboard-data', label: 'Incidents' },
      { href: 'profile.html',           icon: 'bi-person',         label: 'Profile', active: true },
      { href: '#',                      icon: 'bi-box-arrow-right', label: 'Logout', id: 'logoutBtn' }
    ],
    admin: [
      { href: 'admin-dashboard.html',   icon: 'bi-speedometer2',   label: 'Dashboard' },
      { href: 'incident-management.html', icon: 'bi-clipboard-data', label: 'Incidents' },
      { href: 'manage-users.html',      icon: 'bi-people',         label: 'Manage Users' },
      { href: 'analytics.html',         icon: 'bi-bar-chart',      label: 'Analytics' },
      { href: 'profile.html',            icon: 'bi-person',         label: 'Profile', active: true },
      { href: '#',                      icon: 'bi-box-arrow-right', label: 'Logout', id: 'logoutBtn' }
    ]
  };

  const links = sidebarLinks[stored.role] || sidebarLinks.citizen;
  document.getElementById('sidebarNav').innerHTML = links.map(l => {
    if (l.id === 'logoutBtn') {
      return `<li><button class="nav-link sidebar-logout w-100 border-0 bg-transparent text-start" id="logoutBtn"><i class="bi ${l.icon} me-2"></i>${l.label}</button></li>`;
    }
    return `<li><a class="nav-link ${l.active ? 'active' : ''}" href="${l.href}"><i class="bi ${l.icon} me-2"></i>${l.label}</a></li>`;
  }).join('');

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });

  const roleColors = { admin: 'bg-danger', officer: 'bg-info text-dark', citizen: 'bg-success' };

  try {
    const res = await fetch('/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) { window.location.href = 'login.html'; return; }

    const { user } = await res.json();

    // Avatar initials
    const initials = (user.fullName || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('avatarInitials').textContent = initials;

    // Profile card
    document.getElementById('profileNameDisplay').textContent = user.fullName || '';
    document.getElementById('profileEmailDisplay').textContent = user.email || '';
    document.getElementById('roleBadge').textContent = user.role || '';
    document.getElementById('roleBadge').className = `badge role-badge mb-2 ${roleColors[user.role] || 'bg-secondary'}`;
    document.getElementById('memberSince').textContent = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      : '—';

    // Form fields
    document.getElementById('profileName').value = user.fullName || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profileRole').value = user.role || '';

  } catch (err) {
    console.error('Failed to load profile:', err);
  }

});
