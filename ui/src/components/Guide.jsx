import { ArrowRight, BookOpen, FileText, Keyboard, LayoutDashboard } from "lucide-react";

export default function Guide() {
  return (
    <div className="page guide-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Help</div>
          <h1>How to use the rulebook</h1>
          <p>Five minutes to understand the whole tool.</p>
        </div>
      </header>

      <section className="guide-section">
        <h2><LayoutDashboard size={15} /> 1. Overview</h2>
        <p>
          This is the home screen. It shows how many rules are approved, how many are
          still to review, and how far each volume has progressed.
        </p>
        <p>
          <strong>Review data</strong> is where you export your approvals and notes.
          They live in this browser until you export them.
        </p>
      </section>

      <section className="guide-section">
        <h2><BookOpen size={15} /> 2. Rules</h2>
        <ol>
          <li>Open <strong>Rules</strong>.</li>
          <li>Search by rule, cast, place, or twist. Filter by volume, family, tone, or status.</li>
          <li>Click any row to open the full seed: cast, place, breach reason, twist, final image, and Chacha location.</li>
          <li>Use the note field for a change request, then copy it back into chat.</li>
        </ol>
      </section>

      <section className="guide-section">
        <h2><Keyboard size={15} /> 3. Review</h2>
        <p>
          The fastest way to clear the catalog. One rule at a time, with the full seed
          on screen.
        </p>
        <div className="guide-keys">
          <span><kbd>A</kbd> approve</span>
          <span><kbd>M</kbd> maybe</span>
          <span><kbd>R</kbd> kill</span>
          <span><kbd>S</kbd> skip</span>
          <span><kbd>U</kbd> undo</span>
        </div>
        <p>
          <strong>Approve</strong> means you would make it. <strong>Maybe</strong> means
          it needs a change first. <strong>Kill</strong> means it is off-brand. Use the
          volume selector to review one volume at a time.
        </p>
      </section>

      <section className="guide-section">
        <h2><FileText size={15} /> 4. Script builder</h2>
        <ol>
          <li>Pick a rule from the left list.</li>
          <li>The template fills in the cold open, story beats, cast, and final image.</li>
          <li>Write the dialogue in Urdu. Chacha appears only at the start and the end.</li>
          <li>Use <strong>Save draft</strong>, <strong>Copy</strong>, or <strong>Download .md</strong>.</li>
        </ol>
        <p>
          Drafts are saved in this browser. They are not written back to the repo.
        </p>
      </section>

      <section className="guide-section">
        <h2>5. Launch plan</h2>
        <p>
          The first 28 episodes over 14 days, two per day. Each card shows the rule,
          Chacha's location, thumbnail direction, and status. Click a card to open the
          seed.
        </p>
      </section>

      <section className="guide-section">
        <h2>6. Saving your work</h2>
        <p>
          Approvals, notes, and script drafts are stored in this browser. To put them
          into the repo, open <strong>Overview</strong> → <strong>Review data</strong> and
          export JSON or CSV. Send that file back to be merged into
          <code> rules/rules.csv</code>.
        </p>
        <p>
          The catalog itself is read-only here. Changes to rules are made in
          <code> rules/source/*.psv</code>, then the catalog is rebuilt and the UI is
          redeployed.
        </p>
      </section>

      <div className="guide-actions">
        <a className="btn btn-primary" href="#/review">
          Start reviewing <ArrowRight size={14} />
        </a>
        <a className="btn" href="#/browse">
          Browse rules
        </a>
      </div>
    </div>
  );
}
