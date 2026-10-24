const colors = {
  Pending: 'warning text-dark',
  Approved: 'success',
  Rejected: 'danger',
  Present: 'success',
  'Half Day': 'warning text-dark',
  Upcoming: 'info text-dark',
  Ongoing: 'primary',
  Completed: 'secondary',
  Active: 'success',
  Inactive: 'secondary',
  hr: 'danger',
  manager: 'primary',
  employee: 'secondary',
};

export default function StatusBadge({ value, label }) {
  return <span className={`badge bg-${colors[value] || 'secondary'}`}>{label || value}</span>;
}
