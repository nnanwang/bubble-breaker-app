import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeArticles, getMixedFeed, getPersonaFeed, getPersonalizedFeed, getBreakBubbleFeed } from './recommendation.js';
import { calculateBubbleScore } from './bubbleScore.js';
import { initialUserData, recordOpen, toggleSave, loadUserData } from './storage.js';
import { personas } from '../data/personas.js';
const raw = JSON.parse(fs.readFileSync(new URL('../data/newsData.json', import.meta.url)));
const articles = normalizeArticles(raw);

test('mixed feed, stable persona ratios, and no mutation or duplicate articles', () => {
  const original = JSON.stringify(articles);
  assert.equal(new Set(getMixedFeed(articles).slice(0, 6).map(a => a.category)).size, 6);
  const firstIds = new Set();
  for (const persona of personas) {
    const feed = getPersonaFeed(articles, persona);
    assert.equal(feed.slice(0, 10).filter(a => persona.categories.includes(a.category)).length, 7);
    assert.equal(new Set(feed.map(a => a.id)).size, articles.length);
    assert.deepEqual(feed, getPersonaFeed(articles, persona));
    firstIds.add(feed[0].id);
  }
  assert.equal(firstIds.size, 4);
  assert.equal(JSON.stringify(articles), original);
});
test('bubble score uses last ten opens and waits for five', () => {
  const history = categories => categories.map(category => ({ category }));
  assert.equal(calculateBubbleScore(history(['ai','ai','ai','ai'])).score, null);
  for (const [values, score, label] of [
    [['ai','dev','design','product','crypto'],20,'Diverse'],
    [['ai','ai','dev','design','product'],40,'Balanced'],
    [['ai','ai','ai','dev','design'],60,'Concentrated'],
    [['ai','ai','ai','ai','dev'],80,'Strong Bubble'],
  ]) assert.deepEqual(calculateBubbleScore(history(values)), {score,label,topCategory:'ai'});
  assert.equal(calculateBubbleScore(history([...Array(20).fill('design'), ...Array(7).fill('ai'), ...Array(3).fill('dev')])).score,70);
});
test('opens, saves, unsaves, persistence, corrupt storage, and personalized feed', () => {
  let user = initialUserData();
  for (let i = 0; i < 5; i++) user = recordOpen(user, articles[0]);
  user = toggleSave(user, articles[0]);
  assert.equal(user.categoryScores.ai, 7);
  user = toggleSave(user, articles[0]);
  assert.equal(user.categoryScores.ai, 5);
  assert.equal(user.totalInteractions, 7);
  assert.equal(user.clickedArticleIds.length, 1);
  user = {...user, mode: 'persona', selectedPersona: personas[0].id, currentPage: 'analysis'};
  globalThis.localStorage = { getItem: () => JSON.stringify(user) };
  assert.deepEqual(loadUserData(articles, personas), user);
  globalThis.localStorage.getItem = () => '{bad json';
  assert.deepEqual(loadUserData(articles, personas), initialUserData());
  assert.equal(getPersonalizedFeed(articles,user.categoryScores,7).slice(0,10).filter(a=>a.category==='ai').length,7);
});
test('persona activity stays scoped and legacy activity migrates to personal', () => {
  let user = initialUserData();
  user = recordOpen(user, articles[0], 'ai-explorer');
  user = recordOpen(user, articles.find(article => article.category === 'founders'), 'startup-builder');
  user = toggleSave(user, articles[0], 'ai-explorer');
  assert.equal(user.activityByContext['ai-explorer'].readingHistory.length, 1);
  assert.equal(user.activityByContext['startup-builder'].readingHistory.length, 1);
  assert.equal(user.activityByContext['ai-explorer'].categoryScores.ai, 3);
  assert.equal(user.activityByContext['startup-builder'].categoryScores.ai, undefined);

  const legacySavedArticle = articles.find(article => article.category !== articles[0].category);
  const legacy = { ...initialUserData(), readingHistory: [{ id: articles[0].id, category: articles[0].category }], savedArticleIds: [legacySavedArticle.id] };
  globalThis.localStorage = { getItem: () => JSON.stringify(legacy) };
  const migrated = loadUserData(articles, personas);
  assert.equal(migrated.activityByContext.personal.readingHistory.length, 1);
  assert.equal(migrated.activityByContext.personal.categoryScores[legacySavedArticle.category], 2);
});
test('break feed introduces less-read categories with 40/40/20 mix', () => {
  const history = Array.from({length: 10}, () => ({category: 'ai'}));
  const feed = getBreakBubbleFeed(articles, {ai:10,dev:2}, history);
  const first = feed.slice(0,10);
  assert.equal(first.filter(a=>['ai','dev'].includes(a.category)).length,4);
  assert.equal(first.filter(a=>['crypto','design','devops','fintech'].includes(a.category)).length,4);
  assert.equal(new Set(feed.map(a=>a.id)).size,articles.length);
  assert.deepEqual(getBreakBubbleFeed(articles,{},[]),getMixedFeed(articles));
});
test('persona break feed uses the active role even without personal reading history', () => {
  const persona = personas[0];
  const categories = [...new Set(articles.map(article => article.category))];
  const lessRead = categories.filter(category => !persona.categories.includes(category)).sort().slice(0, 4);
  const remaining = categories.filter(category => !persona.categories.includes(category) && !lessRead.includes(category));
  const first = getBreakBubbleFeed(articles, {}, [], persona.categories).slice(0, 10);
  assert.equal(first.filter(article => persona.categories.includes(article.category)).length, 4);
  assert.equal(first.filter(article => lessRead.includes(article.category)).length, 4);
  assert.equal(first.filter(article => remaining.includes(article.category)).length, 2);
});
test('missing fields, unsafe URLs, duplicates and empty inputs', () => {
  assert.equal(normalizeArticles([{}, null, {id:'x',url:'javascript:alert(1)'},{id:'x'}]).length,2);
  assert.equal(normalizeArticles([{url:'javascript:alert(1)'}])[0].url,'');
  assert.deepEqual(getPersonaFeed([],personas[0]),[]);
  assert.equal(raw.length,500);
});
