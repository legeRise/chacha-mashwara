import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Browse from "./components/Browse.jsx";
import ReviewDeck from "./components/ReviewDeck.jsx";
import ScriptBuilder from "./components/ScriptBuilder.jsx";
import LaunchPlan from "./components/LaunchPlan.jsx";
import RuleDrawer from "./components/RuleDrawer.jsx";
import Guide from "./components/Guide.jsx";
import {
  STATUS_META,
  familyCounts,
  getStatus,
  reviewCounts,
  volumeCounts,
} from "./lib.js";
import { useLocalStorage } from "./useLocalStorage.js";

const ROUTES = new Set(["dashboard", "browse", "review", "script", "launch", "guide"]);

function currentRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return ROUTES.has(hash) ? hash : "dashboard";
}

export default function App() {
  const [route, setRoute] = useState(currentRoute);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [browsePreset, setBrowsePreset] = useState(null);
  const [scriptRuleId, setScriptRuleId] = useState("R-0001");
  const [reviews, setReviews] = useLocalStorage("cm.reviews.v1", {});
  const [notes, setNotes] = useLocalStorage("cm.notes.v1", {});
  const [drafts, setDrafts] = useLocalStorage("cm.scripts.v1", {});
  const [lastReviewedId, setLastReviewedId] = useLocalStorage("cm.lastReviewed", null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}rules.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setRules(data);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onHash() {
      setRoute(currentRoute());
      setSelectedId(null);
      window.scrollTo({ top: 0 });
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const counts = useMemo(() => reviewCounts(rules, reviews), [rules, reviews]);
  const volumeStats = useMemo(() => volumeCounts(rules, reviews), [rules, reviews]);
  const familyStats = useMemo(() => familyCounts(rules), [rules]);
  const selectedRule = rules.find((rule) => rule.id === selectedId) || null;
  const selectedStatus = selectedRule ? getStatus(selectedRule, reviews) : "candidate";
  const selectedNote = selectedRule ? notes[selectedRule.id] || "" : "";

  function showToast(message) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  function navigate(next, options = {}) {
    if (!ROUTES.has(next)) return;
    if (!options.keepBrowsePreset) setBrowsePreset(null);
    setSelectedId(null);
    if (window.location.hash !== `#/${next}`) {
      window.location.hash = `#/${next}`;
    } else {
      setRoute(next);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openVolume(volume) {
    setBrowsePreset({ volume });
    navigate("browse", { keepBrowsePreset: true });
  }

  function openRule(id) {
    setSelectedId(id);
  }

  function openScript(id) {
    setScriptRuleId(id);
    setSelectedId(null);
    navigate("script");
  }

  function setReview(id, status) {
    setReviews((current) => ({
      ...current,
      [id]: { status, updatedAt: new Date().toISOString() },
    }));
    setLastReviewedId(id);
    showToast(`${STATUS_META[status]?.label || status} · ${id}`);
  }

  function clearReview(id) {
    setReviews((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    showToast(`Cleared review · ${id}`);
  }

  function setNote(id, note) {
    setNotes((current) => {
      const next = { ...current };
      if (note.trim()) next[id] = note;
      else delete next[id];
      return next;
    });
  }

  function handleStatus(status) {
    if (!selectedRule) return;
    if (getStatus(selectedRule, reviews) === status) {
      clearReview(selectedRule.id);
      return;
    }
    setReview(selectedRule.id, status);
  }

  function resetReviews() {
    const ok = window.confirm(
      "Reset all local reviews and notes? The catalog itself is untouched.",
    );
    if (!ok) return;
    setReviews({});
    setNotes({});
    setLastReviewedId(null);
    showToast("Local review data cleared");
  }

  if (loading) {
    return (
      <div className="boot-screen">
        <div className="boot-mark">CM</div>
        <div className="eyebrow">Chacha Mashwara</div>
        <h1>Opening the rulebook…</h1>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="boot-screen">
        <div className="boot-mark">!</div>
        <div className="eyebrow">Catalog error</div>
        <h1>Could not load the rules.</h1>
        <p>{loadError}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        route={route}
        navigate={navigate}
        counts={counts}
        total={rules.length}
      />

      <main className="main">
        <div className="route-view" key={route}>
          {route === "dashboard" ? (
            <Dashboard
              rules={rules}
              reviews={reviews}
              notes={notes}
              counts={counts}
              volumeStats={volumeStats}
              familyStats={familyStats}
              navigate={navigate}
              onOpenVolume={openVolume}
              onOpenRule={openRule}
              onOpenScript={openScript}
              onReset={resetReviews}
              lastReviewedId={lastReviewedId}
              showToast={showToast}
            />
          ) : null}

          {route === "browse" ? (
            <Browse
              rules={rules}
              reviews={reviews}
              onOpenRule={openRule}
              initialVolume={browsePreset?.volume}
              onClearPreset={() => setBrowsePreset(null)}
            />
          ) : null}

          {route === "review" ? (
            <ReviewDeck
              rules={rules}
              reviews={reviews}
              setReview={setReview}
              clearReview={clearReview}
              onOpenRule={openRule}
              showToast={showToast}
            />
          ) : null}

          {route === "script" ? (
            <ScriptBuilder
              rules={rules}
              reviews={reviews}
              selectedId={scriptRuleId}
              setSelectedId={setScriptRuleId}
              drafts={drafts}
              setDrafts={setDrafts}
              onOpenRule={openRule}
              showToast={showToast}
            />
          ) : null}

          {route === "launch" ? (
            <LaunchPlan
              rules={rules}
              reviews={reviews}
              onOpenRule={openRule}
              showToast={showToast}
            />
          ) : null}

          {route === "guide" ? <Guide /> : null}
        </div>
      </main>

      {selectedRule ? (
        <RuleDrawer
          rule={selectedRule}
          status={selectedStatus}
          note={selectedNote}
          onClose={() => setSelectedId(null)}
          onSetStatus={handleStatus}
          onNote={(value) => setNote(selectedRule.id, value)}
          onBuildScript={openScript}
          showToast={showToast}
        />
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
