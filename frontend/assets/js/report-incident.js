document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'login.html'; return; }

  const map = L.map('map').setView([12.9716, 77.5946], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let marker = L.marker([12.9716, 77.5946]).addTo(map);
  map.on('click', (event) => {
    marker.setLatLng(event.latlng);
    document.getElementById('latitude').value = event.latlng.lat.toFixed(6);
    document.getElementById('longitude').value = event.latlng.lng.toFixed(6);
  });

  document.getElementById('incidentForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('date', document.getElementById('date').value);
    formData.append('time', document.getElementById('time').value);
    formData.append('location', document.getElementById('location').value);
    formData.append('latitude', document.getElementById('latitude').value);
    formData.append('longitude', document.getElementById('longitude').value);
    formData.append('severity', document.getElementById('severity').value);

    const images = document.getElementById('images').files;
    for (let i = 0; i < images.length; i++) formData.append('images', images[i]);

    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Submission failed.');
        btn.disabled = false;
        btn.textContent = 'Submit Report';
        return;
      }

      alert('Incident submitted successfully!');
      window.location.href = 'citizen-dashboard.html';
    } catch (err) {
      alert('Unable to connect to server. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Submit Report';
    }
  });
});
