// Pure validation rules — no DOM in here, so the same file runs in the browser
// (window.Rules) and under Node for the unit tests (module.exports).
(function (root) {
  'use strict';

  const PATTERNS = {
    // Letters (any script, with combining marks such as Devanagari matras), spaces, apostrophes, dots and hyphens; must start with a letter.
    fullName: /^\p{L}[\p{L}\p{M} .'-]*$/u,
    // Lower-case letter first, then lower-case letters, digits or underscores.
    username: /^[a-z][a-z0-9_]*$/,
    // Pragmatic email: something@domain.tld — stricter than the browser's type="email",
    // which accepts "a@b" with no dot in the domain.
    email: /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/,
    // Indian mobile: optional +91 / 0 prefix, then 10 digits starting 6-9.
    phone: /^(?:\+91[\s-]?|0)?[6-9]\d{9}$/,
    pin: /^[1-9]\d{5}$/
  };

  const RESERVED_USERNAMES = ['admin', 'root', 'administrator', 'support', 'system'];

  // The five password requirements shown as a live checklist.
  const PASSWORD_RULES = [
    { id: 'len', label: 'At least 8 characters', test: p => p.length >= 8 },
    { id: 'lower', label: 'A lower-case letter', test: p => /[a-z]/.test(p) },
    { id: 'upper', label: 'An upper-case letter', test: p => /[A-Z]/.test(p) },
    { id: 'digit', label: 'A digit', test: p => /\d/.test(p) },
    { id: 'symbol', label: 'A symbol such as ! @ # $', test: p => /[^A-Za-z0-9\s]/.test(p) }
  ];

  function passwordReport(password) {
    const passed = PASSWORD_RULES.map(r => ({ id: r.id, ok: r.test(password) }));
    let score = passed.filter(r => r.ok).length;
    if (password.length >= 12 && score === 5) score = 6; // long and complete: "very strong"
    const labels = ['Too weak', 'Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
    return { passed, score, label: password ? labels[score] : '', acceptable: score >= 5 };
  }

  // Whole years between an ISO date (yyyy-mm-dd) and `today`.
  function ageOn(isoDate, today) {
    const [y, m, d] = isoDate.split('-').map(Number);
    let age = today.getFullYear() - y;
    const beforeBirthday = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
    if (beforeBirthday) age--;
    return age;
  }

  function normalisePhone(raw) {
    return raw.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '');
  }

  const api = { PATTERNS, RESERVED_USERNAMES, PASSWORD_RULES, passwordReport, ageOn, normalisePhone };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Rules = api;
})(typeof window !== 'undefined' ? window : globalThis);
