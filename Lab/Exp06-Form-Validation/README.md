# Experiment 06 — Client-side scripts for form validation using JavaScript

Row 6 of `Lectures/Backend Development/Lab/000 List of Experiments.md` ("Client-Side Scripts for
Form Validation using JavaScript", CO2). **The course publishes no manual for this experiment**, so
the scope below is my own: a student-registration form that exercises every common kind of
client-side check.

## What it covers

| Requirement | How |
|-------------|-----|
| Required fields | 13 required controls: text, email, tel, date, radio group, select, number, password, checkbox |
| Patterns | name (Unicode letters), username, SAP ID (`pattern` attribute), Indian mobile, PIN code |
| Length | name 3-50, username 4-16, password 8-64, bio 20-200 if given, with live character counter |
| Password strength + confirm | five-rule live checklist, strength meter (Too weak … Very strong), no spaces, must not contain the username, confirm re-checked whenever the password changes, Show/Hide toggle |
| Email | `type="email"` (`validity.typeMismatch`) plus a stricter dotted-domain rule, since browsers accept `a@b` |
| Phone | 10 digits starting 6-9, optional `+91` / `0`, spaces and hyphens tolerated |
| Date | real date, not in the future, not before 1950, age at least 17 (birthday-accurate) |
| Number / URL | semester 1-8 whole number (`rangeUnderflow`/`rangeOverflow`/`stepMismatch`), optional http(s) URL |
| Custom messages | one plain-language message per failure, written into the element with `setCustomValidity()` so `form.checkValidity()` and `:invalid` agree with the JavaScript |
| Live + submit validation | a field is checked on first `blur`, then on every `input`; submit checks all fields, shows an error summary and focuses it |
| Accessible errors | `aria-invalid`, messages linked by `aria-describedby`, error summary with `role="alert"` and links that move focus to the field, polite live regions for the strength label and bio counter, errors prefixed "Error:" so colour is never the only signal |

The form has `novalidate`, so the browser's own tooltips never appear — but the Constraint
Validation API (`validity`, `checkValidity()`, `setCustomValidity()`) is still used throughout.

## Files

```
index.html          the form, the rules table, an explanation
css/style.css       Exp 01 visual register + form styles
js/rules.js         pure rules (patterns, password report, age) — browser and Node
js/validate.js      wiring: validators per field, live/submit flow, ARIA, summary, meter
test/rules.test.js  node:test unit tests for js/rules.js
```

## Run

```bash
py -3 -m http.server 8000          # open http://localhost:8000
node --test test/rules.test.js     # unit tests, no install needed
```

Opening `index.html` straight from disk also works (no `fetch`), but the checks below were run over HTTP.
"Fill with valid sample data" fills every field with passing values for a quick demo.

## Checks run

**Unit tests** (Node v22.23.2):

```text
ok 1 - full name pattern
ok 2 - username pattern
ok 3 - email pattern needs a dotted domain
ok 4 - Indian mobile pattern (spaces already stripped)
ok 5 - PIN code pattern
ok 6 - password report scores and labels
ok 7 - age calculation respects the birthday
# tests 7
# pass 7
# fail 0
```

Writing the name test caught a real bug: Devanagari names such as सूर्यांश failed because the
vowel signs are combining marks (`\p{M}`), not letters. The pattern now allows them.

**In the browser** — headless Chrome 158 over the DevTools protocol, page served at
`http://127.0.0.1:3032/Exp06-Form-Validation/`.

1. *Empty submit* → error summary shown with 13 problems, focus moved to the summary,
   `form.checkValidity()` = `false`, `aria-invalid="true"` on 16 controls (12 fields + 4 radios):

```text
Full name: Enter your full name.
Email: Enter your email address.
Mobile number: Enter your mobile number.
Date of birth: Enter your date of birth.
Gender: Choose one option.
SAP ID: Enter your SAP ID.
Programme: Choose your programme from the list.
Semester: Enter your current semester.
Username: Choose a username.
Password: Choose a password.
Confirm password: Re-enter your password.
PIN code: Enter your PIN code.
Confirmation: Tick the box to confirm your details.
```

2. *Each rule, one input at a time* (value set, `input` + `blur` dispatched; the message is what
   the page showed, and in every row it also equalled the element's `validationMessage`, i.e.
   `setCustomValidity` was in sync):

| Field | Input | Message shown | aria-invalid |
|-------|-------|---------------|--------------|
| fullName | `Su` | Name is too short — 2 character(s), at least 3 needed. | true |
| fullName | `Surya123` | Use letters, spaces, apostrophes, dots or hyphens only, starting with a letter. | true |
| fullName | `Suryansh D'Souza-Mishra` | valid | false |
| email | `suryansh` | That does not look like an email address — it needs one @ and a domain, e.g. name@example.com. | true |
| email | `a@b` | The domain after @ needs a dot, e.g. example.com. | true |
| email | `name@stu.upes.ac.in` | valid | false |
| phone | `12345` | Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9. | true |
| phone | `98765abc10` | Use digits only (spaces, hyphens and a leading +91 are fine). | true |
| phone | `5876543210` | Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9. | true |
| phone | `+91 98765 43210` | valid | false |
| dob | `2099-01-01` | Date of birth cannot be in the future. | true |
| dob | `2012-06-01` | You must be at least 17 years old (you would be 14). | true |
| dob | `1940-01-01` | Please check the year — dates before 1950 are not accepted. | true |
| dob | `2005-03-14` | valid | false |
| sapId | `123` | SAP ID is 9 digits and starts with 5, e.g. 590012069. | true |
| sapId | `590012069` | valid | false |
| semester | `0` | Semester must be between 1 and 8. | true |
| semester | `9` | Semester must be between 1 and 8. | true |
| semester | `2.5` | Semester must be a whole number. | true |
| semester | `5` | valid | false |
| website | `github.com/smirk-dev` | Enter a full URL, e.g. https://github.com/your-name. | true |
| website | `ftp://files.example.com` | Only http:// or https:// links are accepted. | true |
| website | `https://github.com/smirk-dev` | valid | false |
| username | `abc` | Username is too short — 3 character(s), at least 4 needed. | true |
| username | `Smirk` | Use lower-case letters only. | true |
| username | `1smirk` | Username must start with a letter. | true |
| username | `smirk-dev` | Only lower-case letters, digits and underscores are allowed. | true |
| username | `admin` | "admin" is reserved — please choose another username. | true |
| username | `smirk_dev` | valid | false |
| password | `abc` | Password still needs: at least 8 characters, an upper-case letter, a digit, a symbol such as ! @ # $. | true |
| password | `abcdefgh` | Password still needs: an upper-case letter, a digit, a symbol such as ! @ # $. | true |
| password | `Abcdefg1` | Password still needs: a symbol such as ! @ # $. | true |
| password | `Has Space1!` | Password cannot contain spaces. | true |
| password | `Xsmirk_dev1!` | Password must not contain your username. | true |
| password | `Lab#Exp06-2026` | valid | false |
| confirm | `Lab#Exp06` | Passwords do not match. | true |
| confirm | `Lab#Exp06-2026` | valid | false |
| pin | `048007` | PIN code is 6 digits and cannot start with 0. | true |
| pin | `2480` | PIN code is 6 digits and cannot start with 0. | true |
| pin | `248007` | valid | false |
| bio | `Too short` | Bio is too short — 9 character(s), write at least 20 or leave it empty. | true |
| bio | `A bio that is comfortably longer than twenty characters.` | valid | false |

3. *Interplay*: after a valid password the meter read "Strength: Very strong" with all 5 checklist
   items met; changing the password made the already-filled confirm field show "Passwords do not
   match." live, and restoring it cleared the error; a touched SAP ID error cleared as soon as a
   valid value was typed; an untouched field showed nothing while typing (no nagging before blur).

4. *Valid submission* (sample data) → summary hidden, `form.checkValidity()` = `true`, zero
   `aria-invalid="true"`, and the result panel showed the payload with both password fields removed:

```json
{
  "fullName": "Suryansh Mishra",
  "email": "suryansh@stu.upes.ac.in",
  "phone": "+91 98765 43210",
  "dob": "2005-03-14",
  "gender": "male",
  "sapId": "590012069",
  "program": "B.Tech CSE (Full Stack)",
  "semester": "5",
  "website": "https://github.com/smirk-dev",
  "username": "smirk_dev",
  "pin": "248007",
  "bio": "Third-year student building backend projects with Node and Express.",
  "terms": "on"
}
```

5. *Mixed submit* (bad email, wrong confirm, box unticked) → summary listed exactly those 3.

Zero console errors; zero horizontal overflow at 1280 px and 375 px (a first run overflowed by
77 px at 375 px because of the rules table — it now scrolls inside its own container).

Screenshots: `screenshots/exp06-1280.png`, `screenshots/exp06-375.png` (the mixed failed submit:
summary plus inline errors), `screenshots/exp06-valid-submit-1280.png`,
`screenshots/exp06-valid-submit-375.png` (the accepted payload).

## Notes

- Client-side validation improves the experience; it is not security. Anyone can bypass it, so a
  server must repeat every check (Exam 01 in this repo validates server-side and answers HTTP 422).
- `minlength`/`maxlength` are on the inputs for the browser's benefit, but the length rules are also
  checked explicitly in JavaScript: `validity.tooShort` is only set after a *user* edit, never for a
  value set by script, so relying on it alone would let pasted or autofilled values through unchecked.
