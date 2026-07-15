function showAlert(message, type = 'danger') {
  const box = document.getElementById('alertBox');
  box.className = `alert alert-${type}`;
  box.textContent = message;
  box.classList.remove('d-none');
}

document.getElementById('loginForm').addEventListener('submit', async function (event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showAlert('Please fill in all fields.');
    return;
  }

  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  btnText.textContent = 'Signing in...';
  btnSpinner.classList.remove('d-none');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.message || 'Login failed.');
      btnText.textContent = 'Sign In';
      btnSpinner.classList.add('d-none');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    showAlert('Login successful! Redirecting...', 'success');

    const role = data.user.role;
    setTimeout(() => {
      if (role === 'admin') window.location.href = 'admin-dashboard.html';
      else if (role === 'officer') window.location.href = 'officer-dashboard.html';
      else window.location.href = 'citizen-dashboard.html';
    }, 800);

  } catch (err) {
    showAlert('Unable to connect to server. Please try again.');
    btnText.textContent = 'Sign In';
    btnSpinner.classList.add('d-none');
  }
});

document.getElementById('forgotForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim();
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const alertBox = document.getElementById('forgotAlert');

  function showForgotAlert(msg, type = 'danger') {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = msg;
    alertBox.classList.remove('d-none');
  }

  if (!email || !newPassword || !confirmPassword) return showForgotAlert('All fields are required.');
  if (newPassword !== confirmPassword) return showForgotAlert('Passwords do not match.');
  if (newPassword.length < 6) return showForgotAlert('Password must be at least 6 characters.');

  const btn = document.getElementById('resetBtn');
  btn.disabled = true;
  btn.textContent = 'Resetting...';

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword })
    });
    const data = await res.json();
    if (!res.ok) return showForgotAlert(data.message || 'Reset failed.');
    showForgotAlert('Password reset successful! You can now log in.', 'success');
    document.getElementById('forgotForm').reset();
    setTimeout(() => bootstrap.Modal.getInstance(document.getElementById('forgotModal')).hide(), 1500);
  } catch {
    showForgotAlert('Unable to connect to server.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reset Password';
  }
});
