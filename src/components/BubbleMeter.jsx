export default function BubbleMeter({ bubble, compact = false, scopeName = 'this context' }) {
  if (compact) return <section className="bubble-score-compact" aria-label="My reading concentration — Bubble Score">
    <div className="meter-heading"><h3>Bubble Score</h3><strong>{bubble.score === null ? 'Not enough reading' : `${bubble.score}/100 · ${bubble.label}`}</strong></div>
    {bubble.score !== null && <progress max="100" value={bubble.score} aria-label={`Bubble Score: ${bubble.score}, ${bubble.label}`} />}
    <p>{bubble.score === null ? 'Read at least 5 articles in this context to calculate your score.' : `Your recent reading concentration in ${scopeName}.`}</p>
  </section>;

  return <section className="bubble-meter" aria-label="My reading concentration — Bubble Score">
    <div className="meter-heading"><h3>My reading concentration <span className="help-text">· Bubble Score</span></h3><strong>{bubble.score === null ? '—' : `${bubble.score}/100`} · {bubble.label}</strong></div>
    {bubble.score === null ? <p>Read a few more articles to calculate your Bubble Score.</p> :
      <progress max="100" value={bubble.score} aria-label={`Bubble Score: ${bubble.score}, ${bubble.label}`} />}
    <p className="help-text">Based on article opens in {scopeName}, separate from any preset role interests.</p>
    <p className="help-text">Among your latest 10 article opens, the most-read category’s share × 100 (rounded). At least 5 opens are needed. This measures reading concentration, not article quality.</p>
    <p className="help-text">0–39 Diverse · 40–59 Balanced · 60–74 Concentrated · 75–100 Strong Bubble</p>
  </section>;
}
