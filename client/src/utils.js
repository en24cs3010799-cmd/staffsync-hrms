export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-';

// value for <input type="date">
export const inputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const todayInput = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const roleLabel = { hr: 'HR', manager: 'Manager', employee: 'Employee' };

export const trainingState = (t) => {
  const now = new Date();
  if (now < new Date(t.startDate)) return 'Upcoming';
  if (now > new Date(new Date(t.endDate).setHours(23, 59, 59, 999))) return 'Completed';
  return 'Ongoing';
};
