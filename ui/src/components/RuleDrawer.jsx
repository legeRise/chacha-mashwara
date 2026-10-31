import { useEffect } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  FileText,
  HelpCircle,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { GATE_META, copyText, cx, getGate, ruleChangeRequest, splitCast } from "../lib.js";
import { StatusPill } from "./ui.jsx";

function Field({ icon: Icon, label, children, wide = false }) {
  return (
    <div className={cx("detail-field", wide && "is-wide")}>
      <div className="detail-label">
        {Icon ? <Icon size={13} /> : null}
        {label}
      </div>
      <div className="detail-value">{children}</div>
    </div>
  );
}

export default function RuleDrawer({
  rule,
  status,
  note,
  onClose,
  onSetStatus,
  onNote,
  onBuildScript,
  showToast,
}) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.classList.add("drawer-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("drawer-open");
    };
  }, [onClose]);

  if (!rule) return null;
  const cast = splitCast(rule.cast);

  async function copyRequest() {
    await copyText(ruleChangeRequest(rule, note));
    showToast("Change request copied — paste it in chat");
  }

  return (
    <div className="drawer-layer">
      <button className="drawer-overlay" onClick={onClose} aria-label="Close detail" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`${rule.id} detail`}>
        <header className="drawer-head">
          <div className="drawer-id">
            <span className="mono">{rule.id}</span>
            <StatusPill status={status} compact />
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </header>

        <div className="drawer-body">
          <div className="drawer-rule">
            <div className="eyebrow">{rule.volume} · {rule.volume_english}</div>
            <h2>{rule.rule}</h2>
            <p className="drawer-consequence">{rule.consequence}</p>
          </div>

          <div className="drawer-chips">
            <span className="chip">{rule.family}</span>
            <span className="chip">{rule.tone}</span>
            <span className="chip chip-muted">{rule.chacha_location}</span>
          </div>

          <div className="gate-box">
            <div className="gate-box-head">
              <span className={`gate-pill ${GATE_META[getGate(rule)]?.className || "gate-ungated"}`}>
                {GATE_META[getGate(rule)]?.label || "Ungated"} · {rule.seed_score || 0}/10
              </span>
              <span className="gate-box-label">Seed gate</span>
            </div>
            {getGate(rule) !== "passed" ? (
              <p className="gate-warning">
                This seed has not passed the quality gate. The story writer can fix it,
                but do not produce the script without a review.
              </p>
            ) : null}
            <div className="gate-fields">
              <div>
                <span>Want</span>
                <p>{rule.want || "Not filled yet"}</p>
              </div>
              <div>
                <span>Object / motif</span>
                <p>{rule.object_motif || "Not filled yet"}</p>
              </div>
              <div>
                <span>Theme</span>
                <p>{rule.theme || "Not filled yet"}</p>
              </div>
              <div>
                <span>Verdict</span>
                <p>{rule.verdict || "Not filled yet"}</p>
              </div>
            </div>
            {rule.gate_flags ? (
              <div className="gate-flags">
                {rule.gate_flags.split(";").filter(Boolean).map((flag) => (
                  <span key={flag}>{flag}</span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="drawer-section">
            <div className="detail-label">
              <Sparkles size={13} /> Story core
            </div>
            <p className="story-core">{rule.story_core}</p>
          </div>

          <div className="detail-grid">
            <Field label="Cast">
              <div className="cast-list">
                {cast.map((role) => (
                  <span className="cast-chip" key={role}>{role}</span>
                ))}
              </div>
            </Field>
            <Field icon={MapPin} label="Place">{rule.place}</Field>
            <Field label="Breach reason">{rule.breach_reason}</Field>
            <Field label="Twist">{rule.twist}</Field>
            <Field label="Final image" wide>{rule.final_image}</Field>
            <Field label="Rule family">{rule.family}</Field>
            <Field label="Tone">{rule.tone}</Field>
          </div>

          <div className="drawer-section note-section">
            <label className="detail-label" htmlFor="rule-note">
              <FileText size={13} /> Reviewer note
            </label>
            <textarea
              id="rule-note"
              className="note-input"
              value={note}
              onChange={(event) => onNote(event.target.value)}
              placeholder="What should change? Title, twist, cast, or the whole story? This note is copied into the change request."
              rows={4}
            />
          </div>

          <button className="btn btn-small copy-request" onClick={copyRequest}>
            <Copy size={15} /> Copy change request
          </button>
        </div>

        <footer className="drawer-actions">
          <div className="drawer-actions-row">
            <button
              className={cx("btn btn-approve", status === "approved" && "is-selected")}
              onClick={() => onSetStatus("approved")}
            >
              <Check size={16} /> Approve
            </button>
            <button
              className={cx("btn btn-maybe", status === "maybe" && "is-selected")}
              onClick={() => onSetStatus("maybe")}
            >
              <HelpCircle size={16} /> Maybe
            </button>
            <button
              className={cx("btn btn-kill", status === "rejected" && "is-selected")}
              onClick={() => onSetStatus("rejected")}
            >
              <X size={16} /> Kill
            </button>
          </div>
          <div className="drawer-actions-row between">
            <button className="btn btn-ghost btn-small" onClick={onClose}>
              Back to catalog
            </button>
            <button className="btn btn-primary btn-small" onClick={() => onBuildScript(rule.id)}>
              Build script <ArrowRight size={15} />
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
