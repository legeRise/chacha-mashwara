import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  HelpCircle,
  Shuffle,
  Undo2,
  X,
} from "lucide-react";
import {
  GATE_META,
  STATUS_META,
  VOLUME_META,
  cx,
  getGate,
  formatNumber,
  getStatus,
  reviewCounts,
  splitCast,
} from "../lib.js";
import { EmptyState, ProgressBar, StatusPill, Toggle } from "./ui.jsx";

export default function ReviewDeck({
  rules,
  reviews,
  setReview,
  clearReview,
  onOpenRule,
  showToast,
}) {
  const [volume, setVolume] = useState("all");
  const [unratedOnly, setUnratedOnly] = useState(true);
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [sessionReviewed, setSessionReviewed] = useState(0);

  const volumeRules = useMemo(() => {
    return rules.filter((rule) => volume === "all" || rule.volume === volume);
  }, [rules, volume]);

  const queue = useMemo(() => {
    return volumeRules.filter((rule) => !unratedOnly || !reviews[rule.id]);
  }, [volumeRules, unratedOnly, reviews]);

  useEffect(() => {
    setIndex(0);
  }, [volume, unratedOnly]);

  const current = queue[index];
  const counts = useMemo(() => reviewCounts(volumeRules, reviews), [volumeRules, reviews]);
  const reviewed = counts.approved + counts.maybe + counts.rejected;

  function act(status) {
    if (!current) return;
    const previous = reviews[current.id];
    setReview(current.id, status);
    setHistory((items) => [...items, { id: current.id, previous }]);
    setSessionReviewed((value) => value + 1);
    if (!unratedOnly) {
      setIndex((value) => value + 1);
    }
  }

  function skip() {
    if (!queue.length) return;
    if (index >= queue.length - 1) {
      setIndex(0);
      showToast("Back to the top of the queue");
    } else {
      setIndex((value) => value + 1);
    }
  }

  function undo() {
    const last = history[history.length - 1];
    if (!last) {
      showToast("Nothing to undo");
      return;
    }
    if (last.previous) {
      setReview(last.id, last.previous.status, last.previous.note);
    } else {
      clearReview(last.id);
    }
    setHistory((items) => items.slice(0, -1));
    setSessionReviewed((value) => Math.max(0, value - 1));
    const nextIndex = queue.findIndex((rule) => rule.id === last.id);
    setIndex(nextIndex >= 0 ? nextIndex : 0);
    showToast("Last review undone");
  }

  function shuffle() {
    if (!queue.length) return;
    const next = Math.floor(Math.random() * queue.length);
    setIndex(next);
    showToast("Random unrated rule");
  }

  useEffect(() => {
    function onKey(event) {
      const tag = event.target?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tag)) return;
      if (!current) return;
      const key = event.key.toLowerCase();
      if (key === "a") {
        event.preventDefault();
        act("approved");
      } else if (key === "m") {
        event.preventDefault();
        act("maybe");
      } else if (key === "r") {
        event.preventDefault();
        act("rejected");
      } else if (key === "s") {
        event.preventDefault();
        skip();
      } else if (key === "u") {
        event.preventDefault();
        undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, index, queue.length, unratedOnly, reviews, history]);

  if (!queue.length || !current) {
    return (
      <div className="page review-page">
        <header className="page-head">
          <div>
            <div className="eyebrow">Review mode</div>
            <h1>The queue is clear.</h1>
          </div>
        </header>
        <div className="panel review-done">
          <div className="review-done-mark">✓</div>
          <h2>{volume === "all" ? "Every rule has been reviewed." : `${volume} is reviewed.`}</h2>
          <p>
            {formatNumber(counts.approved)} approved · {formatNumber(counts.maybe)} maybe ·{" "}
            {formatNumber(counts.rejected)} killed.
          </p>
          <div className="review-done-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                setVolume("all");
                setUnratedOnly(true);
              }}
            >
              Review all volumes
            </button>
            <button className="btn" onClick={() => setUnratedOnly(false)}>
              Show reviewed rules
            </button>
            {queue.length ? (
              <button className="btn btn-ghost" onClick={() => setIndex(0)}>
                Back to start
              </button>
            ) : null}
            {history.length ? (
              <button className="btn btn-ghost" onClick={undo}>
                <Undo2 size={14} /> Undo last
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page review-page">
      <header className="page-head review-head">
        <div>
          <div className="eyebrow">Review</div>
          <h1>Review rules</h1>
          <p>Approve, flag, or kill. Keyboard: A approve, M maybe, R kill, S skip, U undo.</p>
        </div>
        <div className="review-controls">
          <label className="select-wrap">
            <select
              value={volume}
              onChange={(event) => setVolume(event.target.value)}
              aria-label="Volume"
            >
              <option value="all">All volumes</option>
              {VOLUME_META.map((item) => (
                <option key={item.name} value={item.name}>
                  {String(item.no).padStart(2, "0")} · {item.name}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </label>
          <Toggle
            checked={unratedOnly}
            onChange={setUnratedOnly}
            label="Unrated only"
          />
        </div>
      </header>

      <div className="review-progress panel">
        <div className="review-progress-head">
          <span>
            {volume === "all" ? "All volumes" : volume} · {reviewed} of {volumeRules.length} reviewed
          </span>
          <span className="review-session">{sessionReviewed} this session</span>
        </div>
        <ProgressBar value={reviewed} max={volumeRules.length} tone="green" />
      </div>

      <article className="review-card">
        <header className="review-card-head">
          <div className="review-card-id">
            <span className="mono">{current.id}</span>
            <StatusPill status={getStatus(current, reviews)} compact />
            <span className={`gate-pill ${GATE_META[getGate(current)]?.className || "gate-ungated"}`}>
              {GATE_META[getGate(current)]?.label || "Ungated"} {current.seed_score || 0}
            </span>
          </div>
          <div className="review-card-meta">
            <span>{current.volume}</span>
            <span>{current.family}</span>
          </div>
        </header>

        <div className="review-card-main">
          {getGate(current) !== "passed" ? (
            <div className="gate-warning">
              <strong>Seed gate: {GATE_META[getGate(current)]?.label || "Ungated"}.</strong>{" "}
              This idea has not passed the quality gate yet. Do not write the full script
              from the seed as-is.
            </div>
          ) : null}
          <div className="eyebrow">{current.volume_english} · rule {current.id.replace("R-", "")}</div>
          <h2>{current.rule}</h2>
          <p className="review-consequence">{current.consequence}</p>
          <p className="review-story">{current.story_core}</p>

          <div className="review-detail-grid">
            <div>
              <span className="detail-label">Cast</span>
              <div className="cast-list">
                {splitCast(current.cast).map((role) => (
                  <span className="cast-chip" key={role}>{role}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="detail-label">Place</span>
              <p>{current.place}</p>
            </div>
            <div>
              <span className="detail-label">Breach reason</span>
              <p>{current.breach_reason}</p>
            </div>
            <div>
              <span className="detail-label">Twist</span>
              <p>{current.twist}</p>
            </div>
            <div className="is-wide">
              <span className="detail-label">Final image</span>
              <p>{current.final_image}</p>
            </div>
            <div>
              <span className="detail-label">Chacha's location</span>
              <p>{current.chacha_location}</p>
            </div>
            <div>
              <span className="detail-label">Tone</span>
              <p>{current.tone}</p>
            </div>
          </div>
        </div>

        <footer className="review-actions">
          <div className="review-actions-main">
            <button className="btn btn-approve btn-large" onClick={() => act("approved")}>
              <Check size={18} /> Approve <kbd>A</kbd>
            </button>
            <button className="btn btn-maybe btn-large" onClick={() => act("maybe")}>
              <HelpCircle size={18} /> Maybe <kbd>M</kbd>
            </button>
            <button className="btn btn-kill btn-large" onClick={() => act("rejected")}>
              <X size={18} /> Kill <kbd>R</kbd>
            </button>
          </div>
          <div className="review-actions-side">
            <button className="btn btn-small" onClick={() => onOpenRule(current.id)}>
              Full seed
            </button>
            <button className="btn btn-small btn-ghost" onClick={skip}>
              Skip <kbd>S</kbd>
            </button>
            <button
              className="btn btn-small btn-ghost"
              onClick={undo}
              disabled={!history.length}
            >
              <Undo2 size={14} /> Undo <kbd>U</kbd>
            </button>
            <button className="btn btn-small btn-ghost" onClick={shuffle}>
              <Shuffle size={14} />
            </button>
          </div>
        </footer>
      </article>

      <div className="review-nav">
        <button
          className="btn btn-small btn-ghost"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={index === 0}
        >
          <ArrowLeft size={15} /> Previous
        </button>
        <span className="mono">
          {index + 1} / {queue.length}
        </span>
        <button
          className="btn btn-small btn-ghost"
          onClick={() => setIndex((value) => Math.min(queue.length - 1, value + 1))}
          disabled={index >= queue.length - 1}
        >
          Next <ArrowRight size={15} />
        </button>
      </div>

      <div className="key-hint">
        <span><kbd>A</kbd> approve</span>
        <span><kbd>M</kbd> maybe</span>
        <span><kbd>R</kbd> kill</span>
        <span><kbd>S</kbd> skip</span>
        <span><kbd>U</kbd> undo</span>
      </div>
    </div>
  );
}
