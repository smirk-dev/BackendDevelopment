// Unit tests for the pure rules in js/rules.js — run with `node --test test/`.
const test = require('node:test');
const assert = require('node:assert/strict');
const { PATTERNS, passwordReport, ageOn } = require('../js/rules.js');

test('full name pattern', () => {
  for (const ok of ['Suryansh Mishra', "D'Souza", 'A. P. J. Abdul Kalam', 'Jean-Luc', 'सूर्यांश'])
    assert.ok(PATTERNS.fullName.test(ok), ok);
  for (const bad of ['1Suryansh', 'Surya123', ' Surya', 'a@b'])
    assert.ok(!PATTERNS.fullName.test(bad), bad);
});

test('username pattern', () => {
  assert.ok(PATTERNS.username.test('smirk_dev'));
  for (const bad of ['Smirk', '1abc', 'ab-c', 'a b']) assert.ok(!PATTERNS.username.test(bad), bad);
});

test('email pattern needs a dotted domain', () => {
  assert.ok(PATTERNS.email.test('name@stu.upes.ac.in'));
  for (const bad of ['a@b', 'a@b.', 'a b@c.com', 'a@@b.com', '@b.com']) assert.ok(!PATTERNS.email.test(bad), bad);
});

test('Indian mobile pattern (spaces already stripped)', () => {
  for (const ok of ['9876543210', '+919876543210', '+91-9876543210', '09876543210']) assert.ok(PATTERNS.phone.test(ok), ok);
  for (const bad of ['5876543210', '987654321', '98765432100', '+1 9876543210']) assert.ok(!PATTERNS.phone.test(bad), bad);
});

test('PIN code pattern', () => {
  assert.ok(PATTERNS.pin.test('248007'));
  for (const bad of ['048007', '24800', '2480071', '24800a']) assert.ok(!PATTERNS.pin.test(bad), bad);
});

test('password report scores and labels', () => {
  assert.equal(passwordReport('').label, '');
  assert.equal(passwordReport('abc').score, 1);
  assert.equal(passwordReport('abcdefgh').score, 2);
  assert.equal(passwordReport('Abcdefg1').score, 4);
  assert.equal(passwordReport('Abcdefg1').acceptable, false);
  assert.equal(passwordReport('Abcdef1!').acceptable, true);
  assert.equal(passwordReport('Abcdef1!').label, 'Strong');
  assert.equal(passwordReport('Lab#Exp06-2026').label, 'Very strong');
});

test('age calculation respects the birthday', () => {
  const today = new Date(2026, 8, 30); // 30 Sep 2026
  assert.equal(ageOn('2009-09-30', today), 17);
  assert.equal(ageOn('2009-10-01', today), 16);
  assert.equal(ageOn('2005-03-14', today), 21);
});
