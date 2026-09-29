import BubbleMeter from './BubbleMeter.jsx';
import { getCategoryDistribution } from '../utils/bubbleScore.js';

export default function AnalysisPage({ user, articles, categories, bubble, scopeName, onBreak, onReset, onRead }) {
  const counts = getCategoryDistribution(user.readingHistory);
  const top = categories.filter(category => user.categoryScores[category] > 0).sort((a, b) => user.categoryScores[b] - user.categoryScores[a])[0];
  const maxScore = Math.max(1, ...Object.values(user.categoryScores));
  const leastRead = [...categories].sort((a, b) => (counts[a] || 0) - (counts[b] || 0)).slice(0, 4);
  return <section className="feed-section">
    <div className="section-heading"><div><p className="eyebrow">YOUR READING, MADE VISIBLE</p><h1>My Analysis</h1></div><button className="button" onClick={onBreak}>Break the Bubble</button></div>
    <p className="help-text">This report covers your activity in {scopeName}. Profiles for other roles stay separate. Bubble Score is based on article opens only.</p>
    <div className="stats-grid">
      <div><strong>{user.readingHistory.length}</strong><span>Total articles opened (includes repeat opens)</span></div>
      <div><strong>{user.savedArticleIds.length}</strong><span>Total articles saved</span></div>
      <div><strong>{top?.toUpperCase() || 'Not yet'}</strong><span>Top interest category</span></div>
      <div><strong>{user.totalInteractions}</strong><span>Total interactions (opens, saves, unsaves)</span></div>
    </div>
    <BubbleMeter bubble={bubble} scopeName={scopeName} />
    <p><strong>Feed diversity:</strong> {bubble.label}</p>
    <div className="analysis-grid">
      <section className="panel"><h2>Your interests</h2><p>Each open adds 1 point. A saved article adds 2 more; unsaving removes those 2 points.</p>
        {!top && <p>Open or save an article to start discovering your interests.</p>}
        {categories.map(category => <div className="distribution-row" key={category}>
          <div><strong>{category.toUpperCase()}</strong><span>{counts[category] || 0} opens · {user.categoryScores[category] || 0} points</span></div>
          <progress max={maxScore} value={user.categoryScores[category] || 0} aria-label={`${category} interest points`} />
        </div>)}
      </section>
      <section className="panel"><h2>Recent reading</h2>
        {!user.readingHistory.length ? <p>Your latest 10 article opens will appear here.</p> : <ol className="history-list">{user.readingHistory.slice(-10).reverse().map((item, index) => {
          const article = articles.find(entry => entry.id === item.id);
          return <li key={`${item.id}-${index}`}><a href={article.url} target="_blank" rel="noopener noreferrer" onClick={() => onRead(article)}>{article.title} <span aria-label="opens in a new tab">↗</span></a><small>{item.category.toUpperCase()}</small></li>;
        })}</ol>}
        <h3>Less-read categories</h3><p>{leastRead.join(' · ').toUpperCase()}</p><p>Try one of these perspectives in your next reading session.</p>
      </section>
    </div>
    <button className="button secondary" onClick={onReset}>Reset My Data</button>
  </section>;
}
