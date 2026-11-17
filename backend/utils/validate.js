// Small input helpers shared by the controllers.

// Returns a finite number > 0 rounded to 2 decimals, or null.
const toPositiveAmount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
};

// Returns a whole number >= 1, or null.
const toPositiveInt = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : null;
};

// Normalises Kenyan mobile numbers (07.., 01.., +254.., 254..) to 2547XXXXXXXX / 2541XXXXXXXX, or null.
const toKenyanMsisdn = (value) => {
  const digits = String(value || '').replace(/[\s()-]/g, '').replace(/^\+/, '');
  const local = digits.startsWith('254') ? digits.slice(3) : digits.replace(/^0/, '');
  return /^[17]\d{8}$/.test(local) ? `254${local}` : null;
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = { toPositiveAmount, toPositiveInt, toKenyanMsisdn, escapeHtml };
