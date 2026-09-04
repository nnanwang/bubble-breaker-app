// Each card uses local state for its saved status and image-error status.
import { useState } from "react";

// Convert a data value such as "artificial-intelligence" into a display label.
function formatCategory(category) {
  // Replace hyphens with spaces, then capitalize every character.
  return category.replaceAll("-", " ").toUpperCase();
}

// Convert the dataset's YYYY-MM-DD string into a readable English date.
function formatDate(date) {
  // Intl.DateTimeFormat handles locale-aware ordering and month names.
  return new Intl.DateTimeFormat("en", {
    // Show all four digits of the year.
    year: "numeric",
    // Use an abbreviated month such as "Jan".
    month: "short",
    // Show the calendar day as a number.
    day: "numeric",
  // Adding midnight makes the date explicit before the Date object is created.
  }).format(new Date(`${date}T00:00:00`));
}

// Destructure the article props so each value can be referenced by name below.
function NewsCard({ title, summary, category, section, date, url, imageUrl }) {
  // Track whether this individual card has been saved; new cards begin unsaved.
  const [isSaved, setIsSaved] = useState(false);
  // Track an image-loading failure so the illustrated fallback can be revealed.
  const [coverFailed, setCoverFailed] = useState(false);
  // Prefer the dataset image, or ask Microlink for the article's preview image.
  const articleCover =
    imageUrl ||
    // Encode the URL so special characters cannot break the Microlink query string.
    `https://api.microlink.io/?url=${encodeURIComponent(url)}&embed=image.url`;

  // Reverse this card's saved state each time its button is selected.
  function toggleSaved() {
    // The callback receives the most recent state and returns its opposite.
    setIsSaved((currentValue) => !currentValue);
  }

  // Render one self-contained article card.
  return (
    <article className="news-card">
      {/* This visual is decorative because the title already describes the story. */}
      <div className="card-visual" aria-hidden="true">
        {/* Stop rendering a broken image after its error event has fired. */}
        {!coverFailed && (
          <img
            // This class makes the image fill and crop to the visual area.
            className="article-cover"
            // articleCover contains either a supplied image or a generated preview URL.
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
        {/* Add the visible class only when the cover image could not load. */}
        <div className={`cover-fallback ${coverFailed ? "visible" : ""}`}>

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

        </div>

        {/* h3 fits beneath the page h1 and feed-section h2 heading hierarchy. */}
        <h3>{title}</h3>
        <p className="summary">{summary}</p>

        {/* The footer places the publication date beside the source link. */}
        <div className="card-footer">
          {/* dateTime retains the machine-readable date while the text is formatted. */}
          <time dateTime={date}>{formatDate(date)}</time>
          {/* Open the source separately and omit referrer/opener information. */}
          <a href={url} target="_blank" rel="noreferrer">
            Read article <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}

// Export the component for use in App.jsx.
export default NewsCard;
