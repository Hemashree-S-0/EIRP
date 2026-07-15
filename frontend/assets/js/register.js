const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');

function checkStrength(password) {
  let strength = 20;
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^A-Za-z0-9]/.test(password)) strength += 15;
  return Math.min(strength, 100);
}

passwordInput.addEventListener('input', () => {
  const strength = checkStrength(passwordInput.value);
  strengthBar.style.width = `${strength}%`;
  strengthText.textContent = strength >= 80 ? 'Password strength: Strong' : strength >= 60 ? 'Password strength: Good' : 'Password strength: Weak';
});

document.getElementById('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (passwordInput.value !== confirmInput.value) {
    alert('Passwords do not match.');
    return;
  }

  const role = document.querySelector('input[name="role"]:checked')?.value || 'citizen';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        password: passwordInput.value,
        role
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Registration failed.');
      return;
    }

    alert('Registration successful! Please login.');
    window.location.href = 'login.html';
  } catch (err) {
    alert('Unable to connect to server. Please try again.');
  }
});
