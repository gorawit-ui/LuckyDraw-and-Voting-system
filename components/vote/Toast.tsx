export default function Toast({ msg }: { msg: string }) {
  return <div className={`toast-pop ${msg ? 'show' : ''}`} role="status" aria-live="polite">{msg}</div>;
}
