'use client';

export const INK = '#2a2723';

// Hand-drawn loop around a word.
export const Circled = () => (
  <svg className="circled" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
    <path d="M60 4 C 90 3, 99 14, 96 24 C 92 36, 40 39, 14 34 C -2 30, 0 12, 18 7 C 34 2, 55 2, 74 6" fill="none" stroke={INK} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
  </svg>
);

export const Slide = ({ label, min, max, step, value, onChange, show }) => (
  <label className="slide">
    <span className="sl-l">{label}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    <span className="sl-v">{show(value)}</span>
  </label>
);

export const Pick = ({ label, opts, value, onChange }) => (
  <div className="pick">
    <span className="sl-l">{label}</span>
    {opts.map((o, i) => (
      <button key={o} className={i === value ? 'on' : ''} onClick={() => onChange(i)}>
        {o}{i === value && <Circled />}
      </button>
    ))}
  </div>
);

export const Readout = ({ children }) => <div className="readout">{children}</div>;
