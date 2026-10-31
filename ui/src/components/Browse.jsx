import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FilterX,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  GATE_META,
  STATUS_META,
  STATUS_ORDER,
  VOLUME_META,
  cx,
  getGate,
  formatNumber,
  getStatus,
  reviewCounts,
  splitCast,
} from "../lib.js";
import { EmptyState, StatusPill } from "./ui.jsx";

const PAGE_SIZE = 40;

const SORTS = [
  { id: "id", label: "Catalog order" },
  { id: "rule", label: "Title A–Z" },
  { id: "volume", label: "Volume" },
];

export default function Browse({
  rules,
  reviews,
  onOpenRule,
  initialVolume,
  onClearPreset,
}) {
  const [search, setSearch] = useState("");
  const [volume, setVolume] = useState(initialVolume || "all");
  const [family, setFamily] = useState("all");
  const [tone, setTone] = useState("all");
  const [status, setStatus] = useState("all");
  const [gate, setGate] = useState("all");
  const [sort, setSort] = useState("id");
  const [page, setPage] = useState(0);

  const counts = useMemo(() => reviewCounts(rules, reviews), [rules, reviews]);
  const families = useMemo(
    () => [...new Set(rules.map((rule) => rule.family))].sort(),
    [rules],
  );
  const tones = useMemo(
    () => [...new Set(rules.map((rule) => rule.tone))].sort(),
    [rules],
  );

  useEffect(() => {
    if (initialVolume) setVolume(initialVolume);
  }, [initialVolume]);

  useEffect(() => {
    setPage(0);
  }, [search, volume, family, tone, status, gate, sort]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    const result = rules.filter((rule) => {
      if (volume !== "all" && rule.volume !== volume) return false;
      if (family !== "all" && rule.family !== family) return false;
      if (tone !== "all" && rule.tone !== tone) return false;
      if (status !== "all" && getStatus(rule, reviews) !== status) return false;
      if (gate !== "all" && getGate(rule) !== gate) return false;
      if (tokens.length) {
        const blob = [
          rule.id,
          rule.rule,
          rule.consequence,
          rule.story_core,
          rule.cast,
          rule.place,
          rule.breach_reason,
          rule.twist,
          rule.final_image,
          rule.chacha_location,
        ]
          .join(" ")
          .toLowerCase();
        if (!tokens.every((token) => blob.includes(token))) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sort === "rule") return a.rule.localeCompare(b.rule);
      if (sort === "volume") {
        return (
          Number(a.volume_no) - Number(b.volume_no) ||
          a.rule.localeCompare(b.rule)
        );
      }
      return a.id.localeCompare(b.id);
    });
    return result;
  }, [rules, reviews, search, volume, family, tone, status, gate, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const activeFilters =
    volume !== "all" || family !== "all" || tone !== "all" || status !== "all" || gate !== "all" || search;

  function clearFilters() {
    setSearch("");
    setVolume("all");
    setFamily("all");
    setTone("all");
    setStatus("all");
    setGate("all");
    setSort("id");
    onClearPreset?.();
  }

  const tabs = [
    { id: "all", label: "All", count: rules.length },
    ...STATUS_ORDER.map((id) => ({
      id,
      label: STATUS_META[id].label,
      count: counts[id],
    })),
  ];

  return (
    <div className="page browse-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Catalog</div>
          <h1>Rules</h1>
          <p>Search, filter, and review the 1,000 rules. Click a row to open the full seed.</p>
        </div>
        <div className="page-head-meta">
          <span>{formatNumber(filtered.length)} shown</span>
          <span>{formatNumber(rules.length)} total</span>
        </div>
      </header>

      <div className="status-tabs" role="tablist" aria-label="Status filter">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={status === tab.id}
            className={cx("status-tab", status === tab.id && "is-active")}
            onClick={() => setStatus(tab.id)}
          >
            {tab.id !== "all" ? (
              <i className={cx("tab-dot", STATUS_META[tab.id].className)} />
            ) : null}
            <span>{tab.label}</span>
            <b>{formatNumber(tab.count)}</b>
          </button>
        ))}
      </div>

      <div className="toolbar panel">
        <label className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search a rule, a twist, a cast, a place…"
          />
          {search ? (
            <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              ×
            </button>
          ) : null}
        </label>

        <div className="toolbar-filters">
          <label className="select-wrap">
            <SlidersHorizontal size={15} />
            <select value={volume} onChange={(event) => setVolume(event.target.value)}>
              <option value="all">All volumes</option>
              {VOLUME_META.map((item) => (
                <option key={item.name} value={item.name}>
                  {String(item.no).padStart(2, "0")} · {item.name}
                </option>
              ))}
            </select>
          </label>
          <select value={family} onChange={(event) => setFamily(event.target.value)}>
            <option value="all">All families</option>
            {families.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={tone} onChange={(event) => setTone(event.target.value)}>
            <option value="all">All tones</option>
            {tones.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={gate} onChange={(event) => setGate(event.target.value)}>
            <option value="all">All gates</option>
            <option value="passed">Gate passed</option>
            <option value="needs-fix">Needs fix</option>
            <option value="ungated">Ungated</option>
            <option value="killed">Killed</option>
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            {SORTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {activeFilters ? (
            <button className="btn btn-small btn-ghost" onClick={clearFilters}>
              <FilterX size={14} /> Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="table-panel panel">
        {pageRows.length ? (
          <div className="table-scroll">
            <table className="rule-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Rule</th>
                  <th className="col-volume">Volume</th>
                  <th className="col-family">Family</th>
                  <th className="col-cast">Cast</th>
                  <th className="col-status">Status</th>
                  <th className="col-gate">Gate</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((rule) => {
                  const cast = splitCast(rule.cast);
                  return (
                    <tr key={rule.id} onClick={() => onOpenRule(rule.id)} tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") onOpenRule(rule.id);
                      }}
                    >
                      <td className="col-id mono">{rule.id}</td>
                      <td className="col-rule">
                        <strong>{rule.rule}</strong>
                        <span>{rule.consequence}</span>
                      </td>
                      <td className="col-volume">
                        <span className="volume-chip">{rule.volume}</span>
                      </td>
                      <td className="col-family">
                        <span className="family-chip">{rule.family}</span>
                      </td>
                      <td className="col-cast">
                        {cast.slice(0, 2).join(" · ")}
                        {cast.length > 2 ? ` +${cast.length - 2}` : ""}
                      </td>
                      <td className="col-status">
                        <StatusPill status={getStatus(rule, reviews)} compact />
                      </td>
                      <td className="col-gate">
                        <span className={`gate-pill ${GATE_META[getGate(rule)]?.className || "gate-ungated"}`}>
                          {GATE_META[getGate(rule)]?.label || "Ungated"} {rule.seed_score || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No rules match that."
            body="Try a different volume, family, or search term. The catalog has a thousand doors."
            action={
              <button className="btn btn-small" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        )}
      </div>

      <div className="pagination">
        <span>
          Page {safePage + 1} of {totalPages} · {formatNumber(filtered.length)} rules
        </span>
        <div className="pagination-actions">
          <button
            className="btn btn-small btn-ghost"
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            disabled={safePage === 0}
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <button
            className="btn btn-small btn-ghost"
            onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            disabled={safePage >= totalPages - 1}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
