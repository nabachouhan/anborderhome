// Eye toggle helper
document.addEventListener('DOMContentLoaded', function () {
    function setupEyeToggle(btnId, inputId, iconId) {
      var btn = document.getElementById(btnId);
      if (!btn) return;
      btn.addEventListener('click', function () {
        var input = document.getElementById(inputId);
        var icon  = document.getElementById(iconId);
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.replace('bi-eye', 'bi-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.replace('bi-eye-slash', 'bi-eye');
        }
      });
    }
    setupEyeToggle('toggleCurrentPw',  'currentPassword',  'iconCurrentPw');
    setupEyeToggle('toggleNewPw',       'newPassword',      'iconNewPw');
    setupEyeToggle('toggleConfirmPw',   'confirmPassword',  'iconConfirmPw');

    // Strength meter
    var newPwEl     = document.getElementById('newPassword');
    var strBar      = document.getElementById('strengthBar');
    var strLbl      = document.getElementById('strengthLabel');
    var confirmEl   = document.getElementById('confirmPassword');
    var matchLbl    = document.getElementById('matchLabel');

    if (newPwEl) {
        function calcStrength(pw) {
          var s = 0;
          if (pw.length >= 8)           s++;
          if (pw.length >= 12)          s++;
          if (/[A-Z]/.test(pw))         s++;
          if (/[0-9]/.test(pw))         s++;
          if (/[^A-Za-z0-9]/.test(pw))  s++;
          return s;
        }

        newPwEl.addEventListener('input', function () {
          var pw = newPwEl.value;
          var s  = calcStrength(pw);
          var colors = ['#dc3545','#fd7e14','#ffc107','#20c997','#198754'];
          var labels = ['Very Weak','Weak','Fair','Strong','Very Strong'];
          if (strBar) {
              strBar.style.width           = ((s / 5) * 100) + '%';
              strBar.style.backgroundColor = pw.length ? (colors[s - 1] || colors[0]) : '';
          }
          if (strLbl) {
              strLbl.textContent           = pw.length ? (labels[s - 1] || labels[0]) : '';
          }
          checkMatch();
        });

        function checkMatch() {
          if (!confirmEl || !matchLbl) return;
          if (!confirmEl.value) { matchLbl.textContent = ''; return; }
          if (newPwEl.value === confirmEl.value) {
            matchLbl.innerHTML = '<span class="text-success"><i class="bi bi-check-circle-fill me-1"></i>Passwords match</span>';
          } else {
            matchLbl.innerHTML = '<span class="text-danger"><i class="bi bi-x-circle-fill me-1"></i>Passwords do not match</span>';
          }
        }
        
        if (confirmEl) {
            confirmEl.addEventListener('input', checkMatch);
        }
    }
});
