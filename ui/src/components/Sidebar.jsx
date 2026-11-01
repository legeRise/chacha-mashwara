import { Sparkles } from "lucide-react";
import { STATUS_META, cx, formatNumber } from "../lib.js";
import { ProgressBar } from "./ui.jsx";

const NAV = [
  { id: "studio", label: "Seed studio", icon: Sparkles },
];

export default function Sidebar({ route, navigate, counts, total }) {
  const reviewed = counts.approved + counts.maybe + counts.rejected;
  return (
    <aside className="sidebar">
      <button className="wordmark" onClick={() => navigate("studio")}>
        <span className="wordmark-mark">CM</span>
        <span className="wordmark-text">
          <span className="eyebrow">The Rulebook</span>
          <strong>Chacha Mashwara</strong>
        </span>
      </button>

      <nav className="nav" aria-label="Main">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={cx("nav-item", route === item.id && "is-active")}
              onClick={() => navigate(item.id)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.id === "review" && counts.candidate > 0 ? (
                <span className="nav-count">{formatNumber(counts.candidate)}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {route !== "studio" ? (
        <>
          <div className="sidebar-progress">
            <div className="sidebar-progress-head">
              <span>Catalog reviewed</span>
              <strong>
                {formatNumber(reviewed)} / {formatNumber(total)}
              </strong>
            </div>
            <ProgressBar value={reviewed} max={total} tone="green" />
            <div className="sidebar-mini-stats">
              <span>
                <i className={cx("mini-dot", STATUS_META.approved.className)} />
                {formatNumber(counts.approved)} approved
              </span>
              <span>
                <i className={cx("mini-dot", STATUS_META.rejected.className)} />
                {formatNumber(counts.rejected)} killed
              </span>
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="local-badge">
              <span className="local-dot" />
              Local review
            </div>
            <p>Reviews save in this browser. Export them from Overview.</p>
          </div>
        </>
      ) : (
        <div className="sidebar-footer">
          <div className="local-badge">
            <span className="local-dot" />
            Prompt + one seed
          </div>
          <p>The AI chat writes the script. The old catalog is still available.</p>
          <button className="btn btn-ghost btn-small" onClick={() => navigate("browse")}>
            Open the old catalog
          </button>
        </div>
      )}
    </aside>
  );
}
