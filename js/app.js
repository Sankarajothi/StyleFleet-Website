/**
 * STYLEFLEET SALON OS — CORE APPLICATION CONTROLLER
 * Manages Home Landing Page, Role-based Login Flow (Owner & Stylist),
 * Clean Phone & OTP Verification (No Demo Visualizer Clutter).
 */

const AppState = {
  currentView: 'home',
  loginRole: 'owner',
  authStep: 'phone', // 'phone' | 'otp'
  userPhone: '',
  timerInterval: null,
  countdownSeconds: 30
};

// ================= VIEW NAVIGATION =================
function showView(viewName) {
  AppState.currentView = viewName;
  const homeView = document.getElementById('view-home');
  const loginView = document.getElementById('view-login');

  if (viewName === 'login') {
    if (homeView) homeView.classList.add('hidden');
    if (loginView) {
      loginView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else {
    if (loginView) loginView.classList.add('hidden');
    if (homeView) {
      homeView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

function openLogin(role = 'owner') {
  setRole(role);
  resetAuthForm();
  showView('login');
}

function returnHome() {
  clearInterval(AppState.timerInterval);
  showView('home');
}

// ================= ROLE SELECTOR (OWNER / STYLIST) =================
function setRole(role) {
  AppState.loginRole = role;
  
  const ownerTab = document.getElementById('role-tab-owner');
  const stylistTab = document.getElementById('role-tab-stylist');
  const roleTitle = document.getElementById('login-role-title');
  const roleSubtitle = document.getElementById('login-role-subtitle');
  const roleBadge = document.getElementById('login-role-badge');
  const visualRoleText = document.getElementById('visual-role-quote');

  if (role === 'owner') {
    if (ownerTab) ownerTab.classList.add('active');
    if (stylistTab) stylistTab.classList.remove('active');
    if (roleTitle) roleTitle.textContent = 'Salon Owner Workspace';
    if (roleSubtitle) roleSubtitle.textContent = 'Sign in to access your salon billing, appointments, staff team & real-time revenue analytics.';
    if (roleBadge) roleBadge.innerHTML = '<span>👑</span> <span>Salon Owner</span>';
    if (visualRoleText) visualRoleText.textContent = '"Complete visibility into salon operations, stylist performance, and client satisfaction."';
  } else {
    if (stylistTab) stylistTab.classList.add('active');
    if (ownerTab) ownerTab.classList.remove('active');
    if (roleTitle) roleTitle.textContent = 'Stylist Workspace';
    if (roleSubtitle) roleSubtitle.textContent = 'Sign in to review your scheduled appointments, active chair queue & personal tips.';
    if (roleBadge) roleBadge.innerHTML = '<span>✂️</span> <span>Master Stylist</span>';
    if (visualRoleText) visualRoleText.textContent = '"Focus on the craft of beauty while your bookings and tips stay in perfect sync."';
  }

  // Switch back to phone step if user switches role
  switchToPhoneStep();
}

function resetAuthForm() {
  const phoneInput = document.getElementById('input-phone');
  if (phoneInput) phoneInput.value = '';
  
  for (let i = 1; i <= 6; i++) {
    const box = document.getElementById(`otp-${i}`);
    if (box) box.value = '';
  }
  
  switchToPhoneStep();
}

function switchToPhoneStep() {
  AppState.authStep = 'phone';
  clearInterval(AppState.timerInterval);
  
  const stepPhone = document.getElementById('step-phone');
  const stepOtp = document.getElementById('step-otp');
  
  if (stepPhone) stepPhone.classList.remove('hidden');
  if (stepOtp) stepOtp.classList.add('hidden');
  
  setTimeout(() => {
    const phoneInput = document.getElementById('input-phone');
    if (phoneInput) phoneInput.focus();
  }, 100);
}

function switchToOtpStep() {
  AppState.authStep = 'otp';
  
  const stepPhone = document.getElementById('step-phone');
  const stepOtp = document.getElementById('step-otp');
  
  if (stepPhone) stepPhone.classList.add('hidden');
  if (stepOtp) stepOtp.classList.remove('hidden');

  const phoneDisplay = document.getElementById('otp-sent-phone');
  if (phoneDisplay) {
    phoneDisplay.textContent = `+91 ${AppState.userPhone}`;
  }

  // Clear OTP boxes
  for (let i = 1; i <= 6; i++) {
    const box = document.getElementById(`otp-${i}`);
    if (box) box.value = '';
  }

  startResendTimer();

  setTimeout(() => {
    const firstOtp = document.getElementById('otp-1');
    if (firstOtp) firstOtp.focus();
  }, 120);
}

// ================= PHONE SUBMISSION =================
function handlePhoneSubmit(e) {
  if (e) e.preventDefault();
  
  const phoneInput = document.getElementById('input-phone');
  const rawValue = (phoneInput?.value || '').replace(/\D/g, '');

  if (rawValue.length < 10) {
    showToast('Please enter a valid 10-digit mobile number', 'error');
    if (phoneInput) phoneInput.focus();
    return;
  }

  AppState.userPhone = rawValue;
  showToast(`Verification code sent to +91 ${rawValue}`, 'success');
  switchToOtpStep();
}

// ================= OTP TIMER & RESEND =================
function startResendTimer() {
  clearInterval(AppState.timerInterval);
  AppState.countdownSeconds = 30;

  const timerText = document.getElementById('resend-timer-text');
  const resendBtn = document.getElementById('btn-resend-otp');

  if (timerText) {
    timerText.textContent = `Resend code in ${AppState.countdownSeconds}s`;
    timerText.classList.remove('hidden');
  }
  if (resendBtn) resendBtn.classList.add('hidden');

  AppState.timerInterval = setInterval(() => {
    AppState.countdownSeconds--;
    if (timerText) {
      timerText.textContent = `Resend code in ${AppState.countdownSeconds}s`;
    }

    if (AppState.countdownSeconds <= 0) {
      clearInterval(AppState.timerInterval);
      if (timerText) timerText.classList.add('hidden');
      if (resendBtn) resendBtn.classList.remove('hidden');
    }
  }, 1000);
}

function handleResendOtp() {
  startResendTimer();
  showToast(`New verification code sent to +91 ${AppState.userPhone}`, 'success');
}

// ================= OTP INPUT CONTROLLER =================
function initOtpInputs() {
  for (let i = 1; i <= 6; i++) {
    const box = document.getElementById(`otp-${i}`);
    if (!box) continue;

    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val ? val[0] : '';

      if (val && i < 6) {
        const nextBox = document.getElementById(`otp-${i + 1}`);
        if (nextBox) nextBox.focus();
      }

      // Check if all 6 boxes are filled
      let fullOtp = '';
      for (let j = 1; j <= 6; j++) {
        fullOtp += (document.getElementById(`otp-${j}`)?.value || '');
      }

      if (fullOtp.length === 6) {
        setTimeout(() => handleOtpVerify(), 200);
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 1) {
        const prevBox = document.getElementById(`otp-${i - 1}`);
        if (prevBox) {
          prevBox.focus();
          prevBox.value = '';
        }
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        for (let j = 0; j < pasted.length; j++) {
          const target = document.getElementById(`otp-${j + 1}`);
          if (target) target.value = pasted[j];
        }

        if (pasted.length === 6) {
          setTimeout(() => handleOtpVerify(), 250);
        } else {
          document.getElementById(`otp-${Math.min(6, pasted.length + 1)}`)?.focus();
        }
      }
    });
  }
}

// ================= OTP VERIFICATION =================
function handleOtpVerify(e) {
  if (e) e.preventDefault();

  let enteredOtp = '';
  for (let i = 1; i <= 6; i++) {
    enteredOtp += (document.getElementById(`otp-${i}`)?.value || '');
  }

  if (enteredOtp.length < 6) {
    showToast('Please enter all 6 digits of the code', 'error');
    return;
  }

  clearInterval(AppState.timerInterval);

  const roleName = AppState.loginRole === 'owner' ? 'Salon Owner' : 'Stylist';
  showToast(`✨ Welcome to StyleFleet! Logged in as ${roleName}.`, 'success');

  // Store in session storage
  const session = {
    isLoggedIn: true,
    role: AppState.loginRole,
    phone: AppState.userPhone,
    authTime: Date.now()
  };
  localStorage.setItem('stylefleet_auth_session', JSON.stringify(session));

  // If prototype_reference.html exists, user can also explore the full prototype workspace:
  setTimeout(() => {
    // Show confirmation pill or link to prototype reference if desired
    console.log('Authentication confirmed for:', session);
  }, 1200);
}

// ================= TOAST NOTIFICATION =================
function showToast(message, type = 'success') {
  let toast = document.getElementById('stylefleet-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'stylefleet-toast';
    toast.className = 'stylefleet-toast';
    document.body.appendChild(toast);
  }

  const icon = type === 'error' ? '⚠️' : '✓';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toast.style.borderColor = type === 'error' ? '#EF4444' : '#D4AF37';

  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3600);
}

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  initOtpInputs();

  // Listen to mobile input digit filtering
  const phoneInput = document.getElementById('input-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
  }
});
