export default function Alert({ type = 'danger', message, onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type} alert-dismissible py-2`} role="alert">
      {message}
      {onClose && <button type="button" className="btn-close py-2" onClick={onClose} aria-label="Close" />}
    </div>
  );
}
