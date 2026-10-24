// Local-date helpers (YYYY-MM-DD) so "today" follows the server's timezone
const pad = (n) => String(n).padStart(2, '0');

const toDateString = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const monthPrefix = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

module.exports = { toDateString, monthPrefix };
