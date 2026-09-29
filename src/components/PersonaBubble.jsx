import { useState } from 'react';
import BubbleMeter from './BubbleMeter.jsx';
import { getPersonaFeed } from '../utils/recommendation.js';
import { getCategoryDistribution } from '../utils/bubbleScore.js';

export default function PersonaBubble({ persona, personas, articles, visibleArticles, category, onSelect, onBreak, bubble, children }) {
  const alternatives = personas.filter(item => item.id !== persona.id);
  const [comparisonId, setComparisonId] = useState(alternatives[0].id);
  const comparison = alternatives.find(item => item.id === comparisonId) || alternatives[0];
  // Count actual visible cards, not all 500 stories: ordering creates the bubble.
  const counts = getCategoryDistribution(visibleArticles);
  const categories = [...new Set(articles.map(article => article.category))].sort();
  const total = visibleArticles.length;
  const interestCount = visibleArticles.filter(article => persona.categories.includes(article.category)).length;
  const lessVisible = categories.filter(item => !persona.categories.includes(item))
    .sort((a, b) => (counts[a] || 0) - (counts[b] || 0) || a.localeCompare(b)).slice(0, 3);

  return <section className="persona-bubble" aria-label="Your selected role’s information bubble">
    <div className="persona-bubble-overview" data-persona={persona.id}>
    <div className="persona-bubble-compact">
      <p><strong>You’re inside {persona.name}’s bubble.</strong> About 70% of recommendations favor {persona.categories.join(' / ').toUpperCase()}.</p>
      <button className="bubble-break-link" onClick={onBreak}>Break the Bubble ↗</button>
    </div>
    <BubbleMeter bubble={bubble} compact scopeName={persona.name} />
    </div>
    <details className="bubble-details">
      <summary>Why this feed? See interests, missing topics &amp; compare roles</summary>
      <p className="help-text">This role’s interests shape the feed before you click. This simulates a topic bubble; categories alone do not measure the diversity of viewpoints.</p>
    <div className="persona-bubble-grid">
      <section className="panel"><h3>What this role sees</h3>
        <p><strong>{total ? Math.round(interestCount / total * 100) : 0}%</strong> of the {total} currently displayed stories match this role’s interests.</p>
        <p className="help-text">The recommendation pattern favors these interests about 70% of the time. This chart counts the cards currently shown{category !== 'All' ? `, with the ${category.toUpperCase()} filter applied` : ''}; Load More changes the sample.</p>
        {categories.map(item => <div className="distribution-row" key={item}>
          <div><strong>{item.toUpperCase()}{persona.categories.includes(item) ? ' · Interest' : ''}</strong><span>{counts[item] || 0} / {total}</span></div>
          <progress value={counts[item] || 0} max={Math.max(1, total)} aria-label={`${item}: ${counts[item] || 0} of ${total} displayed stories`} />
        </div>)}
      </section>
      <section className="panel"><h3>What you might be missing</h3>
        <p>Outside this role’s main interests, these categories have some of the fewest stories in the current view:</p>
        <ul className="missing-categories">{lessVisible.map(item => <li key={item}><strong>{item.toUpperCase()}</strong><span>{counts[item] || 0} currently shown</span></li>)}</ul>
        <p>The stories are still in the dataset. Their position makes them easier to overlook.</p>
        <button className="button" onClick={onBreak}>Break the Bubble</button>
        <p className="help-text">Explore a broader feed based on your reading, or a balanced mix if you have fewer than 5 opens.</p>
      </section>
    </div>
    <details className="persona-comparison">
      <summary>Same world, different feeds — compare another role</summary>
      <div className="comparison-controls"><label htmlFor="comparison-persona">Compare with</label><select id="comparison-persona" value={comparison.id} onChange={event => setComparisonId(event.target.value)}>{alternatives.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <p className="help-text">First 6 recommendations for each role, before any category filter. Both draw from the same news dataset.</p>
      <div className="persona-bubble-grid">{[persona, comparison].map(role => <section key={role.id} className="comparison-column"><h3>{role.name}</h3><p className="interest-tags">{role.categories.join(' · ').toUpperCase()}</p><ol>{getPersonaFeed(articles, role).slice(0, 6).map(article => <li key={article.id}><span className="category-tag">{article.category.toUpperCase()}</span><span>{article.title}</span></li>)}</ol></section>)}</div>
      <button className="button secondary" onClick={() => onSelect(comparison)}>Explore {comparison.name}’s Feed</button>
    </details>
    <p className="help-text">Bubble Score measures your reading across all roles: the largest category share among your latest 10 opens, rounded to a percentage. At least 5 opens are needed. 0–39 Diverse · 40–59 Balanced · 60–74 Concentrated · 75–100 Strong Bubble.</p>
    {children}
    <p className="bubble-takeaway"><strong>The bubble starts with the role you choose.</strong> What appears first shapes what you notice. Compare another role to see what this feed leaves less visible.</p>
    </details>
  </section>;
}
