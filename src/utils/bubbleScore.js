export function getCategoryDistribution(history = []) {
  return history.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});
}

export function calculateBubbleScore(history = []) {
  // Only the latest ten opens count. Reopening an article is another reading event.
  const recent = history.slice(-10);
  if (recent.length < 5) return { score: null, label: 'Not enough reading', topCategory: null };
  const distribution = getCategoryDistribution(recent);
  const topCategory = Object.keys(distribution).sort((a, b) => distribution[b] - distribution[a])[0];
  const score = Math.round(distribution[topCategory] / recent.length * 100);
  const label = score < 40 ? 'Diverse' : score < 60 ? 'Balanced' : score < 75 ? 'Concentrated' : 'Strong Bubble';
  return { score, label, topCategory };
}
