// Only image errors are local; App owns the persistent saved status.
import { useState } from "react";

// Convert a data value such as "artificial-intelligence" into a display label.
function formatCategory(category) {
  // Replace hyphens with spaces, then capitalize every character.
  return (category || 'uncategorized').replaceAll("-", " ").toUpperCase();
}

// Convert the dataset's YYYY-MM-DD string into a readable English date.
function formatDate(date) {
  if (!date || Number.isNaN(new Date(date).getTime())) return 'Date unavailable';
  // Intl.DateTimeFormat handles locale-aware ordering and month names.
  return new Intl.DateTimeFormat("en", {
    // Show all four digits of the year.
    year: "numeric",
    timeZone: "UTC",
    // Use an abbreviated month such as "Jan".
    month: "short",
    // Show the calendar day as a number.
    day: "numeric",
  // UTC keeps a date-only value from shifting to the previous day.
  }).format(new Date(date));
}

// Destructure the article props so each value can be referenced by name below.
function NewsCard({ title, summary, category, section, date, url, imageUrl, isSaved, onSave, onRead }) {
  // Saved status belongs to App so it survives navigation and refreshes.
  const [coverFailed, setCoverFailed] = useState(false);
  // Keep the original article-preview service for data without an image field.
  const articleCover = imageUrl || (url
    ? `https://api.microlink.io/?url=${encodeURIComponent(url)}&embed=image.url`
    : '');

  // Render one self-contained article card.
  return (
    <article className="news-card">
      {/* This visual is decorative because the title already describes the story. */}
      <div className="card-visual" aria-hidden="true">
        {/* Stop rendering a broken image after its error event has fired. */}
        {articleCover && !coverFailed && (
          <img
            // This class makes the image fill and crop to the visual area.
            className="article-cover"
            // Prefer a supplied image, otherwise request the article's preview.
            src={articleCover}
            // An empty alt avoids repeating the visible article title.
            alt=""
            // Lazy loading delays off-screen images to improve initial performance.
            loading="lazy"
            // Avoid sending the current page URL as a referrer to the image host.
            referrerPolicy="no-referrer"
            // If loading fails, update state so React displays the fallback design.
            onError={() => setCoverFailed(true)}
          />
        )}
        {/* Keep the illustration behind the image during loading and on failure. */}
        <div className="cover-fallback visible">

          {/* These empty spans become decorative circles through CSS. */}
          <span className="visual-bubble visual-bubble-one" />
          <span className="visual-bubble visual-bubble-two" />
          <span className="visual-letter">{title.charAt(0)}</span>
        </div>
      </div>
      {/* The body holds article metadata, text, actions, and the outbound link. */}
      <div className="card-body">
        {/* Keep labels and the save control together at the top of the card. */}
        <div className="card-top-row">
          <div className="card-labels">
            <span className="category-tag">{formatCategory(category)}</span>
            <span className="section-label">{section}</span>
          </div>
          <button className={`save-button ${isSaved ? 'saved' : ''}`} aria-pressed={isSaved} onClick={onSave} aria-label={`${isSaved ? 'Unsave' : 'Save'} ${title}`}>
            <span aria-hidden="true">{isSaved ? '✓' : '+'}</span>{isSaved ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* h3 fits beneath the page h1 and feed-section h2 heading hierarchy. */}
        <h3>{title}</h3>
        <p className="summary">{summary}</p>

        {/* The footer places the publication date beside the source link. */}
        <div className="card-footer">
          {/* dateTime retains the machine-readable date while the text is formatted. */}
          <time dateTime={date}>{formatDate(date)}</time>
          {/* Open the source separately and omit referrer/opener information. */}
          {url ? <a href={url} target="_blank" rel="noopener noreferrer" onClick={onRead} aria-label={`Read ${title} (opens in a new tab)`}>
            Read article <span aria-hidden="true">↗</span>
          </a> : <span>Source unavailable</span>}
        </div>
      </div>
    </article>
  );
}

// Export the component for use in App.jsx.
export default NewsCard;
