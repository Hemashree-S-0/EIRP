document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) { window.location.href = 'login.html'; return; }

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  // Build sidebar based on role
  const sidebarLinks = {
    citizen: [
      { href: 'citizen-dashboard.html',  icon: 'bi-speedometer2',      label: 'Dashboard' },
      { href: 'report-incident.html',    icon: 'bi-plus-circle',        label: 'Report Incident' },
      { href: 'my-reports.html',         icon: 'bi-file-earmark-text',  label: 'My Reports' },
      { href: 'profile.html',            icon: 'bi-person',             label: 'Profile' },
      { href: '#', icon: 'bi-box-arrow-right', label: 'Logout', id: 'logoutBtn' }
    ],
    officer: [
      { href: 'officer-dashboard.html',  icon: 'bi-speedometer2',   label: 'Dashboard' },
      { href: 'incident-management.html',icon: 'bi-clipboard-data', label: 'Incidents' },
      { href: 'profile.html',            icon: 'bi-person',         label: 'Profile' },
      { href: '#', icon: 'bi-box-arrow-right', label: 'Logout', id: 'logoutBtn' }
    ],
    admin: [
      { href: 'admin-dashboard.html',    icon: 'bi-speedometer2',   label: 'Dashboard' },
      { href: 'incident-management.html',icon: 'bi-clipboard-data', label: 'Incidents' },
      { href: 'manage-users.html',       icon: 'bi-people',         label: 'Manage Users' },
      { href: 'analytics.html',          icon: 'bi-bar-chart',      label: 'Analytics' },
      { href: 'profile.html',            icon: 'bi-person',         label: 'Profile' },
      { href: '#', icon: 'bi-box-arrow-right', label: 'Logout', id: 'logoutBtn' }
    ]
  };

  const links = sidebarLinks[user.role] || sidebarLinks.citizen;
  document.getElementById('sidebarNav').innerHTML = links.map(l => `
    <li><a class="nav-link" href="${l.href}" ${l.id ? `id="${l.id}"` : ''}>
      <i class="bi ${l.icon} me-2"></i>${l.label}
    </a></li>`).join('');

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });

  if (!id) {
    showError('No incident ID provided.');
    return;
  }

  const statusBadge = {
    submitted:    'bg-secondary',
    investigating:'bg-info text-dark',
    resolved:     'bg-success',
    rejected:     'bg-danger'
  };

  const severityBadge = { low: 'bg-success', medium: 'bg-warning text-dark', high: 'bg-danger' };

  try {
    const res = await fetch(`/api/incidents/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) { showError('Incident not found.'); return; }

    const { incident, comments, media } = await res.json();

    // Header
    document.getElementById('incidentTitle').textContent = incident.title;
    document.getElementById('incidentMeta').textContent =
      `Reported on ${new Date(incident.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    // Status
    document.getElementById('statusBadge').textContent = incident.status;
    document.getElementById('statusBadge').className = `badge fs-6 px-3 py-2 ${statusBadge[incident.status] || 'bg-secondary'}`;
    document.getElementById('reportedOn').textContent = new Date(incident.created_at).toLocaleString();

    // Details grid
    const fields = [
      { label: 'Category',  value: incident.category },
      { label: 'Severity',  value: `<span class="badge ${severityBadge[incident.severity?.toLowerCase()] || 'bg-secondary'}">${incident.severity || 'N/A'}</span>` },
      { label: 'Date',      value: incident.incident_date ? new Date(incident.incident_date).toLocaleDateString() : 'N/A' },
      { label: 'Time',      value: incident.incident_time || 'N/A' },
      { label: 'Location',  value: incident.location || 'N/A' },
      { label: 'Submitted By (ID)', value: incident.submitted_by || 'N/A' }
    ];

    document.getElementById('detailsGrid').innerHTML = fields.map(f => `
      <div class="col-md-6">
        <label class="text-muted small d-block">${f.label}</label>
        <p class="fw-semibold mb-0">${f.value}</p>
      </div>`).join('');

    // Description
    document.getElementById('incidentDescription').textContent = incident.description || '—';

    // Location + Map
    const lat = parseFloat(incident.latitude);
    const lng = parseFloat(incident.longitude);
    document.getElementById('locationText').textContent = incident.location || 'Location not specified';

    const mapEl = document.getElementById('map');
    if (!isNaN(lat) && !isNaN(lng)) {
      document.getElementById('coordsText').textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      const map = L.map('map').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<strong>${incident.title}</strong><br>${incident.location || ''}`)
        .openPopup();
    } else {
      mapEl.innerHTML = '<p class="text-muted text-center py-4">No location coordinates available.</p>';
      mapEl.style.height = 'auto';
    }

    // Media
    const mediaGrid = document.getElementById('mediaGrid');
    if (media && media.length > 0) {
      mediaGrid.innerHTML = media.map(m => {
        // Normalise path — DB stores "uploads/filename.jpg"
        // Strip any leading slash or duplicate "uploads/" then prepend /uploads/
        const clean = m.file_path.replace(/^\//, '').replace(/^uploads\//, '');
        const filePath = `/uploads/${clean}`;
        const isVideo = filePath.match(/\.(mp4|webm|ogg)$/i);
        if (isVideo) {
          return `<video controls class="media-item"><source src="${filePath}"></video>`;
        }
        return `
          <div class="media-thumb">
            <img
              src="${filePath}"
              class="media-item"
              alt="Incident media"
              onclick="window.open('${filePath}', '_blank')"
              onerror="this.parentElement.innerHTML='<div class=media-error><i class=bi bi-image></i><br>Image not found</div>'"
            />
          </div>`;
      }).join('');
      document.getElementById('noMedia').classList.add('d-none');
    } else {
      mediaGrid.innerHTML = '';
      document.getElementById('noMedia').classList.remove('d-none');
    }

    // Comments
    const commentsList = document.getElementById('commentsList');
    if (comments && comments.length > 0) {
      commentsList.innerHTML = comments.map(c => `
        <div class="comment-item mb-3">
          <div class="d-flex justify-content-between">
            <strong class="small">${c.author}</strong>
            <small class="text-muted">${new Date(c.created_at).toLocaleString()}</small>
          </div>
          <p class="mb-0 mt-1">${c.content}</p>
        </div>`).join('');
    } else {
      commentsList.innerHTML = '<p class="text-muted small">No comments yet.</p>';
    }

    // Show comment form for officer and admin
    if (user.role === 'officer' || user.role === 'admin') {
      document.getElementById('commentFormWrapper').classList.remove('d-none');
      document.getElementById('submitComment').addEventListener('click', async () => {
        const content = document.getElementById('commentInput').value.trim();
        if (!content) return;
        try {
          const r = await fetch(`/api/incidents/${id}/comments`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
          });
          if (r.ok) {
            const { comment } = await r.json();
            commentsList.innerHTML += `
              <div class="comment-item mb-3">
                <div class="d-flex justify-content-between">
                  <strong class="small">${comment.author}</strong>
                  <small class="text-muted">${new Date(comment.createdAt).toLocaleString()}</small>
                </div>
                <p class="mb-0 mt-1">${comment.content}</p>
              </div>`;
            document.getElementById('commentInput').value = '';
          }
        } catch (err) {
          console.error('Failed to post comment:', err);
        }
      });
    }

  } catch (err) {
    showError('Failed to load incident details.');
  }

  function showError(msg) {
    const box = document.getElementById('errorBox');
    box.textContent = msg;
    box.classList.remove('d-none');
    document.getElementById('incidentTitle').textContent = 'Error';
  }
});
