import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  FileText,
  RotateCcw,
  Search,
  Sparkles,
  Loader2,
  Wand2,
} from "lucide-react";
import {
  buildScript,
  copyText,
  cx,
  dialogueOnly,
  downloadFile,
  formatNumber,
  getGate,
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
  const [generating, setGenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [genError, setGenError] = useState("");
  const [genWaiting, setGenWaiting] = useState(false);
  const [genWarnings, setGenWarnings] = useState([]);
  const [genQuality, setGenQuality] = useState(null);
  const [gateChecking, setGateChecking] = useState(false);
  const [transliterating, setTransliterating] = useState(false);
  const qualityPollRef = useRef(null);
  const generatePollRef = useRef(null);

  const selectedRule = rules.find((rule) => rule.id === selectedId) || rules[0];
  const dialogue = dialogueOnly(script, selectedRule?.cast || "", selectedRule);
  const gate = selectedRule ? getGate(selectedRule) : "ungated";
  const canWrite = gate === "passed";

  useEffect(() => {
    if (!selectedRule) return;
    const base = SAMPLE_SCRIPTS[selectedRule.id] ?? buildScript(selectedRule);
    const draft = drafts[selectedRule.id];
    // Ignore auto-saved template drafts for rules that now have a finished sample.
    const isOldTemplate = draft?.includes("[Write the rule in Urdu");
    setScript(isOldTemplate ? base : draft ?? base);
    setSavedAt(null);
    setGeneratedAt(null);
    setGenError("");
    setGenWaiting(false);
    setGenWarnings([]);
    setGenQuality(null);
    setGateChecking(false);
    setGenerating(false);
    window.clearInterval(qualityPollRef.current);
    qualityPollRef.current = null;
    window.clearInterval(generatePollRef.current);
    generatePollRef.current = null;
  }, [selectedRule?.id]);

  useEffect(() => {
    return () => {
      window.clearInterval(qualityPollRef.current);
      window.clearInterval(generatePollRef.current);
    };
  }, []);

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
    showToast("Full document copied");
  }

  async function copyDialogue() {
    await copyText(dialogue);
    showToast(`Dialogue copied · ${dialogue.length} chars`);
  }

  async function copyForEzclip() {
    try {
      const response = await fetch("/api/ezclip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not build the Ezclip story.");
      await copyText(data.script);
      showToast("Ezclip story copied — paste it into Create");
    } catch (error) {
      showToast(error.message || "Could not build the Ezclip story");
    }
  }

  async function convertToDevanagari() {
    if (transliterating) return;
    setTransliterating(true);
    try {
      const response = await fetch("/api/transliterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not convert the script.");
      setScript(data.script);
      setDrafts((current) => ({ ...current, [selectedRule.id]: data.script }));
      showToast("Dialogue converted to Devanagari");
    } catch (error) {
      showToast(error.message || "Could not convert the script");
    } finally {
      setTransliterating(false);
    }
  }

  function downloadScript() {
    if (!selectedRule) return;
    downloadFile(
      `${selectedRule.id}-${selectedRule.rule.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`,
      script,
    );
    showToast("Script downloaded");
  }

  function watchQuality(ruleId) {
    window.clearInterval(qualityPollRef.current);
    setGateChecking(true);
    let tries = 0;
    qualityPollRef.current = window.setInterval(async () => {
      tries += 1;
      try {
        const response = await fetch(`/api/quality/${ruleId}`);
        const quality = await response.json();
        if (!quality.checking || tries >= 90) {
          window.clearInterval(qualityPollRef.current);
          qualityPollRef.current = null;
          setGateChecking(false);
          setGenQuality(
            quality.checking
              ? {
                  ...quality,
                  summary: quality.summary || "Gate check is still running. Refresh to see it.",
                }
              : quality,
          );
        }
      } catch {
        if (tries >= 90) {
          window.clearInterval(qualityPollRef.current);
          qualityPollRef.current = null;
          setGateChecking(false);
        }
      }
    }, 4000);
  }

  function stopGeneratePoll() {
    window.clearInterval(generatePollRef.current);
    generatePollRef.current = null;
  }

  function applyGenerated(ruleId, data) {
    setScript(data.script);
    setDrafts((current) => ({ ...current, [ruleId]: data.script }));
    setGeneratedAt(new Date());
    setGenWaiting(false);
    setGenWarnings(data.warnings || []);
    setGenQuality(data.quality || null);
    if (data.quality?.checking) {
      watchQuality(ruleId);
    } else {
      setGateChecking(false);
    }
  }

  async function loadSavedScript(ruleId) {
    try {
      const response = await fetch(`/api/script/${ruleId}`);
      const type = response.headers.get("content-type") || "";
      if (!type.includes("application/json")) {
        throw new Error("The saved script is not available.");
      }
      const data = await response.json();
      if (!response.ok || !data.script) {
        throw new Error(data.error || "No saved script yet.");
      }
      applyGenerated(ruleId, data);
      setGenerating(false);
      setGenError("");
      setGenWaiting(false);
      showToast(`Loaded the saved script for ${ruleId}`);
      return true;
    } catch (error) {
      showToast(error.message || "No saved script yet");
      return false;
    }
  }

  function startScriptPoll(ruleId) {
    stopGeneratePoll();
    setGenWaiting(true);
    let tries = 0;
    generatePollRef.current = window.setInterval(async () => {
      tries += 1;
      try {
        const response = await fetch(`/api/script/${ruleId}`);
        const type = response.headers.get("content-type") || "";
        if (response.ok && type.includes("application/json")) {
          const data = await response.json();
          if (data.script) {
            stopGeneratePoll();
            applyGenerated(ruleId, data);
            setGenerating(false);
            setGenWaiting(false);
            setGenError("");
            showToast(`Full script ready for ${ruleId}`);
            return;
          }
        }
      } catch {
        // The writer may still be running; keep checking.
      }
      if (tries >= 120) {
        stopGeneratePoll();
        setGenerating(false);
        setGenWaiting(false);
        setGenError(
          "The writer is still running. Open this rule again in a few minutes, or click Load saved script.",
        );
      }
    }, 5000);
  }

  async function generateFullScript() {
    if (!selectedRule || generating || gateChecking) return;
    const ruleId = selectedRule.id;
    const force = Boolean(SAMPLE_SCRIPTS[ruleId]);
    setGenerating(true);
    setGenError("");
    setGenWaiting(false);
    setGenWarnings([]);
    setGeneratedAt(null);
    stopGeneratePoll();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId, force }),
      });
      const type = response.headers.get("content-type") || "";
      if (!type.includes("application/json")) {
        // Cloudflare answers a request longer than ~100s with an HTML page.
        // The writer keeps running; the saved script is the real result.
        if (!force) {
          setGenError("The writer is still running. Waiting for the saved script…");
          startScriptPoll(ruleId);
          return;
        }
        throw new Error("The writer took too long to answer. Try again.");
      }
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.error || "Writer failed");
        error.fatal = true;
        throw error;
      }
      applyGenerated(ruleId, data);
      setGenerating(false);
      setGenWaiting(false);
      showToast(`Full script written for ${ruleId}`);
    } catch (error) {
      if (!force && !error.fatal) {
        setGenError("The writer is still running. Waiting for the saved script…");
        startScriptPoll(ruleId);
        return;
      }
      setGenError(error.message || "Writer failed");
      setGenerating(false);
      setGenWaiting(false);
      showToast("Writer failed — see the message");
    }
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
          <p>Pick a rule. The server writer uses DeepSeek V4.1 Flash and the flash-fiction + endings gate to write the full episode.</p>
        </div>
        {selectedRule ? (
          <div className="script-head-meta">
            <span className="mono">{selectedRule.id}</span>
            <StatusPill status={getStatus(selectedRule, reviews)} compact />
            <span className={
              getGate(selectedRule) === "passed"
                ? "gate-pill gate-passed"
                : getGate(selectedRule) === "needs-fix"
                  ? "gate-pill gate-needs-fix"
                  : "gate-pill gate-ungated"
            }>
              {getGate(selectedRule) === "passed" ? "Gate passed" : getGate(selectedRule) === "needs-fix" ? "Needs fix" : "Ungated"}
            </span>
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
                  <button
                    className="btn btn-small btn-primary"
                    onClick={generateFullScript}
                    disabled={generating || gateChecking || !canWrite}
                    title={canWrite ? "" : "This seed has not passed the seed gate."}
                  >
                    {generating ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                    {generating ? "Writing…" : SAMPLE_SCRIPTS[selectedRule.id] ? "Generate new draft" : "Write full script"}
                  </button>
                  <button className="btn btn-small btn-ghost" onClick={() => onOpenRule(selectedRule.id)}>
                    Open seed <ArrowRight size={14} />
                  </button>
                  <button className="btn btn-small btn-ghost" onClick={regenerate} disabled={generating}>
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
                Write dialogue in Hindi (Devanagari). Chacha appears only in the cold
                open and the return. No narrator inside the story.
              </div>
              <div className="writer-note">
                Writer: DeepSeek V4.1 Flash · flash-fiction + endings gate
              </div>

              {!canWrite ? (
                <div className="generation-error">
                  <strong>Seed gate: {gate}.</strong>{" "}
                  {selectedRule.gate_flags ||
                    "This seed is missing a want, object, theme or verdict."}{" "}
                  Fix the seed before writing.
                </div>
              ) : null}

              {generating ? (
                <div className="generation-banner">
                  <Loader2 size={16} className="spin" />
                  <div>
                    <strong>Writing the full script…</strong>
                    <span>Cold open → breach → twist → verdict. About 2–5 minutes.</span>
                  </div>
                </div>
              ) : null}

              {genError ? (
                <div className="generation-error">
                  <strong>{genWaiting ? "Writer still running." : "Writer failed."}</strong>{" "}
                  {genError}
                  <button
                    className="btn btn-small"
                    style={{ marginTop: 8 }}
                    onClick={() => loadSavedScript(selectedRule.id)}
                  >
                    <RotateCcw size={14} /> Load saved script
                  </button>
                </div>
              ) : null}

              {generatedAt ? (
                <div className="generated-badge">
                  <Sparkles size={13} /> AI draft · review before production
                </div>
              ) : null}

              {genWarnings.length ? (
                <div className="generation-error">
                  <strong>Writer check:</strong> {genWarnings.join(", ")}. Fix before
                  production.
                </div>
              ) : null}

              {genQuality ? (
                <div
                  className={
                    genQuality.pass === true
                      ? "generation-banner quality-panel"
                      : genQuality.pass === false
                        ? "generation-error quality-panel"
                        : "generation-error quality-panel quality-panel-unknown"
                  }
                >
                  <div>
                    <strong>
                      Story gate:{" "}
                      {genQuality.pass === true
                        ? "passed"
                        : genQuality.pass === false
                          ? "failed"
                          : "not verified"}
                    </strong>
                    <span>{genQuality.summary || "The critic returned no summary."}</span>
                    {Array.isArray(genQuality.issues) && genQuality.issues.length ? (
                      <ul className="quality-issues">
                        {genQuality.issues.map((issue, index) => (
                          <li key={`${issue.code || "issue"}-${index}`}>
                            <b>{issue.code || "issue"}</b>
                            {issue.severity ? ` · ${issue.severity}` : ""}
                            {issue.evidence ? ` — ${issue.evidence}` : ""}
                            {issue.fix ? <em> Fix: {issue.fix}</em> : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ) : null}

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
                  <span className="script-count">{dialogue.length} dialogue chars</span>
                </span>
                <div className="script-footer-actions">
                  <button className="btn btn-small" onClick={saveNow}>
                    <FileText size={14} /> Save draft
                  </button>
                  <button
                    className="btn btn-small"
                    onClick={convertToDevanagari}
                    disabled={transliterating}
                  >
                    {transliterating ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />}
                    {transliterating ? "Converting…" : "Hindi script"}
                  </button>
                  <button className="btn btn-small" onClick={copyDialogue}>
                    <Copy size={14} /> Copy dialogue
                  </button>
                  <button className="btn btn-small btn-primary" onClick={copyForEzclip}>
                    <Copy size={14} /> Copy for Ezclip
                  </button>
                  <button className="btn btn-small" onClick={copyScript}>
                    <Copy size={14} /> Copy full
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
