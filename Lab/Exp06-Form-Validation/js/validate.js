// Exp 06 — client-side validation for the registration form.
// Uses the Constraint Validation API (validity + setCustomValidity) with novalidate on the form,
// so every message is ours and every error is announced accessibly.
(function () {
  'use strict';
  const { PATTERNS, RESERVED_USERNAMES, PASSWORD_RULES, passwordReport, ageOn } = window.Rules;

  const form = document.getElementById('reg-form');
  const summary = document.getElementById('error-summary');
  const summaryList = document.getElementById('error-list');
  const result = document.getElementById('result');
  const el = id => document.getElementById(id);

  // Latest allowed birth date = today; the age rule is checked separately.
  const todayIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  el('dob').max = todayIso;

  // ---------- one validator per field: return '' when valid, otherwise the message ----------
  const labels = {
    fullName: 'Full name', email: 'Email', phone: 'Mobile number', dob: 'Date of birth',
    gender: 'Gender', sapId: 'SAP ID', program: 'Programme', semester: 'Semester',
    website: 'Website', username: 'Username', password: 'Password', confirm: 'Confirm password',
    pin: 'PIN code', bio: 'Short bio', terms: 'Confirmation'
  };

  const validators = {
    fullName(input) {
      const v = input.value.trim();
      if (!v) return 'Enter your full name.';
      if (v.length < 3) return `Name is too short — ${v.length} character(s), at least 3 needed.`;
      if (v.length > 50) return 'Name must be 50 characters or fewer.';
      if (!PATTERNS.fullName.test(v)) return 'Use letters, spaces, apostrophes, dots or hyphens only, starting with a letter.';
      return '';
    },
    email(input) {
      const v = input.value.trim();
      if (input.validity.valueMissing || !v) return 'Enter your email address.';
      if (input.validity.typeMismatch) return 'That does not look like an email address — it needs one @ and a domain, e.g. name@example.com.';
      if (!PATTERNS.email.test(v)) return 'The domain after @ needs a dot, e.g. example.com.';
      return '';
    },
    phone(input) {
      const v = input.value.trim();
      if (!v) return 'Enter your mobile number.';
      const compact = v.replace(/[\s-]/g, '');
      if (/[^\d+]/.test(compact)) return 'Use digits only (spaces, hyphens and a leading +91 are fine).';
      if (!PATTERNS.phone.test(compact)) return 'Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9.';
      return '';
    },
    dob(input) {
      if (input.validity.badInput) return 'Enter a complete, real date.';
      if (!input.value) return 'Enter your date of birth.';
      if (input.value > todayIso) return 'Date of birth cannot be in the future.';
      if (input.value < input.min) return 'Please check the year — dates before 1950 are not accepted.';
      const age = ageOn(input.value, new Date());
      if (age < 17) return `You must be at least 17 years old (you would be ${age}).`;
      return '';
    },
    gender() {
      return form.querySelector('input[name="gender"]:checked') ? '' : 'Choose one option.';
    },
    sapId(input) {
      if (!input.value.trim()) return 'Enter your SAP ID.';
      if (input.validity.patternMismatch) return 'SAP ID is 9 digits and starts with 5, e.g. 590012069.';
      return '';
    },
    program(input) {
      return input.validity.valueMissing ? 'Choose your programme from the list.' : '';
    },
    semester(input) {
      const s = input.validity;
      if (s.badInput) return 'Semester must be a number.';
      if (s.valueMissing) return 'Enter your current semester.';
      if (s.rangeUnderflow || s.rangeOverflow) return 'Semester must be between 1 and 8.';
      if (s.stepMismatch) return 'Semester must be a whole number.';
      return '';
    },
    website(input) {
      const v = input.value.trim();
      if (!v) return '';
      if (input.validity.typeMismatch) return 'Enter a full URL, e.g. https://github.com/your-name.';
      if (!/^https?:\/\//i.test(v)) return 'Only http:// or https:// links are accepted.';
      return '';
    },
    username(input) {
      const v = input.value;
      if (!v) return 'Choose a username.';
      if (v.length < 4) return `Username is too short — ${v.length} character(s), at least 4 needed.`;
      if (v.length > 16) return 'Username must be 16 characters or fewer.';
      if (input.validity.patternMismatch) {
        if (/[A-Z]/.test(v)) return 'Use lower-case letters only.';
        if (!/^[a-z]/.test(v)) return 'Username must start with a letter.';
        return 'Only lower-case letters, digits and underscores are allowed.';
      }
      if (RESERVED_USERNAMES.includes(v)) return `"${v}" is reserved — please choose another username.`;
      return '';
    },
    password(input) {
      const v = input.value;
      if (!v) return 'Choose a password.';
      if (/\s/.test(v)) return 'Password cannot contain spaces.';
      const report = passwordReport(v);
      if (!report.acceptable) {
        const missing = PASSWORD_RULES.filter((r, i) => !report.passed[i].ok).map(r => r.label.toLowerCase());
        return `Password still needs: ${missing.join(', ')}.`;
      }
      const user = el('username').value.toLowerCase();
      if (user.length >= 4 && v.toLowerCase().includes(user)) return 'Password must not contain your username.';
      return '';
    },
    confirm(input) {
      if (!input.value) return 'Re-enter your password.';
      if (input.value !== el('password').value) return 'Passwords do not match.';
      return '';
    },
    pin(input) {
      const v = input.value.trim();
      if (!v) return 'Enter your PIN code.';
      if (!PATTERNS.pin.test(v)) return 'PIN code is 6 digits and cannot start with 0.';
      return '';
    },
    bio(input) {
      const n = input.value.trim().length;
      if (n === 0) return '';
      if (n < 20) return `Bio is too short — ${n} character(s), write at least 20 or leave it empty.`;
      if (n > 200) return 'Bio must be 200 characters or fewer.';
      return '';
    },
    terms(input) {
      return input.checked ? '' : 'Tick the box to confirm your details.';
    }
  };

  // ---------- wiring ----------
  const fieldNames = Object.keys(validators);
  const touched = new Set();

  function controlsOf(name) {
    return name === 'gender' ? [...form.querySelectorAll('input[name="gender"]')] : [el(name)];
  }

  // Validate one field, update its message, ARIA state and custom validity. Returns the message.
  function check(name) {
    const controls = controlsOf(name);
    const message = validators[name](controls[0]);
    const errorEl = el(`${name}-error`);
    errorEl.textContent = message;
    controls.forEach(c => {
      c.setCustomValidity(message);                 // keeps form.checkValidity() honest
      c.setAttribute('aria-invalid', message ? 'true' : 'false');
    });
    const wrapper = form.querySelector(`[data-field="${name}"]`);
    wrapper.classList.toggle('invalid', !!message);
    wrapper.classList.toggle('valid', !message && hasValue(name));
    return message;
  }

  function hasValue(name) {
    if (name === 'gender') return !!form.querySelector('input[name="gender"]:checked');
    const c = el(name);
    return c.type === 'checkbox' ? c.checked : c.value.trim() !== '';
  }

  // Radios share the group's error text.
  form.querySelectorAll('input[name="gender"]').forEach(r => r.setAttribute('aria-describedby', 'gender-error'));

  fieldNames.forEach(name => {
    controlsOf(name).forEach(control => {
      control.addEventListener('blur', () => {
        // the radio group counts as "left" only once focus leaves the whole group
        if (name === 'gender') {
          setTimeout(() => {
            if (!el('gender-group').contains(document.activeElement)) { touched.add(name); check(name); }
          });
          return;
        }
        touched.add(name);
        check(name);
      });
      const live = () => {
        if (name === 'gender' || name === 'terms' || name === 'program') touched.add(name);
        if (touched.has(name)) check(name);
        // dependent fields
        if (name === 'password' && touched.has('confirm')) check('confirm');
        if (name === 'username' && touched.has('password')) check('password');
        if (summary.hidden === false) refreshSummary();
      };
      control.addEventListener('input', live);
      control.addEventListener('change', live);
    });
  });

  // ---------- password meter and checklist ----------
  const ruleList = el('password-rules');
  PASSWORD_RULES.forEach(r => {
    const li = document.createElement('li');
    li.id = `rule-${r.id}`;
    li.textContent = r.label;
    ruleList.appendChild(li);
  });
  function updateMeter() {
    const report = passwordReport(el('password').value);
    report.passed.forEach(p => {
      const li = el(`rule-${p.id}`);
      li.classList.toggle('met', p.ok);
      li.setAttribute('aria-label', `${li.textContent}: ${p.ok ? 'met' : 'not met'}`);
    });
    el('meter-bar').style.width = `${(report.score / 6) * 100}%`;
    el('meter-bar').dataset.score = report.score;
    el('password-strength').textContent = report.label ? `Strength: ${report.label}` : '';
  }
  el('password').addEventListener('input', updateMeter);
  updateMeter();

  el('toggle-password').addEventListener('click', e => {
    const showing = el('password').type === 'text';
    el('password').type = el('confirm').type = showing ? 'password' : 'text';
    e.currentTarget.textContent = showing ? 'Show' : 'Hide';
    e.currentTarget.setAttribute('aria-pressed', String(!showing));
  });

  // ---------- bio counter ----------
  function updateCount() {
    el('bio-count').textContent = `${el('bio').value.length} / 200 characters (20 minimum if you write one)`;
  }
  el('bio').addEventListener('input', updateCount);

  // ---------- submit ----------
  function refreshSummary() {
    const problems = fieldNames.filter(n => el(`${n}-error`).textContent);
    if (!problems.length) { summary.hidden = true; return problems; }
    summaryList.replaceChildren();
    problems.forEach(n => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${n === 'gender' ? 'gender-group' : n}`;
      a.textContent = `${labels[n]}: ${el(`${n}-error`).textContent}`;
      a.addEventListener('click', ev => { ev.preventDefault(); controlsOf(n)[0].focus(); });
      li.appendChild(a);
      summaryList.appendChild(li);
    });
    el('error-count').textContent = problems.length;
    summary.hidden = false;
    return problems;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    fieldNames.forEach(n => { touched.add(n); check(n); });
    const problems = refreshSummary();
    if (problems.length || !form.checkValidity()) {
      result.hidden = true;
      summary.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    delete data.password; delete data.confirm;   // never echo secrets back
    result.replaceChildren();
    const h = document.createElement('h3');
    h.textContent = 'Registration valid — this is what would be sent to the server';
    const pre = document.createElement('pre');
    pre.className = 'out';
    pre.textContent = JSON.stringify(data, null, 2);
    result.append(h, pre);
    result.hidden = false;
    result.dataset.submitted = 'true';
  });

  form.addEventListener('reset', () => {
    setTimeout(() => {
      touched.clear();
      fieldNames.forEach(n => {
        el(`${n}-error`).textContent = '';
        controlsOf(n).forEach(c => { c.setCustomValidity(''); c.removeAttribute('aria-invalid'); });
        form.querySelector(`[data-field="${n}"]`).classList.remove('invalid', 'valid');
      });
      summary.hidden = true;
      result.hidden = true;
      updateMeter();
      updateCount();
    });
  });

  // ---------- demo helper ----------
  el('fill-demo').addEventListener('click', () => {
    const values = {
      fullName: 'Suryansh Mishra', email: 'suryansh@stu.upes.ac.in', phone: '+91 98765 43210',
      dob: '2005-03-14', sapId: '590012069', program: 'B.Tech CSE (Full Stack)', semester: '5',
      website: 'https://github.com/smirk-dev', username: 'smirk_dev', password: 'Lab#Exp06-2026',
      confirm: 'Lab#Exp06-2026', pin: '248007', bio: 'Third-year student building backend projects with Node and Express.'
    };
    Object.entries(values).forEach(([k, v]) => { el(k).value = v; });
    form.querySelector('input[name="gender"][value="male"]').checked = true;
    el('terms').checked = true;
    updateMeter();
    updateCount();
    fieldNames.forEach(n => { touched.add(n); check(n); });
    refreshSummary();
  });

  window.__exp06 = { check, validators };   // exposed for the automated checks only
})();
