import {
  ArrowRight,
  BookOpen,
  Download,
  RotateCcw,
  Zap,
} from "lucide-react";
import {
  downloadFile,
  exportReviews,
  formatNumber,
  getStatus,
} from "../lib.js";
import { ProgressBar, StatusPill } from "./ui.jsx";

export default function Dashboard({
  rules,
  reviews,
  notes,
  counts,
  volumeStats,
  navigate,
  onOpenVolume,
  onOpenRule,
  onReset,
  lastReviewedId,
  showToast,
}) {
  const total = rules.length;
  const reviewed = counts.approved + counts.maybe + counts.rejected;
  const lastRule = lastReviewedId
    ? rules.find((rule) => rule.id === lastReviewedId)
    : null;

  function exportData(format) {
    const text = exportReviews(rules, reviews, notes, format);
    downloadFile(
      format === "csv" ? "chacha-review.csv" : "chacha-review.json",
      text,
      format === "csv" ? "text/csv" : "application/json",
    );
    showToast(`Exported ${format.toUpperCase()} review data`);
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Rulebook</div>
          <h1>Overview</h1>
          <p>
            {formatNumber(total)} rules across 10 volumes.{" "}
            {formatNumber(reviewed)} reviewed, {formatNumber(counts.candidate)} left.
          </p>
        </div>
        <div className="head-actions">
          <button className="btn btn-primary" onClick={() => navigate("review")}>
            <Zap size={15} /> Review rules
          </button>
          <button className="btn" onClick={() => navigate("browse")}>
            <BookOpen size={15} /> Browse
          </button>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">Total rules</div>
          <div className="stat-value">{formatNumber(total)}</div>
          <div className="stat-hint">10 volumes · 100 each</div>
        </div>
        <div className="stat">
          <div className="stat-label">Approved</div>
          <div className="stat-value stat-green">{formatNumber(counts.approved)}</div>
          <div className="stat-hint">{formatNumber(counts.maybe)} marked maybe</div>
        </div>
        <div className="stat">
          <div className="stat-label">To review</div>
          <div className="stat-value stat-gold">{formatNumber(counts.candidate)}</div>
          <div className="stat-hint">{formatNumber(reviewed)} reviewed</div>
        </div>
        <div className="stat">
          <div className="stat-label">Killed</div>
          <div className="stat-value stat-red">{formatNumber(counts.rejected)}</div>
          <div className="stat-hint">Kept in the ledger</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Volumes</h2>
            <span>{formatNumber(volumeStats.length)} volumes</span>
          </div>
          <div className="volume-list">
            {volumeStats.map((volume) => (
              <button
                key={volume.no}
                className="volume-row"
                onClick={() => onOpenVolume(volume.name)}
              >
                <span className="volume-no">{String(volume.no).padStart(2, "0")}</span>
                <span className="volume-main">
                  <strong>{volume.name}</strong>
                  <span>
                    {volume.english} · {volume.theme}
                  </span>
                </span>
                <span className="volume-progress">
                  <ProgressBar value={volume.reviewed} max={volume.total} tone="green" />
                  <small>
                    {volume.reviewed}/{volume.total} reviewed
                  </small>
                </span>
                <span className="volume-approved">
                  {volume.approved > 0 ? `${volume.approved} approved` : "—"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="stack">
          <section className="panel compact-panel">
            <div className="panel-head">
              <h2>Continue</h2>
            </div>
            {lastRule ? (
              <>
                <div className="compact-meta">{lastRule.id}</div>
                <div className="compact-title">{lastRule.rule}</div>
                <p className="compact-text">{lastRule.consequence}</p>
                <div className="compact-actions">
                  <StatusPill status={getStatus(lastRule, reviews)} compact />
                  <button className="btn btn-small" onClick={() => onOpenRule(lastRule.id)}>
                    Open <ArrowRight size={13} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="compact-meta">R-0001</div>
                <div className="compact-title">Never answer the door after midnight</div>
                <p className="compact-text">Start with the cleanest promise in the book.</p>
                <button className="btn btn-small" onClick={() => onOpenRule("R-0001")}>
                  Open <ArrowRight size={13} />
                </button>
              </>
            )}
          </section>

          <section className="panel compact-panel">
            <div className="panel-head">
              <h2>Review data</h2>
            </div>
            <p className="compact-text">
              Approvals and notes stay in this browser until exported.
            </p>
            <div className="compact-actions">
              <button className="btn btn-small" onClick={() => exportData("json")}>
                <Download size={13} /> JSON
              </button>
              <button className="btn btn-small" onClick={() => exportData("csv")}>
                <Download size={13} /> CSV
              </button>
              <button className="btn btn-small btn-ghost" onClick={onReset}>
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </section>

          <section className="panel compact-panel">
            <div className="panel-head">
              <h2>Catalog health</h2>
            </div>
            <div className="health-row">
              <span>Complete seeds</span>
              <strong>{formatNumber(total)}</strong>
            </div>
            <div className="health-row">
              <span>Duplicate twists</span>
              <strong className="good">0</strong>
            </div>
            <div className="health-row">
              <span>Empty fields</span>
              <strong className="good">0</strong>
            </div>
            <div className="health-row">
              <span>Source</span>
              <strong className="mono">rules.csv</strong>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
