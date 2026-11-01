import { useEffect, useMemo, useState } from "react";
import { Check, Copy, RefreshCw, Sparkles } from "lucide-react";
import { copyText } from "../lib.js";
import { SEED_PROMPT } from "../seedPrompt.js";

const FIELDS = [
  ["Rule", "rule"],
  ["Consequence", "consequence"],
  ["Story core", "story_core"],
  ["Cast", "cast"],
  ["Place", "place"],
  ["Breach reason", "breach_reason"],
  ["Twist", "twist"],
  ["Final image", "final_image"],
  ["Want", "want"],
  ["Object / motif", "object_motif"],
  ["Theme", "theme"],
  ["Verdict", "verdict"],
];

const MOTIF_GROUPS = {
  door: [
    "door",
    "darwaza",
    "bell",
    "ghanti",
    "peephole",
    "chain",
    "lock",
    "key",
    "threshold",
    "corridor",
    "outside",
  ],
  mirror: ["mirror", "reflection", "shisha", "aaina"],
  voice: ["voice", "aawaz", "phone", "call", "recording", "whisper"],
  wedding: ["wedding", "shaadi", "bride", "dulhan", "sherwani", "card", "henna", "mehndi"],
  food: ["food", "plate", "tiffin", "kitchen", "cooker", "roti", "tea", "glass", "kettle"],
  time: ["clock", "watch", "midnight", "hour"],
  photo: ["photo", "picture", "camera", "album"],
  shoes: ["shoe", "jutte", "footprint", "feet", "paayal", "anklet"],
  hair: ["hair", "comb", "choti"],
  doll: ["doll", "toy", "gudiya"],
  paper: ["book", "letter", "notebook", "diary", "newspaper", "rulebook"],
  travel: ["train", "bus", "road", "taxi", "lift", "stair", "platform", "journey"],
  water: ["water", "rain", "tap", "well", "pool", "wet"],
  electric: ["fan", "bulb", "light", "switch", "wire", "current"],
  bed: ["bed", "sleep", "pillow", "blanket", "sofa"],
};

function motifFor(rule) {
  const text = [
    rule.rule,
    rule.story_core,
    rule.object_motif,
    rule.place,
    rule.twist,
    rule.final_image,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  for (const [key, words] of Object.entries(MOTIF_GROUPS)) {
    if (words.some((word) => text.includes(word))) return key;
  }
  return "other";
}

function seedText(rule) {
  return [
    `ID: ${rule.id}`,
    ...FIELDS.map(
      ([label, key]) => `${label}: ${String(rule[key] || "").trim() || "(not filled — improve it)"}`,
    ),
  ].join("\n");
}

function pickSeed(rules, { skipDoors, history, currentId }) {
  const usable = rules.filter((rule) => rule.gate_status !== "killed" && rule.rule && rule.story_core);
  const pool = skipDoors ? usable.filter((rule) => motifFor(rule) !== "door") : usable;
  const fresh = pool.filter((rule) => !history.includes(motifFor(rule)) && rule.id !== currentId);
  const list = fresh.length ? fresh : pool.filter((rule) => rule.id !== currentId);
  if (!list.length) return pool[0] || usable[0] || null;
  return list[Math.floor(Math.random() * list.length)];
}

function newSeedRequest(history) {
  const used = [...new Set(history.filter(Boolean))];
  return `Invent one new seed for "Chacha Mashwara".

Return only these fields, one per line:
Rule, Consequence, Story core, Cast, Place, Breach reason, Twist, Final image, Want, Object/motif, Theme, Verdict.

Avoid these motifs: ${used.join(", ") || "none"}.
No doors, bells, peepholes, chains, keys, or "someone at the door".
The rule must be an ordinary object or situation. The breach must be sympathetic. The twist must be caused by the protagonist's choice. No gore, no entity shown.`;
}

export default function SeedStudio({ rules, showToast }) {
  const [skipDoors, setSkipDoors] = useState(true);
  const [history, setHistory] = useState([]);
  const [seed, setSeed] = useState(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!rules.length) return;
    setSeed(pickSeed(rules, { skipDoors: true, history: [], currentId: null }));
    setHistory([]);
  }, [rules]);

  const motif = seed ? motifFor(seed) : "other";
  const promptWithSeed = useMemo(
    () => (seed ? `${SEED_PROMPT}\n\nSEED:\n${seedText(seed)}\n` : SEED_PROMPT),
    [seed],
  );

  function markCopied(label) {
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1800);
  }

  async function copy(label, text) {
    try {
      await copyText(text);
      markCopied(label);
      showToast(`${label} copied`);
    } catch {
      showToast("Could not copy");
    }
  }

  function nextSeed() {
    if (!seed) return;
    const nextHistory = [...history, motifFor(seed)].slice(-12);
    const next = pickSeed(rules, { skipDoors, history: nextHistory, currentId: seed.id });
    if (next) {
      setSeed(next);
      setHistory(nextHistory);
    }
  }

  function toggleDoors(next) {
    setSkipDoors(next);
    if (!seed) return;
    const nextSeed = pickSeed(rules, { skipDoors: next, history, currentId: seed.id });
    if (nextSeed) setSeed(nextSeed);
  }

  if (!seed) {
    return (
      <div className="page">
        <div className="boot-screen">
          <div className="boot-mark">CM</div>
          <div className="eyebrow">Seed studio</div>
          <h1>Loading the seeds…</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page seed-studio">
      <header className="page-head">
        <div>
          <div className="eyebrow">Seed studio</div>
          <h1>One prompt. One seed. One script.</h1>
          <p>
            The site no longer writes the script. It gives you the main prompt and a distinct seed;
            your AI chat writes the Ezclip-ready script. The old catalog is still under Rules.
          </p>
        </div>
        <div className="head-actions">
          <button
            className="btn btn-primary"
            onClick={() => copy("Prompt + seed", promptWithSeed)}
          >
            {copied === "Prompt + seed" ? <Check size={15} /> : <Copy size={15} />}
            Copy prompt + seed
          </button>
        </div>
      </header>

      <div className="studio-grid">
        <section className="panel prompt-panel">
          <div className="panel-head">
            <div>
              <h2>Main prompt</h2>
              <span>Paste this once at the start of the chat.</span>
            </div>
            <button className="btn btn-small" onClick={() => copy("Main prompt", SEED_PROMPT)}>
              {copied === "Main prompt" ? <Check size={14} /> : <Copy size={14} />}
              Copy prompt
            </button>
          </div>
          <textarea
            className="script-textarea prompt-textarea"
            readOnly
            value={SEED_PROMPT}
            rows={18}
            spellCheck={false}
          />
        </section>

        <section className="panel seed-panel">
          <div className="panel-head">
            <div>
              <h2>Current seed</h2>
              <span>
                {seed.id} · {motif} motif
              </span>
            </div>
            <button className="btn btn-small" onClick={nextSeed}>
              <RefreshCw size={14} />
              New distinct seed
            </button>
          </div>

          <label className="seed-check">
            <input
              type="checkbox"
              checked={skipDoors}
              onChange={(event) => toggleDoors(event.target.checked)}
            />
            Skip door / bell / peephole stories
          </label>

          <h3 className="seed-rule">{seed.rule}</h3>
          <p className="seed-core">{seed.story_core}</p>

          <div className="seed-fields">
            {FIELDS.slice(1).map(([label, key]) => (
              <div className="seed-field" key={key}>
                <span>{label}</span>
                <p>{String(seed[key] || "").trim() || "Not filled — the agent will improve it."}</p>
              </div>
            ))}
          </div>

          <div className="seed-actions">
            <button className="btn btn-primary" onClick={() => copy("Prompt + seed", promptWithSeed)}>
              {copied === "Prompt + seed" ? <Check size={15} /> : <Sparkles size={15} />}
              Copy prompt + seed
            </button>
            <button className="btn" onClick={() => copy("Seed", `SEED:\n${seedText(seed)}\n`)}>
              {copied === "Seed" ? <Check size={15} /> : <Copy size={15} />}
              Copy seed
            </button>
            <button
              className="btn"
              onClick={() => copy("New-seed request", newSeedRequest([...history, motif]))}
            >
              {copied === "New-seed request" ? <Check size={15} /> : <Sparkles size={15} />}
              Copy new-seed request
            </button>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>How it works</h2>
            <span>One chat for the whole run.</span>
          </div>
        </div>
        <ol className="seed-steps">
          <li>
            <strong>Copy prompt + seed</strong> and paste it into one AI chat. That is the whole
            brief.
          </li>
          <li>
            For the next episode, click <strong>New distinct seed</strong>, then{" "}
            <strong>Copy seed</strong>, and send only the seed. The agent already has the prompt.
          </li>
          <li>
            Or click <strong>Copy new-seed request</strong> and let the agent invent a seed that
            avoids the motifs you have already used.
          </li>
          <li>
            Paste the agent&apos;s output into <strong>Ezclip → Create</strong>, select{" "}
            <strong>Chacha Mashwara</strong>, keep Hindi, and check the speakers.
          </li>
        </ol>
        <p className="seed-note">
          The seed gate is not used here. The AI agent writes; you review the script before
          generating.
        </p>
      </section>
    </div>
  );
}
