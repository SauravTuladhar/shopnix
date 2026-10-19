/* ===================== ADMIN LOGIN PAGE ===================== */
/* Loaded only by admin/login.html, after admin.js (for isAdmin()/sb). */

function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (new URLSearchParams(window.location.search).get('denied')){
  const alertEl = document.getElementById('adminLoginAlert');
  alertEl.textContent = 'That account does not have admin access.';
  alertEl.className = 'form-alert show error';
}

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const emailField = document.getElementById('emailField');
  const passwordField = document.getElementById('passwordField');
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const alertEl = document.getElementById('adminLoginAlert');

  let valid = true;
  emailField.classList.toggle('invalid', !isValidEmail(email)); if (!isValidEmail(email)) valid = false;
  passwordField.classList.toggle('invalid', password.length === 0); if (!password) valid = false;
  if (!valid){
    alertEl.textContent = 'Please fix the errors above.';
    alertEl.className = 'form-alert show error';
    return;
  }

  const submitBtn = document.querySelector('#adminLoginForm button[type="submit"]');
  submitBtn.disabled = true;
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error){
    submitBtn.disabled = false;
    alertEl.textContent = error.message;
    alertEl.className = 'form-alert show error';
    return;
  }

  const admin = await isAdmin(data.user.id);
  submitBtn.disabled = false;
  if (!admin){
    await sb.auth.signOut();
    alertEl.textContent = 'That account does not have admin access.';
    alertEl.className = 'form-alert show error';
    return;
  }

  alertEl.textContent = 'Welcome back! Redirecting...';
  alertEl.className = 'form-alert show success';
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
});
