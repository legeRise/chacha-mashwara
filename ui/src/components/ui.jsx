import { STATUS_META, cx } from "../lib.js";

export function StatusPill({ status, compact = false }) {
  const meta = STATUS_META[status] || STATUS_META.candidate;
  return (
    <span className={cx("status-pill", meta.className, compact && "is-compact")}>
      <span className="status-dot" />
      {compact ? meta.short : meta.label}
    </span>
  );
}

export function ProgressBar({ value, max = 100, tone = "gold", className }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cx("progress", className)} aria-hidden="true">
      <div className={cx("progress-fill", `tone-${tone}`)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stat({ label, value, hint, tone = "cream" }) {
  return (
    <div className={cx("stat", `stat-${tone}`)}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      <span>{label}</span>
    </label>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="empty-state">
      <div className="empty-mark">✳</div>
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}

export function SectionLabel({ children, aside }) {
  return (
    <div className="section-label">
      <span>{children}</span>
      {aside ? <span className="section-aside">{aside}</span> : null}
    </div>
  );
}
