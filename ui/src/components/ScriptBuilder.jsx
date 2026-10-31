import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  FileText,
  RotateCcw,
  Search,
  Wand2,
} from "lucide-react";
import {
  buildScript,
  copyText,
  cx,
  downloadFile,
  formatNumber,
  getStatus,
  splitCast,
} from "../lib.js";
import { StatusPill } from "./ui.jsx";
import { SAMPLE_SCRIPTS } from "../sampleScript.js";

export default function ScriptBuilder({
  rules,
  reviews,
  selectedId,
  setSelectedId,
  drafts,
  setDrafts,
  onOpenRule,
  showToast,
}) {
  const [search, setSearch] = useState("");
  const [script, setScript] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  const selectedRule = rules.find((rule) => rule.id === selectedId) || rules[0];

  useEffect(() => {
    if (!selectedRule) return;
    const base = SAMPLE_SCRIPTS[selectedRule.id] ?? buildScript(selectedRule);
    setScript(drafts[selectedRule.id] ?? base);
    setSavedAt(null);
  }, [selectedRule?.id]);

  useEffect(() => {
    if (!selectedRule) return;
    const timer = window.setTimeout(() => {
      setDrafts((current) => ({ ...current, [selectedRule.id]: script }));
      setSavedAt(new Date());
    }, 600);
    return () => window.clearTimeout(timer);
  }, [script, selectedRule?.id]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rules.slice(0, 80);
    return rules
      .filter((rule) =>
        `${rule.id} ${rule.rule} ${rule.cast} ${rule.volume}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 80);
  }, [rules, search]);

  function regenerate() {
    if (!selectedRule) return;
    const base = SAMPLE_SCRIPTS[selectedRule.id] ?? buildScript(selectedRule);
    setScript(base);
    setDrafts((current) => {
      const next = { ...current };
      delete next[selectedRule.id];
      return next;
    });
    showToast(SAMPLE_SCRIPTS[selectedRule.id] ? "Finished sample restored" : "Template regenerated");
  }

  async function copyScript() {
    await copyText(script);
    showToast("Script copied");
  }

  function downloadScript() {
    if (!selectedRule) return;
    downloadFile(
      `${selectedRule.id}-${selectedRule.rule.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`,
      script,
    );
    showToast("Script downloaded");
  }

  function saveNow() {
    if (!selectedRule) return;
    setDrafts((current) => ({ ...current, [selectedRule.id]: script }));
    setSavedAt(new Date());
    showToast("Draft saved in this browser");
  }

  return (
    <div className="page script-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Production</div>
          <h1>Script builder</h1>
          <p>Pick a rule. The template gives you the cold open, story beats, cast, and verdict.</p>
        </div>
        {selectedRule ? (
          <div className="script-head-meta">
            <span className="mono">{selectedRule.id}</span>
            <StatusPill status={getStatus(selectedRule, reviews)} compact />
          </div>
        ) : null}
      </header>

      <div className="script-layout">
        <aside className="panel script-picker">
          <div className="script-picker-head">
            <span className="section-label">Choose a rule</span>
            <span className="mono">{formatNumber(filtered.length)} shown</span>
          </div>
          <label className="search-box search-box-small">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rules…"
            />
          </label>
          <div className="script-list">
            {filtered.map((rule) => (
              <button
                key={rule.id}
                className={cx("script-list-item", selectedRule?.id === rule.id && "is-active")}
                onClick={() => setSelectedId(rule.id)}
              >
                <span className="mono">{rule.id}</span>
                <strong>{rule.rule}</strong>
                <span className="script-list-meta">
                  {rule.volume} · {rule.family}
                  {SAMPLE_SCRIPTS[rule.id] ? <em className="sample-tag">sample</em> : null}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel script-editor">
          {selectedRule ? (
            <>
              <div className="script-editor-head">
                <div>
                  <div className="eyebrow">{selectedRule.volume} · {selectedRule.id}</div>
                  <h2>{selectedRule.rule}</h2>
                  <p>{selectedRule.consequence}</p>
                  {SAMPLE_SCRIPTS[selectedRule.id] ? (
                    <span className="script-sample-badge">First story · fully written</span>
                  ) : null}
                </div>
                <div className="script-editor-actions">
                  <button className="btn btn-small btn-ghost" onClick={() => onOpenRule(selectedRule.id)}>
                    Open seed <ArrowRight size={14} />
                  </button>
                  <button className="btn btn-small btn-ghost" onClick={regenerate}>
                    <RotateCcw size={14} /> {SAMPLE_SCRIPTS[selectedRule.id] ? "Reset sample" : "Reset template"}
                  </button>
                </div>
              </div>

              <div className="script-meta-strip">
                <span><b>Cast</b> {splitCast(selectedRule.cast).join(" · ")}</span>
                <span><b>Location</b> {selectedRule.chacha_location}</span>
                <span><b>Tone</b> {selectedRule.tone}</span>
              </div>

              <div className="script-tip">
                <Wand2 size={15} />
                Write dialogue in Urdu. Chacha appears only in the cold open and the
                return. No narrator inside the story.
              </div>

              <textarea
                className="script-textarea"
                value={script}
                onChange={(event) => setScript(event.target.value)}
                spellCheck={false}
                aria-label="Episode script"
              />

              <div className="script-footer">
                <span className="script-autosave">
                  {savedAt ? (
                    <>
                      <Check size={13} /> Saved locally
                    </>
                  ) : (
                    "Auto-saves in this browser"
                  )}
                </span>
                <div className="script-footer-actions">
                  <button className="btn btn-small" onClick={saveNow}>
                    <FileText size={14} /> Save draft
                  </button>
                  <button className="btn btn-small" onClick={copyScript}>
                    <Copy size={14} /> Copy
                  </button>
                  <button className="btn btn-small" onClick={downloadScript}>
                    <Download size={14} /> Download .md
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>Pick a rule to start.</h3>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
