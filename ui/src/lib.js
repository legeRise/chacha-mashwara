export const VOLUME_META = [
  { no: 1, name: "Ghar", english: "Home", theme: "The house knows you.", slug: "ghar" },
  { no: 2, name: "Raaste", english: "Roads", theme: "The road remembers.", slug: "raaste" },
  { no: 3, name: "Rishtey", english: "Relationships", theme: "What we owe each other.", slug: "rishtey" },
  { no: 4, name: "Purani Cheezein", english: "Old Things", theme: "Objects keep receipts.", slug: "purani-cheezein" },
  { no: 5, name: "Mohalla", english: "Neighborhood", theme: "Everyone is watching.", slug: "mohalla" },
  { no: 6, name: "Shadi", english: "Weddings", theme: "A house full of witnesses.", slug: "shadi" },
  { no: 7, name: "Safar", english: "Travel", theme: "You are a guest everywhere.", slug: "safar" },
  { no: 8, name: "Bachpan", english: "Childhood", theme: "Children see first.", slug: "bachpan" },
  { no: 9, name: "Khandan", english: "Family", theme: "Blood keeps a ledger.", slug: "khandan" },
  { no: 10, name: "Mausam", english: "Weather", theme: "The sky has a memory.", slug: "mausam" },
];

export const STATUS_META = {
  candidate: { label: "To review", short: "To review", className: "status-candidate" },
  approved: { label: "Approved", short: "Approved", className: "status-approved" },
  maybe: { label: "Maybe", short: "Maybe", className: "status-maybe" },
  rejected: { label: "Killed", short: "Killed", className: "status-rejected" },
};

export const STATUS_ORDER = ["candidate", "approved", "maybe", "rejected"];

export const GATE_META = {
  passed: { label: "Passed", className: "gate-passed" },
  "needs-fix": { label: "Needs fix", className: "gate-needs-fix" },
  ungated: { label: "Ungated", className: "gate-ungated" },
  killed: { label: "Killed", className: "gate-killed" },
};

export function getGate(rule) {
  return rule.gate_status || "ungated";
}

export function gateCounts(rules) {
  const counts = { passed: 0, "needs-fix": 0, ungated: 0, killed: 0 };
  for (const rule of rules) counts[getGate(rule)] += 1;
  return counts;
}

export const LAUNCH_PLAN = [
  { day: 1, slot: "A", id: "R-0001", thumb: "Doorway" },
  { day: 1, slot: "B", id: "R-0011", thumb: "Object close-up" },
  { day: 2, slot: "A", id: "R-0021", thumb: "Empty room" },
  { day: 2, slot: "B", id: "R-0036", thumb: "Object close-up" },
  { day: 3, slot: "A", id: "R-0043", thumb: "Face half-lit" },
  { day: 3, slot: "B", id: "R-0051", thumb: "Mirror" },
  { day: 4, slot: "A", id: "R-0061", thumb: "Empty chair" },
  { day: 4, slot: "B", id: "R-0068", thumb: "Object" },
  { day: 5, slot: "A", id: "R-0073", thumb: "Photo" },
  { day: 5, slot: "B", id: "R-0082", thumb: "Light" },
  { day: 6, slot: "A", id: "R-0091", thumb: "Doorway" },
  { day: 6, slot: "B", id: "R-0094", thumb: "Empty room" },
  { day: 7, slot: "A", id: "R-0096", thumb: "Phone" },
  { day: 7, slot: "B", id: "R-0013", thumb: "Mirror" },
  { day: 8, slot: "A", id: "R-0002", thumb: "Doorway" },
  { day: 8, slot: "B", id: "R-0012", thumb: "Object" },
  { day: 9, slot: "A", id: "R-0022", thumb: "POV" },
  { day: 9, slot: "B", id: "R-0034", thumb: "Object" },
  { day: 10, slot: "A", id: "R-0044", thumb: "Empty room" },
  { day: 10, slot: "B", id: "R-0052", thumb: "Water" },
  { day: 11, slot: "A", id: "R-0062", thumb: "Empty chair" },
  { day: 11, slot: "B", id: "R-0063", thumb: "Object" },
  { day: 12, slot: "A", id: "R-0074", thumb: "Mirror" },
  { day: 12, slot: "B", id: "R-0081", thumb: "Silhouette" },
  { day: 13, slot: "A", id: "R-0092", thumb: "POV" },
  { day: 13, slot: "B", id: "R-0095", thumb: "Object" },
  { day: 14, slot: "A", id: "R-0093", thumb: "Silhouette" },
  { day: 14, slot: "B", id: "R-0099", thumb: "Face half-lit" },
];

export function cx(...values) {
  return values.filter(Boolean).join(" ");
}

export function splitCast(cast) {
  return (cast || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getStatus(rule, reviews) {
  return reviews?.[rule.id]?.status || rule.status || "candidate";
}

export function getNote(rule, reviews) {
  return reviews?.[rule.id]?.note || "";
}

export function isReviewed(rule, reviews) {
  return Boolean(reviews?.[rule.id]);
}

export function reviewCounts(rules, reviews) {
  const counts = { candidate: 0, approved: 0, maybe: 0, rejected: 0 };
  for (const rule of rules) counts[getStatus(rule, reviews)] += 1;
  return counts;
}

export function volumeCounts(rules, reviews) {
  return VOLUME_META.map((volume) => {
    const list = rules.filter((rule) => rule.volume === volume.name);
    const counts = reviewCounts(list, reviews);
    return {
      ...volume,
      total: list.length,
      ...counts,
      reviewed: counts.approved + counts.maybe + counts.rejected,
    };
  });
}

export function familyCounts(rules) {
  const map = new Map();
  for (const rule of rules) map.set(rule.family, (map.get(rule.family) || 0) + 1);
  return [...map.entries()]
    .map(([family, count]) => ({ family, count }))
    .sort((a, b) => b.count - a.count);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function downloadFile(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

export function exportReviews(rules, reviews, notes = {}, format = "json") {
  const reviewed = rules.filter((rule) => reviews[rule.id]);
  if (format === "json") {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        count: reviewed.length,
        reviews,
        notes,
      },
      null,
      2,
    );
  }

  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = ["id,rule,volume,status,note"];
  for (const rule of reviewed) {
    const review = reviews[rule.id];
    lines.push(
      [
        rule.id,
        escape(rule.rule),
        escape(rule.volume),
        escape(review.status),
        escape(notes[rule.id] || review.note || ""),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export function buildScript(rule) {
  const cast = splitCast(rule.cast);
  const [first, second, third] = cast;
  const castLine = cast.join(" · ");
  return `# ${rule.id} — ${rule.rule}

**Runtime target:** 55–60 seconds
**Chacha location:** ${rule.chacha_location}
**Story cast:** ${castLine}
**Rule:** ${rule.rule}
**Consequence:** ${rule.consequence}
**Tone:** ${rule.tone}

---

## 0:00–0:10 — COLD OPEN — CHACHA

**Location:** ${rule.chacha_location}
**Shot:** Medium, static. The rulebook is closed in his lap. One practical light.

**CHACHA**
*(pause, looks at the viewer)*
"Suno meri baat. [Write the rule in Urdu: ${rule.rule}]. Agar tum ne aisa kiya, [write the consequence in Urdu: ${rule.consequence}]."

*He opens the rulebook. Camera pushes into the page.*

---

## 0:10–0:50 — THE STORY

**No Chacha. No narrator. The characters speak for themselves.**
**Place:** ${rule.place}
**Cast:** ${castLine}

### Scene 1 — Normal

**${first || "CHARACTER A"}**
(line — wants: [small human want])

**${second || "CHARACTER B"}**
(line — responds)

**${first || "CHARACTER A"}**
(line — the want is clear)

### Scene 2 — The breach

**${first || "CHARACTER A"}**
(line — the sympathetic reason: ${rule.breach_reason})

**${second || "CHARACTER B"}**
(line — the warning, not the rule)

*Action: the character breaks the rule.*

### Scene 3 — Escalation

**${first || "CHARACTER A"}**
(line — first consequence: ${rule.consequence})

**${second || "CHARACTER B"}**
(line — tries to undo it)

${third ? `**${third}**\n(line — sees what the others miss)\n` : ""}
*Action: the cost rises.*

### Scene 4 — The twist

**${first || "CHARACTER A"}**
(line — the realization)

**${second || "CHARACTER B"}**
(line — the reveal, without explaining the entity: ${rule.twist})

*Action: the rule proves itself.*

### Final image

*Silent. Two seconds. One shot: ${rule.final_image}*

---

## 0:50–0:58 — RETURN — CHACHA

**Same location and shot as the cold open.** He closes the book.

**CHACHA**
*(pause)*
"[Write the verdict in Urdu. Name the mistake, not the monster.]"

*He taps the cover twice.*

**CHACHA**
"Rule yaad rakhna."

*Cut to black.*

---

## Production notes

- **Story core:** ${rule.story_core}
- **Chacha location:** ${rule.chacha_location}
- **Family:** ${rule.family}
- **Tone:** ${rule.tone}
- **No Chacha inside the story.**
- **No narrator.**
- **The final image is silent.**
- **The verdict is one sentence.**
- **Total runtime: 50–65 seconds.**
`;
}

export function ruleChangeRequest(rule, note) {
  return `${rule.id} — ${rule.rule}

Requested change:
${note?.trim() || "[What should change? Title, twist, cast, or the whole story?]"}

Current seed:
- Consequence: ${rule.consequence}
- Story: ${rule.story_core}
- Cast: ${rule.cast}
- Place: ${rule.place}
- Breach reason: ${rule.breach_reason}
- Twist: ${rule.twist}
- Final image: ${rule.final_image}
`;
}
