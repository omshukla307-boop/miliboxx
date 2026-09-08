import { useState } from 'react';

/**
 * Toggle — accessible on/off switch.
 * Uses inline styles via CSS vars so it responds to dark/light theme.
 */
export default function Toggle({ checked: initialChecked = false, onChange }) {
  const [on, setOn] = useState(initialChecked);

  const toggle = () => {
    const next = !on;
    setOn(next);
    onChange?.(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className="toggle-track"
      style={{
        backgroundColor: on ? 'var(--accent-blue)' : 'var(--bg-border)',
        borderColor: on ? 'var(--accent-blue-dim)' : 'var(--bg-border)',
      }}
    >
      <span
        className="toggle-thumb"
        style={{ transform: on ? 'translateX(1rem)' : 'translateX(0)' }}
      />
    </button>
  );
}
