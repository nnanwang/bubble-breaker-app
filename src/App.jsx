// useState lets this component remember how many articles should be visible.
import { useState } from "react";
// NewsCard is the reusable presentation component for one article.
import NewsCard from "./components/NewsCard.jsx";
// Vite reads this JSON file at build time and turns it into a JavaScript array.
import newsData from "./data/newsData.json";

// The feed initially shows two rows of three cards on a desktop screen.
const STARTING_ARTICLES = 6;

// App assembles the page header, introduction, article feed, and project description.
function App() {
  // visibleCount is the current limit; setVisibleCount updates it and re-renders App.
  const [visibleCount, setVisibleCount] = useState(STARTING_ARTICLES);
  // slice creates a new array containing only the articles currently allowed on screen.
  const visibleArticles = newsData.slice(0, visibleCount);

  // Add another batch of six articles whenever the user selects "Show more."
  function showMoreArticles() {
    // The callback form uses the latest state value, even if updates are queued.
    setVisibleCount((currentCount) => currentCount + 6);
  }

  // JSX below describes the HTML-like interface that React will render.
  return (
    // app-shell constrains the page width and contains every visible section.
    <div className="app-shell">
      {/* The header contains the home link and in-page navigation. */}
      <header className="site-header">
        {/* href="#top" scrolls back to the main element with id="top". */}
        <a className="brand" href="#top" aria-label="Bubble News home">
          {/* The short B is styled as the brand's speech-bubble mark. */}
          <span className="brand-mark">B</span>
          {/* This span holds the readable brand name beside the mark. */}
          <span>Bubble Breaker</span>
        </a>

        {/* aria-label gives assistive technology a name for this navigation group. */}
        <nav className="main-nav" aria-label="Main navigation">
          {/* Both links target sections on this same page. */}
          <a className="active" href="#latest">Latest</a>
          <a href="#about">About the project</a>
        </nav>
      </header>

      {/* id="top" is the destination used by the brand link. */}
      <main id="top">


        {/* This is the target of the header's Latest navigation link. */}
        <section className="feed-section" id="latest" aria-labelledby="latest-title">
          {/* Place the feed title and live article count on one heading row. */}
          <div className="section-heading">
            <div>
              <p className="eyebrow">RECOMMENDED FOR THIS PERSPECTIVE</p>
              <h2 id="latest-title">Inside the AI feed</h2>
            </div>
            {/* Math.min prevents the count from exceeding the amount of available data. */}
            <p className="article-count">
              Showing {Math.min(visibleCount, newsData.length)} of {newsData.length}
            </p>
          </div>

          {/* CSS turns this container into a responsive grid of article cards. */}
          <div className="news-grid">
            {/* map transforms each visible data object into one NewsCard component. */}
            {visibleArticles.map((article) => (
              <NewsCard
                // key gives React a stable identity for this item between renders.
                key={article.id}
                // The remaining props pass article fields down to NewsCard.
                title={article.title}
                summary={article.text}
                category={article.category}
                section={article.section}
                date={article.date}
                url={article.url}
                imageUrl={article.image_url}
              />
            ))}
          </div>

        </section>

        {/* The About link jumps here to explain planned project development. */}
        <section className="about-section" id="about">
          <p className="eyebrow">PROJECT DIRECTION</p>
          <h2>From a mixed feed to a visible recommendation bubble</h2>
          <p>
            In Class 3, this single-topic preview becomes a mixed feed with
            category filters. Later classes will record clicks, calculate
            category scores, personalize the feed, detect concentration, and
            offer a “Break the Bubble” experience.
          </p>
        </section>
      </main>
    </div>
  );
}

// Export App so main.jsx can import and render it.
export default App;
