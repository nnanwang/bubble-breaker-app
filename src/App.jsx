import { useEffect, useState } from 'react';
import NewsCard from './components/NewsCard.jsx';
import PersonaCard, { PersonaPortrait } from './components/PersonaCard.jsx';
import BubbleMeter from './components/BubbleMeter.jsx';
import PersonaBubble from './components/PersonaBubble.jsx';
import AnalysisPage from './components/AnalysisPage.jsx';
import newsData from './data/newsData.json';
import { personas } from './data/personas.js';
import { normalizeArticles, getMixedFeed, getPersonaFeed, getPersonalizedFeed, getBreakBubbleFeed } from './utils/recommendation.js';
import { calculateBubbleScore, getCategoryDistribution } from './utils/bubbleScore.js';
import { STORAGE_KEY, initialUserData, loadUserData, recordOpen, toggleSave } from './utils/storage.js';

const articles = normalizeArticles(newsData);
const categories = [...new Set(articles.map(article => article.category))].sort();
const STARTING_ARTICLES = 6;

export default function App() {
  // All learning progress lives together and is restored once when App starts.
  const [user, setUser] = useState(() => loadUserData(articles, personas));
  const [visibleCount, setVisibleCount] = useState(STARTING_ARTICLES);
  const [category, setCategory] = useState('All');
  const [dismissedScore, setDismissedScore] = useState(null);
  const [storageError, setStorageError] = useState(false);
  const page = user.currentPage;
  const persona = personas.find(item => item.id === user.selectedPersona);
  const activeContextId = user.mode === 'persona' && persona ? persona.id : 'personal';
  const activeActivity = user.activityByContext?.[activeContextId] || { readingHistory: [], categoryScores: {}, totalInteractions: 0 };
  const activeSavedArticleIds = user.savedArticleIds.filter(id => user.savedArticleContext?.[id] === activeContextId);
  const scopedUser = { ...user, ...activeActivity, savedArticleIds: activeSavedArticleIds };
  const breakPersona = page === 'break' && user.mode === 'persona' ? persona : null;
  const bubble = calculateBubbleScore(activeActivity.readingHistory);
  const contextNavigationVisible = Boolean(user.mode) && !['home', 'about'].includes(page);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [user]);

  function navigate(destination) {
    setUser(current => ({ ...current, ...(destination === 'feed' && !current.mode ? { mode: 'personal', selectedPersona: null } : {}), currentPage: destination }));
    setCategory('All');
    setVisibleCount(STARTING_ARTICLES);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function startFeed(selectedPersona = null) {
    setUser(current => ({ ...current, mode: selectedPersona ? 'persona' : 'personal', selectedPersona: selectedPersona?.id || null, currentPage: 'feed' }));
    setCategory('All'); setVisibleCount(STARTING_ARTICLES);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function resetData() {
    if (!window.confirm('Reset all your reading history, saved articles, interests, and selected feed?')) return;
    setUser(initialUserData()); setDismissedScore(null); setCategory('All'); setVisibleCount(STARTING_ARTICLES);
  }
  const openArticle = article => setUser(current => recordOpen(current, article, activeContextId));
  const saveArticle = article => setUser(current => toggleSave(current, article, activeContextId));
  let feed = getMixedFeed(articles);
  if (page === 'feed') feed = user.mode === 'persona' ? getPersonaFeed(articles, persona) : getPersonalizedFeed(articles, activeActivity.categoryScores, activeActivity.totalInteractions);
  if (page === 'break') feed = getBreakBubbleFeed(articles, activeActivity.categoryScores, activeActivity.readingHistory, breakPersona?.categories);
  const filteredFeed = feed.filter(article => category === 'All' || article.category === category);
  const title = page === 'break' ? breakPersona ? `Beyond ${breakPersona.name}'s Bubble` : 'Break My Bubble' : user.mode === 'persona' ? persona?.name : 'My Own Feed';
  const counts = getCategoryDistribution(activeActivity.readingHistory);
  const oftenRead = [...categories].filter(item => counts[item]).sort((a, b) => counts[b] - counts[a]).slice(0, 2);
  const lessRead = [...categories].sort((a, b) => (counts[a] || 0) - (counts[b] || 0)).slice(0, 4);
  // A dismissal lasts until concentration changes by at least 15 points or refresh.
  const showWarning = !['home', 'about'].includes(page) && bubble.score >= 60 && (dismissedScore === null || Math.abs(bubble.score - dismissedScore) >= 15);

  return <div className="app-shell">
    <header className="site-header">
      <button className="brand" onClick={() => navigate('home')} aria-label="Bubble Breaker home"><span className="brand-mark">B</span><span>Bubble Breaker</span></button>
      <nav className="main-nav" aria-label="Main navigation">
        <button aria-current={page === 'home' ? 'page' : undefined} className={page === 'home' ? 'active' : ''} onClick={() => navigate('home')}>Home</button>
        {contextNavigationVisible && <div className="role-nav-group" role="group" aria-label={`${persona?.name || 'Personal Feed'} pages`}>
          <span className="nav-context">{persona?.name || 'Personal Feed'}</span>
          {['feed', 'analysis', 'break'].map((destination, index) => {
            const label = ['My Feed', 'My Analysis', 'Break the Bubble'][index];
            return <button key={destination} aria-current={page === destination ? 'page' : undefined} className={page === destination ? 'active' : ''} onClick={() => navigate(destination)}>{label}</button>;
          })}
        </div>}
        <button aria-current={page === 'about' ? 'page' : undefined} className={page === 'about' ? 'active' : ''} onClick={() => navigate('about')}>About</button>
      </nav>
    </header>
    <main id="top">
      {storageError && <p className="notice" role="status">Your browser could not save progress. Keep this tab open, or allow local storage before refreshing.</p>}
      {page !== 'home' && showWarning && <aside className="bubble-alert" aria-label="Reading concentration warning" role="status">
        <div><h2>Your reading is becoming concentrated.</h2><p>Most of your recent reading focuses on one category. You may be seeing fewer perspectives.</p></div>
        <div className="actions"><button className="button" onClick={() => navigate('analysis')}>View My Analysis</button><button className="button" onClick={() => navigate('break')}>Break the Bubble</button><button className="button secondary" onClick={() => setDismissedScore(bubble.score)}>Keep Browsing</button></div>
      </aside>}
      {page === 'home' && <>
        <section className="feed-section persona-section" id="personas"><div className="section-heading"><div><p className="eyebrow">CHOOSE A PERSPECTIVE</p><h2>Whose world will you explore?</h2></div></div>
          <div className="persona-grid">{personas.map(item => <PersonaCard key={item.id} persona={item} onSelect={startFeed} />)}</div>
        </section>
      </>}
      {page === 'about' && <section className="feed-section about-page">
        <p className="eyebrow">ABOUT BUBBLE BREAKER</p>
        <h1>Same world.<br />Different starting points.</h1>
        <p className="about-lead">What changes when the articles stay the same, but a feed is organized around different interests? Bubble Breaker is an interactive media-literacy project that lets you explore that question by comparing role-based feeds and then stepping outside their interests.</p>
        <div className="about-principles">
          <section><p className="about-index">01 / THE DATASET</p><h2>One collection, four lenses</h2><p>All personas draw from the same fixed set of 500 articles. Their interests change which stories appear first, not the stories available in the collection.</p></section>
          <section><p className="about-index">02 / THE PERSONAS</p><h2>Different starting interests</h2><p>AI Explorer follows AI and development. Startup Builder follows founders, product, and marketing. Security Specialist follows information security, DevOps, and development. Digital Creator follows design, product, and marketing.</p></section>
          <section><p className="about-index">03 / THE FEEDS</p><h2>Inspectable recommendation rules</h2><p>A persona feed uses a repeating 70/30 mix: about 70% from its interest categories and 30% from other categories. The personal feed develops its own interest scores from opens and saves.</p></section>
        </div>
        <section className="about-detail">
          <div><p className="eyebrow">A SHORT WALKTHROUGH</p><h2>Explore, compare, then break the pattern.</h2></div>
          <ol className="about-steps">
            <li><strong>Choose a role.</strong> Open My Feed to see the role's recommended stories and inspect which categories are more or less visible.</li>
            <li><strong>Compare another perspective.</strong> Use the role comparison to see how the same collection is ordered for a different set of interests.</li>
            <li><strong>Review this role's activity.</strong> My Analysis shows opens, saves, category scores, and reading history for the current role only. Every role has a separate profile.</li>
            <li><strong>Break this role's bubble.</strong> The 40/40/20 feed mixes familiar role interests, less-read categories, and remaining categories. Build My Own Feed starts a separate personal context.</li>
          </ol>
        </section>
        <section className="about-detail about-detail-limits">
          <div><p className="eyebrow">MEASUREMENT &amp; LIMITS</p><h2>What the Bubble Score means</h2></div>
          <div><p>The Bubble Score uses the latest ten article opens in the active context. It reports the largest category share; at least five opens are needed before a score is shown. Saving an article changes interest points but does not count as an open.</p><p>The score measures concentration by topic category. It does not evaluate article quality, factual accuracy, political bias, or diversity of viewpoints. Category variety is only one part of a diverse information diet.</p></div>
        </section>
        <section className="about-detail about-detail-data">
          <div><p className="eyebrow">DATA &amp; PRIVACY</p><h2>Runs in your browser</h2></div>
          <p>This prototype uses a fixed local article dataset and deterministic JavaScript rules. It has no account, application server, analytics service, live news feed, or AI recommender. Reading history, interest scores, and saved-story state are stored in this browser and can be cleared from My Analysis.</p>
        </section>
        <button className="button" onClick={() => navigate('home')}>Explore the Roles</button>
      </section>}
      {page === 'feed' && !user.mode && <section className="feed-section"><div className="section-heading"><div><p className="eyebrow">YOUR OWN PERSPECTIVE</p><h1>Build My Own Feed</h1></div></div><p>Start with a mix of news. As you read and save stories, discover how your interests shape your feed.</p><div className="actions"><button className="button" onClick={() => startFeed()}>Build My Own Feed</button><button className="button secondary" onClick={() => navigate('home')}>Explore a Persona</button></div></section>}
      {page === 'analysis' && <AnalysisPage user={scopedUser} articles={articles} categories={categories} bubble={bubble} scopeName={persona?.name || 'Personal Feed'} onBreak={() => navigate('break')} onReset={resetData} onRead={openArticle} />}
      {(page === 'break' || (page === 'feed' && user.mode)) && <section className={`feed-section${page === 'feed' && user.mode === 'persona' ? ' persona-feed-section' : ''}`} id="latest">
          {page === 'feed' && user.mode === 'persona' ? <>
            <div className="feed-persona-topbar"><button className="feed-persona-back" onClick={() => navigate('home')}><span aria-hidden="true">←</span> Back to Home</button><p className="article-count" aria-live="polite">Showing {Math.min(visibleCount, filteredFeed.length)} of {filteredFeed.length}</p></div>
            <div className="feed-persona-profile"><PersonaPortrait persona={persona} className="feed-persona-portrait" /><div className="feed-persona-copy"><p className="eyebrow">YOUR SELECTED PERSPECTIVE</p><h1>{persona?.name}</h1><p>{persona?.description}</p><ul className="persona-keywords" aria-label="Role interests">{persona?.keywords?.map(keyword => <li key={keyword}>{keyword}</li>)}</ul></div></div>
          </> : <div className="section-heading"><div><p className="eyebrow">{page === 'break' ? 'MAKE ROOM FOR NEW PERSPECTIVES' : 'RECOMMENDED FOR THIS PERSPECTIVE'}</p><h1>{title}</h1></div><p className="article-count" aria-live="polite">Showing {Math.min(visibleCount, filteredFeed.length)} of {filteredFeed.length}</p></div>}
          {page === 'feed' && user.mode === 'persona' && persona && <PersonaBubble key={persona.id} persona={persona} personas={personas} articles={articles} visibleArticles={filteredFeed.slice(0, visibleCount)} category={category} onSelect={startFeed} onBreak={() => navigate('break')} bubble={bubble}><button className="button secondary" onClick={() => startFeed()}>Build My Own Feed</button></PersonaBubble>}
          {page === 'feed' && user.mode !== 'persona' && <><div className="feed-context-row"><p>After 5 interactions, your top two interests receive about 70% of recommendations; other categories keep 30%.</p><div className="actions"><button className="button secondary" onClick={() => navigate('home')}>Explore a Persona</button></div></div><BubbleMeter bubble={bubble} scopeName="your personal feed" /></>}
          {page === 'break' && <div className="panel break-explanation"><p>{breakPersona ? `This feed moves beyond ${breakPersona.name}'s interests: ${breakPersona.categories.join(', ').toUpperCase()}. Explore categories that this role sees less often.` : user.readingHistory.length < 5 ? 'Start with a balanced mix of categories. Read at least 5 articles to explore recommendations shaped by your reading history.' : `You often read ${oftenRead.join(' and ').toUpperCase()} stories. Explore less-read categories such as ${lessRead.join(', ').toUpperCase()} too.`}</p><p>About 40% familiar interests, 40% less-read categories, and 20% other perspectives. Categories rotate in a stable order; when a group runs out, other stories fill the space.</p></div>}
          {page !== 'home' && <div className="category-filter" role="group" aria-label="Filter by category">{['All', ...categories].map(item => <button key={item} aria-pressed={category === item} onClick={() => { setCategory(item); setVisibleCount(STARTING_ARTICLES); }}>{item.toUpperCase()}</button>)}</div>}
          <div className="news-grid">{filteredFeed.slice(0, visibleCount).map(article => <NewsCard key={article.id} title={article.title} summary={article.summary} category={article.category} section={article.section} date={article.date} url={article.url} imageUrl={article.image_url} isSaved={user.savedArticleIds.includes(article.id)} onSave={() => saveArticle(article)} onRead={() => openArticle(article)} />)}</div>
          {!filteredFeed.length && <p>No articles in this category yet. Try All.</p>}
          {visibleCount < filteredFeed.length && <button className="show-more-button" onClick={() => setVisibleCount(count => count + 6)}>Load More</button>}
        </section>}
    </main>
  </div>;
}
