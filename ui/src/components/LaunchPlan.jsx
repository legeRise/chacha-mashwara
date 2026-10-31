import { Check, Copy, Film, MapPin } from "lucide-react";
import {
  LAUNCH_PLAN,
  copyText,
  getStatus,
  splitCast,
} from "../lib.js";
import { ProgressBar, StatusPill } from "./ui.jsx";

export default function LaunchPlan({ rules, reviews, onOpenRule, showToast }) {
  const days = [...new Set(LAUNCH_PLAN.map((item) => item.day))];
  const entries = LAUNCH_PLAN.map((item) => ({
    ...item,
    rule: rules.find((rule) => rule.id === item.id),
  })).filter((item) => item.rule);
  const approved = entries.filter(
    (item) => getStatus(item.rule, reviews) === "approved",
  ).length;

  async function copySchedule() {
    const text = days
      .map((day) => {
        const slots = entries.filter((item) => item.day === day);
        return `Day ${day}\n${slots
          .map(
            (item) =>
              `  ${item.slot} · ${item.rule.id} · ${item.rule.rule} · ${item.thumb}`,
          )
          .join("\n")}`;
      })
      .join("\n\n");
    await copyText(`Chacha Mashwara — launch schedule\n\n${text}`);
    showToast("Launch schedule copied");
  }

  return (
    <div className="page launch-page">
      <header className="page-head launch-page-head">
        <div>
          <div className="eyebrow">Production</div>
          <h1>Launch plan</h1>
          <p>28 episodes over 14 days. Two a day. Click a card to open the rule.</p>
        </div>
        <div className="launch-head-actions">
          <button className="btn btn-small" onClick={copySchedule}>
            <Copy size={14} /> Copy schedule
          </button>
          <button className="btn btn-small btn-ghost" onClick={() => onOpenRule("R-0001")}>
            Open R-0001
          </button>
        </div>
      </header>

      <section className="launch-summary panel">
        <div>
          <span className="section-label">Approved for launch</span>
          <strong>{approved} / {entries.length}</strong>
        </div>
        <ProgressBar value={approved} max={entries.length} tone="green" />
        <div className="launch-summary-meta">
          <span><Film size={14} /> 2 per day</span>
          <span><Check size={14} /> 14 days</span>
          <span>2-week buffer target: 28 scripts</span>
        </div>
      </section>

      <div className="launch-days">
        {days.map((day) => {
          const slots = entries.filter((item) => item.day === day);
          return (
            <section className="launch-day" key={day}>
              <div className="launch-day-head">
                <span className="launch-day-number">{String(day).padStart(2, "0")}</span>
                <div>
                  <h2>Day {day}</h2>
                  <span>{slots.length} episodes</span>
                </div>
              </div>
              <div className="launch-day-slots">
                {slots.map((item) => (
                  <button
                    className="launch-card"
                    key={`${item.day}-${item.slot}`}
                    onClick={() => onOpenRule(item.rule.id)}
                  >
                    <div className="launch-card-head">
                      <span className="launch-slot">Slot {item.slot}</span>
                      <StatusPill status={getStatus(item.rule, reviews)} compact />
                    </div>
                    <strong>{item.rule.rule}</strong>
                    <span className="launch-card-consequence">{item.rule.consequence}</span>
                    <div className="launch-card-meta">
                      <span className="mono">{item.rule.id}</span>
                      <span><MapPin size={12} /> {item.rule.chacha_location}</span>
                    </div>
                    <div className="launch-card-foot">
                      <span>{item.thumb}</span>
                      <span>{splitCast(item.rule.cast).length} voices</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="launch-note">
        <span className="mono">Note</span>
        <p>
          This schedule mirrors <code>batches/2026-11-volume-01.md</code>. Edit that
          file to change the order, then update <code>LAUNCH_PLAN</code> in
          <code> ui/src/lib.js</code>.
        </p>
      </div>
    </div>
  );
}
