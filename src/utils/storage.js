export const STORAGE_KEY = 'bubbleBreakerUserData';
const PERSONAL_CONTEXT = 'personal';

function emptyActivity() {
  return { readingHistory: [], categoryScores: {}, totalInteractions: 0 };
}

function scoreHistory(history, articlesById, savedArticleIds = []) {
  const categoryScores = {};
  history.forEach(item => { categoryScores[item.category] = (categoryScores[item.category] || 0) + 1; });
  savedArticleIds.forEach(id => {
    const category = articlesById.get(id)?.category;
    if (category) categoryScores[category] = (categoryScores[category] || 0) + 2;
  });
  return categoryScores;
}

function contextId(value) {
  return typeof value === 'string' && value ? value : PERSONAL_CONTEXT;
}

export function initialUserData() {
  return { mode: null, selectedPersona: null, clickedArticleIds: [], savedArticleIds: [], savedArticleContext: {}, readingHistory: [], categoryScores: {}, totalInteractions: 0, activityByContext: {}, currentPage: 'home' };
}

export function loadUserData(articles, personas) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored || typeof stored !== 'object') return initialUserData();
    const byId = new Map(articles.map(article => [article.id, article]));
    const savedArticleIds = [...new Set(Array.isArray(stored.savedArticleIds) ? stored.savedArticleIds : [])].filter(id => byId.has(id));
    const readingHistory = (Array.isArray(stored.readingHistory) ? stored.readingHistory : [])
      .filter(item => item && byId.has(item.id)).map(item => ({
        id: item.id,
        category: byId.get(item.id).category,
        openedAt: typeof item.openedAt === 'string' ? item.openedAt : '',
        contextId: contextId(item.contextId),
      }));
    const savedArticleContext = {};
    savedArticleIds.forEach(id => { savedArticleContext[id] = contextId(stored.savedArticleContext?.[id]); });
    const categoryScores = scoreHistory(readingHistory, byId, savedArticleIds);
    const totalInteractions = Math.max(readingHistory.length + savedArticleIds.length, Number.isSafeInteger(stored.totalInteractions) ? stored.totalInteractions : 0);
    const activityByContext = {};
    if (stored.activityByContext && typeof stored.activityByContext === 'object') {
      Object.entries(stored.activityByContext).forEach(([id, activity]) => {
        if (!activity || typeof activity !== 'object') return;
        const history = readingHistory.filter(item => item.contextId === id);
        const savedIds = savedArticleIds.filter(articleId => savedArticleContext[articleId] === id);
        activityByContext[id] = {
          readingHistory: history,
          categoryScores: scoreHistory(history, byId, savedIds),
          totalInteractions: Math.max(history.length + savedIds.length, Number.isSafeInteger(activity.totalInteractions) ? activity.totalInteractions : 0),
        };
      });
    }
    if (!Object.keys(activityByContext).length && (readingHistory.length || savedArticleIds.length)) {
      const history = readingHistory.map(item => ({ ...item, contextId: PERSONAL_CONTEXT }));
      activityByContext[PERSONAL_CONTEXT] = {
        readingHistory: history,
        categoryScores: scoreHistory(history, byId, savedArticleIds),
        totalInteractions,
      };
      readingHistory.splice(0, readingHistory.length, ...history);
      savedArticleIds.forEach(id => { savedArticleContext[id] = PERSONAL_CONTEXT; });
    }
    const selectedPersona = personas.some(persona => persona.id === stored.selectedPersona) ? stored.selectedPersona : null;
    const mode = stored.mode === 'personal' ? 'personal' : stored.mode === 'persona' && selectedPersona ? 'persona' : null;
    return { mode, selectedPersona, savedArticleIds, savedArticleContext, readingHistory, categoryScores, activityByContext,
      clickedArticleIds: [...new Set(readingHistory.map(item => item.id))],
      totalInteractions,
      currentPage: ['home', 'feed', 'analysis', 'break', 'about'].includes(stored.currentPage) ? stored.currentPage : 'home' };
  } catch { return initialUserData(); }
}

export function recordOpen(user, article, activeContext = PERSONAL_CONTEXT) {
  const scope = contextId(activeContext);
  const activity = user.activityByContext?.[scope] || emptyActivity();
  const entry = { id: article.id, category: article.category, openedAt: new Date().toISOString(), contextId: scope };
  return { ...user,
    clickedArticleIds: [...new Set([...user.clickedArticleIds, article.id])],
    readingHistory: [...user.readingHistory, entry],
    categoryScores: { ...user.categoryScores, [article.category]: (user.categoryScores[article.category] || 0) + 1 },
    totalInteractions: user.totalInteractions + 1,
    activityByContext: { ...user.activityByContext, [scope]: {
      ...activity,
      readingHistory: [...activity.readingHistory, entry],
      categoryScores: { ...activity.categoryScores, [article.category]: (activity.categoryScores[article.category] || 0) + 1 },
      totalInteractions: activity.totalInteractions + 1,
    } },
  };
}

export function toggleSave(user, article, activeContext = PERSONAL_CONTEXT) {
  const saved = user.savedArticleIds.includes(article.id);
  const scope = contextId(activeContext);
  const scoreScope = saved ? contextId(user.savedArticleContext?.[article.id]) : scope;
  const activityByContext = { ...user.activityByContext };
  const scoreActivity = activityByContext[scoreScope] || emptyActivity();
  const currentActivity = activityByContext[scope] || emptyActivity();
  activityByContext[scoreScope] = {
    ...scoreActivity,
    categoryScores: { ...scoreActivity.categoryScores, [article.category]: Math.max(0, (scoreActivity.categoryScores[article.category] || 0) + (saved ? -2 : 2)) },
  };
  activityByContext[scope] = {
    ...activityByContext[scope] || currentActivity,
    totalInteractions: currentActivity.totalInteractions + 1,
  };
  const savedArticleContext = { ...user.savedArticleContext };
  if (saved) delete savedArticleContext[article.id];
  else savedArticleContext[article.id] = scope;
  return { ...user,
    savedArticleIds: saved ? user.savedArticleIds.filter(id => id !== article.id) : [...user.savedArticleIds, article.id],
    savedArticleContext,
    categoryScores: { ...user.categoryScores, [article.category]: Math.max(0, (user.categoryScores[article.category] || 0) + (saved ? -2 : 2)) },
    totalInteractions: user.totalInteractions + 1,
    activityByContext,
  };
}
