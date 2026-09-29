// Normalize a copy; the original classroom JSON stays unchanged.
export function normalizeArticles(data) {
  const seen = new Set();
  return data.filter(item => item && typeof item === 'object').map((item, index) => ({
    ...item,
    id: String(item.id || item.url || `article-${index}`),
    title: String(item.title || 'Untitled article'),
    summary: String(item.summary || item.text || 'No summary available.'),
    category: String(item.category || 'uncategorized'),
    url: safeUrl(item.url),
    image_url: safeUrl(item.image_url),
  })).filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

// Round-robin categories so the source file's category grouping cannot dominate.
export function getMixedFeed(articles) {
  const groups = {};
  articles.forEach(article => (groups[article.category] ||= []).push(article));
  const result = [];
  const queues = Object.values(groups);
  for (let i = 0; queues.some(group => i < group.length); i++) {
    queues.forEach(group => { if (group[i]) result.push(group[i]); });
  }
  return result;
}

// Consume separate queues in a repeating pattern, without randomness or duplicates.
function blend(groups, pattern) {
  const queues = groups.map(getMixedFeed);
  const result = [];
  while (queues.some(queue => queue.length)) {
    for (const slot of pattern) {
      const queue = queues[slot].length ? queues[slot] : queues.find(group => group.length);
      if (queue) result.push(queue.shift());
    }
  }
  return result;
}

export function getPersonaFeed(articles, persona) {
  const interests = persona?.categories || [];
  return blend([
    articles.filter(article => interests.includes(article.category)),
    articles.filter(article => !interests.includes(article.category)),
  ], [0, 0, 1, 0, 0, 1, 0, 0, 1, 0]);
}

export function getPersonalizedFeed(articles, scores = {}, totalInteractions = 0) {
  const interests = Object.keys(scores).filter(category => scores[category] > 0)
    .sort((a, b) => scores[b] - scores[a] || a.localeCompare(b)).slice(0, 2);
  return totalInteractions < 5 || !interests.length ? getMixedFeed(articles)
    : getPersonaFeed(articles, { categories: interests });
}

export function getBreakBubbleFeed(articles, scores = {}, history = [], personaCategories = null) {
  const hasPersonaContext = Array.isArray(personaCategories) && personaCategories.length > 0;
  if (!hasPersonaContext && history.length < 5) return getMixedFeed(articles);
  const categories = [...new Set(articles.map(article => article.category))];
  const interests = hasPersonaContext
    ? categories.filter(category => personaCategories.includes(category))
    : [...categories].sort((a, b) => (scores[b] || 0) - (scores[a] || 0) || a.localeCompare(b)).slice(0, 2);
  const counts = Object.fromEntries(categories.map(category => [category, history.filter(item => item.category === category).length]));
  const lessRead = categories.filter(category => !interests.includes(category))
    .sort((a, b) => counts[a] - counts[b] || a.localeCompare(b)).slice(0, 4);
  // 40% familiar, 40% less read, 20% other categories; stable category rotation.
  return blend([
    articles.filter(article => interests.includes(article.category)),
    articles.filter(article => lessRead.includes(article.category)),
    articles.filter(article => !interests.includes(article.category) && !lessRead.includes(article.category)),
  ], [0, 1, 2, 0, 1]);
}
