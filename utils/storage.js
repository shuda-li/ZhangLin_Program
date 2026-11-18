const FAVORITE_SPOTS_KEY = 'favoriteSpots';
const RECENT_SPOTS_KEY = 'recentSpots';
const ACTIVITY_REGISTRATIONS_KEY = 'activityRegistrations';
const LIKED_SPOTS_KEY = 'likedSpots';
const SPOT_REVIEWS_KEY = 'spotReviews';

function getArray(key) {
  try { const value = wx.getStorageSync(key); return Array.isArray(value) ? value : []; }
  catch (_) { return []; }
}

function setArray(key, value) {
  try { wx.setStorageSync(key, value); }
  catch (_) { /* storage full, silently fail */ }
}

// ═══ 收藏 (已有) ═══
function toggleFavoriteSpot(spot) {
  const favorites = getArray(FAVORITE_SPOTS_KEY);
  const exists = favorites.find((item) => item.id === spot.id);
  const next = exists
    ? favorites.filter((item) => item.id !== spot.id)
    : [{ id: spot.id, name: spot.name, image: spot.image, summary: spot.summary }].concat(favorites).slice(0, 12);
  setArray(FAVORITE_SPOTS_KEY, next);
  return !exists;
}
function isFavoriteSpot(spotId) { return getArray(FAVORITE_SPOTS_KEY).some((item) => item.id === spotId); }
function getFavoriteSpots() { return getArray(FAVORITE_SPOTS_KEY); }

function addRecentSpot(spot) {
  const recent = getArray(RECENT_SPOTS_KEY).filter((item) => item.id !== spot.id);
  const next = [{ id: spot.id, name: spot.name, image: spot.image, summary: spot.summary, time: Date.now() }].concat(recent).slice(0, 8);
  setArray(RECENT_SPOTS_KEY, next);
  return next;
}
function getRecentSpots() { return getArray(RECENT_SPOTS_KEY); }

// ═══ 活动报名 (已有) ═══
function registerActivity(activity) {
  const registrations = getArray(ACTIVITY_REGISTRATIONS_KEY);
  const exists = registrations.find((item) => item.id === activity.id);
  if (exists) return { alreadyRegistered: true, registrations };
  const next = [{ id: activity.id, title: activity.title, date: activity.date, place: activity.place, image: activity.image }].concat(registrations).slice(0, 10);
  setArray(ACTIVITY_REGISTRATIONS_KEY, next);
  return { alreadyRegistered: false, registrations: next };
}
function getActivityRegistrations() { return getArray(ACTIVITY_REGISTRATIONS_KEY); }
function isRegisteredActivity(activityId) { return getArray(ACTIVITY_REGISTRATIONS_KEY).some((item) => item.id === activityId); }
function unregisterActivity(activityId) {
  const registrations = getArray(ACTIVITY_REGISTRATIONS_KEY).filter((item) => item.id !== activityId);
  setArray(ACTIVITY_REGISTRATIONS_KEY, registrations);
  return registrations;
}

// ═══ 点赞 (新增) ═══
function toggleLikeSpot(spotId) {
  const liked = getArray(LIKED_SPOTS_KEY);
  const idx = liked.indexOf(spotId);
  if (idx > -1) { liked.splice(idx, 1); } else { liked.unshift(spotId); }
  setArray(LIKED_SPOTS_KEY, liked.slice(0, 50));
  return { liked: idx === -1, count: liked.length };
}
function isLikedSpot(spotId) { return getArray(LIKED_SPOTS_KEY).includes(spotId); }

// ═══ 评价 (新增) ═══
function addReview(spotId, { nickname, rating, content, images }) {
  const reviews = getArray(SPOT_REVIEWS_KEY);
  const review = { id: Date.now().toString(36), spotId, nickname: nickname || '匿名游客', rating: Math.max(1, Math.min(5, rating)), content, images: (images || []).slice(0, 3), createdAt: new Date().toISOString(), likes: 0 };
  reviews.unshift(review);
  setArray(SPOT_REVIEWS_KEY, reviews.slice(0, 200));
  return getReviews(spotId);
}
function getReviews(spotId) { return getArray(SPOT_REVIEWS_KEY).filter(r => r.spotId === spotId); }
function likeReview(reviewId) {
  const reviews = getArray(SPOT_REVIEWS_KEY);
  const r = reviews.find(r => r.id === reviewId);
  if (r) { r.likes = (r.likes || 0) + 1; setArray(SPOT_REVIEWS_KEY, reviews); }
  return r ? r.likes : 0;
}

module.exports = {
  toggleFavoriteSpot, isFavoriteSpot, getFavoriteSpots,
  addRecentSpot, getRecentSpots,
  registerActivity, unregisterActivity, getActivityRegistrations, isRegisteredActivity,
  toggleLikeSpot, isLikedSpot,
  addReview, getReviews, likeReview
};
