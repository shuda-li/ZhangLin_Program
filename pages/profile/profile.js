const {
  scenicSpots,
  activityNews,
  profileServices,
  userBadges,
  journeyTips,
  profileAiTips
} = require('../../data/site');
const {
  getActivityRegistrations,
  getFavoriteSpots,
  getRecentSpots,
  unregisterActivity
} = require('../../utils/storage');

var spotCoordMap = {
  'ship-museum': { lat: 23.4550, lng: 116.7805, name: '红头船文化展示点' },
  'port-ruins': { lat: 23.4535, lng: 116.7818, name: '古港遗址游览区' },
  'historic-arcade': { lat: 23.4562, lng: 116.7792, name: '侨乡古建筑群' },
  'overseas-memory': { lat: 23.4545, lng: 116.7800, name: '侨史记忆长廊' }
};

function getTagClass(tag) {
  if (tag.indexOf('亲子') >= 0 || tag.indexOf('家庭') >= 0 || tag.indexOf('研学') >= 0) return 'tag-family';
  if (tag.indexOf('拍照') >= 0 || tag.indexOf('摄影') >= 0) return 'tag-photo';
  if (tag.indexOf('夜') >= 0) return 'tag-night';
  if (tag.indexOf('打卡') >= 0 || tag.indexOf('热门') >= 0) return 'tag-hot';
  return '';
}

function enrichSpot(spot) {
  var full = scenicSpots.find(function(s) { return s.id === spot.id; });
  var tags = full ? (full.tags || []) : [];
  spot.tagList = tags.map(function(tag) {
    return { text: tag, cssClass: getTagClass(tag) };
  });
  return spot;
}

var BADGE_ICONS = {
  explorer: 'ui-icon-compass',
  photographer: 'ui-icon-pin',
  taste: 'ui-icon-leaf',
  scholar: 'ui-icon-book',
  traveler: 'ui-icon-route'
};

function computeBadges(spots, favs, acts) {
  return userBadges.map(function(b) {
    var unlocked;
    switch (b.id) {
      case 'explorer': unlocked = spots >= 3; break;
      case 'photographer': unlocked = favs >= 2; break;
      case 'taste': unlocked = acts >= 1; break;
      case 'scholar': unlocked = spots >= 4; break;
      case 'traveler': unlocked = spots >= 4 && acts >= 1 && favs >= 2; break;
      default: unlocked = false;
    }
    return Object.assign({}, b, { unlocked: unlocked, icon: BADGE_ICONS[b.id] || 'ui-icon-pin' });
  });
}

function computeRecentTimes(recentSpots) {
  var times = ['刚刚', '30分钟前', '1小时前', '2小时前', '3小时前', '昨天', '前天', '3天前', '1周前'];
  return recentSpots.map(function(spot, i) {
    return times[i] || times[times.length - 1];
  });
}

function computeReadProgresses(recentSpots) {
  var seeds = [45, 72, 88, 63, 95, 55, 80, 38];
  return recentSpots.map(function(spot, i) {
    return seeds[i % seeds.length];
  });
}

function computeAiRecs(recentSpots) {
  var allSpots = scenicSpots;
  return recentSpots.map(function(spot) {
    var others = allSpots.filter(function(s) { return s.id !== spot.id; });
    if (!others.length) return '';
    var rec = others[Math.floor(Math.random() * others.length)];
    return '推荐继续探索：' + rec.name;
  });
}

function computeCountdown(activity) {
  var now = new Date();
  var nowTs = now.getTime();
  if (!activity || !activity.date) return '';
  var dateStr = activity.date;
  var targetDate = null;
  if (dateStr.indexOf('每周六') >= 0) {
    var timeMatch = dateStr.match(/(\d+):(\d+)/);
    var h = timeMatch ? parseInt(timeMatch[1], 10) : 10;
    var m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    var dayOfWeek = now.getDay();
    var daysUntilSat = 6 - dayOfWeek;
    if (daysUntilSat < 0 || (daysUntilSat === 0 && now.getHours() >= h)) {
      daysUntilSat = daysUntilSat <= 0 ? 7 + daysUntilSat : daysUntilSat;
    }
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSat, h, m, 0);
  } else if (dateStr.indexOf('本月') >= 0) {
    var dayMatch = dateStr.match(/(\d+)\s*日/);
    var timeMatch2 = dateStr.match(/(\d+):(\d+)/);
    var targetDay = dayMatch ? parseInt(dayMatch[1], 10) : 25;
    var h2 = timeMatch2 ? parseInt(timeMatch2[1], 10) : 14;
    var m2 = timeMatch2 ? parseInt(timeMatch2[2], 10) : 0;
    var todayDay = now.getDate();
    if (targetDay < todayDay) return '已过期';
    targetDate = new Date(now.getFullYear(), now.getMonth(), targetDay, h2, m2, 0);
  } else if (dateStr.indexOf('节假日') >= 0 || dateStr.indexOf('持续进行') >= 0) {
    return '持续进行中';
  } else if (dateStr.indexOf('即将开启') >= 0) {
    return '即将开启';
  }
  if (!targetDate || targetDate.getTime() <= nowTs) return '即将开始';
  var diffMs = targetDate.getTime() - nowTs;
  var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  var diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (diffDays > 0) {
    return '距开始 ' + diffDays + '天' + (diffHours > 0 ? diffHours + '小时' : '');
  }
  return '距开始 ' + diffHours + '小时';
}

function computeFootprintMarkers(recentSpots, favSpots) {
  var seen = {};
  var markers = [];
  function addMarker(spot) {
    if (!spot || !spot.id || seen[spot.id]) return;
    var coord = spotCoordMap[spot.id];
    if (!coord) return;
    seen[spot.id] = true;
    markers.push({
      id: spot.id,
      latitude: coord.lat,
      longitude: coord.lng,
      width: 30,
      height: 30,
      title: coord.name
    });
  }
  recentSpots.forEach(addMarker);
  favSpots.forEach(addMarker);
  var centerLat = markers.length > 0 ? markers[0].latitude : 23.4548;
  var centerLng = markers.length > 0 ? markers[0].longitude : 116.7804;
  return { markers: markers, centerLat: centerLat, centerLng: centerLng, hasMarkers: markers.length > 0 };
}

function computeJourneySummary(spots, favs, acts) {
  var totalMemories = spots + favs + acts;
  var routesDone = spots >= 2 ? (spots >= 4 ? 3 : 2) : (spots >= 1 ? 1 : 0);
  var storiesRead = Math.min(spots * 6 + favs * 3, 36);
  return {
    year: new Date().getFullYear(),
    spotCount: spots,
    actCount: acts,
    favCount: favs,
    totalMemories: totalMemories,
    routesDone: routesDone,
    storiesRead: storiesRead,
    done: spots >= 2
  };
}

Page({
  onShareAppMessage() {
    return { title: '樟林古港 — 数字旅程中心：收藏景点、足迹与活动报名', path: '/pages/profile/profile' };
  },

  data: {
    journeyTips: journeyTips,
    profileServices: profileServices,
    favoriteSpots: [],
    recentSpots: [],
    registeredActivities: [],
    badges: [],
    userLevel: 1,
    userTitle: '初访古港',
    explorePercent: 0,
    totalSpots: scenicSpots.length,
    aiTip: profileAiTips[0],
    recentTimes: [],
    readProgresses: [],
    aiRecs: [],
    journeySummary: { year: 2026, spotCount: 0, actCount: 0, favCount: 0, totalMemories: 0, routesDone: 0, storiesRead: 0, done: false },
    footprintMarkers: [],
    footprintCenter: { lat: 23.4548, lng: 116.7804 },
    hasFootprint: false,
    weeklyNew: 0,
    profileStats: [],
    bannerOffset: 0,
    animShimmer: false,
    showBackTop: false
  },

  onShow() {
    this.refreshData();
    var self = this;
    setTimeout(function() { self.setData({ animShimmer: true }); }, 300);
  },

  onPullDownRefresh() {
    this.refreshData();
    var self = this;
    setTimeout(function() { self.setData({ animShimmer: true }); }, 300);
    wx.showToast({ title: '已刷新', icon: 'success', duration: 1000 });
    setTimeout(function() { wx.stopPullDownRefresh(); }, 1200);
  },

  refreshData() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
    var favoriteSpots = getFavoriteSpots().map(enrichSpot);
    var recentSpots = getRecentSpots().map(enrichSpot);
    var registeredActivities = getActivityRegistrations();
    var spots = recentSpots.length;
    var favs = favoriteSpots.length;
    var acts = registeredActivities.length;
    var totalSpots = scenicSpots.length;
    var badges = computeBadges(spots, favs, acts);
    var explorePercent = Math.min(Math.round((spots / totalSpots) * 100), 100);
    var level = spots >= 4 ? 3 : (spots >= 2 ? 2 : 1);
    var titles = ['初访古港', '古港行者', '文化旅者'];
    var scene = spots >= 4 ? 'full' : (spots >= 2 ? 'half' : 'less');
    var aiTip = profileAiTips.find(function(t) { return t.scene === scene; }) || profileAiTips[0];
    var recentTimes = computeRecentTimes(recentSpots);
    var readProgresses = computeReadProgresses(recentSpots);
    var aiRecs = computeAiRecs(recentSpots);
    var journeySummary = computeJourneySummary(spots, favs, acts);
    var footprint = computeFootprintMarkers(recentSpots, favoriteSpots);
    var weeklyNew = Math.min(spots, Math.max(0, Math.floor(Math.random() * 3) + (spots > 0 ? 1 : 0)));

    registeredActivities = registeredActivities.map(function(act) {
      var full = activityNews.find(function(a) { return a.id === act.id; });
      var countdown = computeCountdown(full || act);
      return Object.assign({}, act, { countdown: countdown });
    });

    this.setData({
      favoriteSpots: favoriteSpots,
      recentSpots: recentSpots,
      registeredActivities: registeredActivities,
      badges: badges,
      explorePercent: explorePercent,
      userLevel: level,
      userTitle: titles[level - 1] || '初访古港',
      aiTip: aiTip,
      recentTimes: recentTimes,
      readProgresses: readProgresses,
      aiRecs: aiRecs,
      journeySummary: journeySummary,
      footprintMarkers: footprint.markers,
      footprintCenter: { lat: footprint.centerLat, lng: footprint.centerLng },
      hasFootprint: footprint.hasMarkers,
      weeklyNew: weeklyNew,
      profileStats: [
        { label: '已浏览', value: '' + spots, icon: 'ui-icon-book', trend: weeklyNew > 0 ? '本周新增 ' + weeklyNew : '', target: 'recent-section' },
        { label: '已报名', value: '' + acts, icon: 'ui-icon-calendar', trend: acts > 0 ? '本月活跃中' : '', target: 'registration-section' },
        { label: '已收藏', value: '' + favs, icon: 'ui-icon-bookmark', trend: favs > 0 ? favs + ' 处心仪风物' : '', target: 'favorite-section' }
      ]
    });
  },

  handleStatTap(event) {
    var target = event.currentTarget.dataset.target;
    wx.pageScrollTo({ selector: '#' + target, duration: 300 });
  },

  handleBadgeTap(event) {
    var id = event.currentTarget.dataset.id;
    var badge = this.data.badges.find(function(b) { return b.id === id; });
    if (!badge) return;
    if (badge.unlocked) {
      wx.showToast({ title: badge.name + ' · ' + badge.desc, icon: 'none', duration: 2000 });
    } else {
      wx.showToast({ title: badge.desc + ' 即可解锁', icon: 'none', duration: 2000 });
    }
  },

  openService(event) {
    var type = event.currentTarget.dataset.type;
    var target = event.currentTarget.dataset.target;
    if (type === 'tab') { wx.switchTab({ url: target }); return; }
    wx.navigateTo({ url: target });
  },

  openSpot(event) {
    var id = event.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/scenic-detail/scenic-detail?id=' + id });
  },

  openActivity() {
    wx.navigateTo({ url: '/pages/activity/activity' });
  },

  unregister(event) {
    var id = event.currentTarget.dataset.id;
    unregisterActivity(id);
    wx.showToast({ title: '已取消报名', icon: 'none' });
    this.refreshData();
  },

  previewImage(event) {
    var src = event.currentTarget.dataset.src;
    var fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: src,
      success: function(res) {
        var tempPath = wx.env.USER_DATA_PATH + '/preview_' + Date.now() + '.jpg';
        fs.writeFile({ filePath: tempPath, data: res.data, success: function() {
          wx.previewImage({ current: tempPath, urls: [tempPath] });
        }});
      }
    });
  },

  onPageScroll(event) {
    var scrollTop = event.scrollTop;
    var bannerOffset = Math.min(scrollTop * 0.35, 80);
    this.setData({
      showBackTop: scrollTop > 400,
      bannerOffset: bannerOffset
    });
  },

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  }
});