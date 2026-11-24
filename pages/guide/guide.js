const { routePlans, nearbyServices, cultureAiQA } = require('../../data/site');
const { chatWithAI } = require('../../utils/ai-llm');
const nav = require('../../utils/navigate');

function getAiTip(hour) {
  if (hour >= 5 && hour < 10) {
    return { icon: 'ui-icon-sun', text: '清晨古港光影柔和，推荐"人文摄影打卡线"，日出至上午是拍摄建筑细节的黄金时段。' };
  }
  if (hour >= 10 && hour < 14) {
    return { icon: 'ui-icon-walk', text: '上午游客较少，推荐优先游览侨乡建筑群和红头船展示点，体验更从容。' };
  }
  if (hour >= 14 && hour < 17) {
    return { icon: 'ui-icon-sun', text: '下午光线温暖，适合古街漫步与工夫茶体验，"在地风味寻访线"正是好时候。' };
  }
  if (hour >= 17 && hour < 20) {
    return { icon: 'ui-icon-sun', text: '黄昏至傍晚是古港最美时刻，推荐切换"古港夜游光影线"，建筑灯光与夕阳同框。' };
  }
  return { icon: 'ui-icon-moon', text: '夜间古港氛围静谧，适合漫步古街感受灯影夜景，或在茶空间结束一天的旅程。' };
}

var SERVICE_ICONS = [
  'ui-icon-pin', 'ui-icon-route', 'ui-icon-leaf',
  'ui-icon-user', 'ui-icon-book', 'ui-icon-grid'
];

function getRouteMapData(route) {
  var baseLat = 23.461;
  var baseLng = 116.780;
  var stops = route.stops || [];
  var markers = stops.map(function(s, i) {
    return {
      id: i,
      latitude: baseLat + i * 0.0008,
      longitude: baseLng + i * 0.0006,
      width: 30,
      height: 30,
      title: s.title,
      callout: { content: s.title, padding: 6, borderRadius: 6, display: 'BYCLICK', bgColor: '#8b3a1a', color: '#fff' },
      label: { content: (i + 1).toString(), color: '#fff', fontSize: 12 }
    };
  });
  var points = markers.map(function(m) {
    return { latitude: m.latitude, longitude: m.longitude };
  });
  return { markers: markers, polyline: [{ points: points, color: '#c89050', width: 4, dottedLine: false, arrowLine: true }] };
}

function getAiResponse(question) {
  var lowerQuestion = question.toLowerCase();
  for (var i = 0; i < cultureAiQA.length; i++) {
    var qa = cultureAiQA[i];
    var keywords = qa.keywords || [];
    var matched = keywords.some(function(k) {
      return lowerQuestion.includes(k.toLowerCase());
    });
    if (matched || lowerQuestion.includes(qa.question.toLowerCase())) {
      return qa.answer;
    }
  }
  return '阿樟暂时还不太了解这一点，你可以去小程序的其他页面看看，或者咨询现场工作人员。';
}

Page({
  onShareAppMessage() {
    return { title: '樟林古港 — 全域智慧导览，8条主题路线随心选', path: '/pages/guide/guide' };
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    var app = getApp();
    var routeId = app.globalData.activeRouteId;
    var activeRoute = this.data.activeRoute;
    if (routeId) {
      activeRoute = this.data.routePlans.find(function(r) { return r.id === routeId; });
      app.globalData.activeRouteId = null;
    }
    if (activeRoute) {
      var mapData = getRouteMapData(activeRoute);
      this.setData({
        activeRouteId: activeRoute.id,
        activeRoute: activeRoute,
        mapMarkers: mapData.markers,
        mapPolyline: mapData.polyline,
        stopMarkers: mapData.markers
      });
    }
  },

  data: {
    routePlans: routePlans,
    nearbyServices: nearbyServices.map(function(item, index) {
      return Object.assign({}, item, { icon: SERVICE_ICONS[index % SERVICE_ICONS.length] });
    }),
    activeRouteId: (routePlans && routePlans[0]) ? routePlans[0].id : '',
    activeRoute: routePlans[0],
    aiTip: getAiTip(new Date().getHours()),
    mapLat: 23.461,
    mapLng: 116.780,
    showLocation: false,
    mapMarkers: [],
    mapPolyline: [],
    stopMarkers: [],
    showStopDetail: false,
    detailStop: null,
    currentStopIndex: 0,
    stopCommentId: '',
    stopPanelHeight: 0,
    stopExpanded: false,
    stopDragging: false,
    stopSnapping: false,
    travelTips: [
      '优先选择上午时段进入古港遗址与建筑片区，步行体验更舒适。',
      '首次到访建议从红头船文化展示点开始，先建立整体文化认知。',
      '如为亲子出行，可优先选择研学体验线，内容更集中也更易理解。',
      '夜游线路建议携带便携光源，注意古街部分路段照明较暗。',
      '摄影爱好者推荐清晨或黄昏时段，光线角度最适合出片。'
    ],
    showAiChat: false,
    chatMessages: [],
    inputMessage: '',
    scrollToId: ''
  },

  switchRoute(event) {
    var id = event.currentTarget.dataset.id;
    var activeRoute = this.data.routePlans.find(function(r) { return r.id === id; });
    var mapData = getRouteMapData(activeRoute);
    this.setData({
      activeRouteId: id,
      activeRoute: activeRoute,
      mapMarkers: mapData.markers,
      mapPolyline: mapData.polyline,
      stopMarkers: mapData.markers,
      showStopDetail: false
    });
  },

  onMarkerTap(event) {
    var markerId = event.detail.markerId;
    var stop = this.data.activeRoute.stops[markerId];
    if (stop) {
      var m = this.computeStopMetrics();
      this.setData({
        showStopDetail: true,
        detailStop: stop,
        currentStopIndex: markerId,
        stopCommentId: this.data.activeRouteId + '-' + markerId,
        stopPanelHeight: m.half,
        stopExpanded: false,
        stopDragging: false,
        stopSnapping: false
      });
    }
  },

  showStopDetailPopup(event) {
    var index = parseInt(event.currentTarget.dataset.index);
    var stop = this.data.activeRoute.stops[index];
    if (stop) {
      var m = this.computeStopMetrics();
      this.setData({
        showStopDetail: true,
        detailStop: stop,
        currentStopIndex: index,
        stopCommentId: this.data.activeRouteId + '-' + index,
        stopPanelHeight: m.half,
        stopExpanded: false,
        stopDragging: false,
        stopSnapping: false
      });
    }
  },

  closeStopDetail() {
    if (this._stopSnapTimer) { clearTimeout(this._stopSnapTimer); this._stopSnapTimer = null; }
    this.setData({
      showStopDetail: false,
      detailStop: null,
      stopCommentId: '',
      stopDragging: false,
      stopSnapping: false
    });
  },

  computeStopMetrics() {
    var windowHeight = 0;
    try {
      var sys = wx.getSystemInfoSync();
      windowHeight = sys.windowHeight || 0;
    } catch (e) {
      windowHeight = 0;
    }
    if (!windowHeight) windowHeight = 667;
    var full = windowHeight;
    var half = Math.max(280, Math.round(windowHeight * 0.72));
    this._stopMetrics = { half: half, full: full };
    return { half: half, full: full };
  },

  onStopTouchStart(e) {
    var t = (e.touches && e.touches[0]) || {};
    this._stopStartY = t.clientY || 0;
    this._stopStartH = this.data.stopPanelHeight;
    if (this._stopSnapTimer) { clearTimeout(this._stopSnapTimer); this._stopSnapTimer = null; }
    this.setData({ stopDragging: true, stopSnapping: false });
  },

  onStopTouchMove(e) {
    if (!this.data.stopDragging || !this._stopMetrics) return;
    var t = (e.touches && e.touches[0]) || {};
    var m = this._stopMetrics;
    var h = this._stopStartH + (this._stopStartY - (t.clientY || 0));
    h = Math.max(m.half * 0.62, Math.min(h, m.full));
    this.setData({ stopPanelHeight: Math.round(h) });
  },

  onStopTouchEnd() {
    if (!this.data.stopDragging || !this._stopMetrics) return;
    var m = this._stopMetrics;
    var cur = this.data.stopPanelHeight;
    var expandLine = m.half + (m.full - m.half) * 0.4;
    var height, expanded;
    if (cur >= expandLine) {
      height = m.full; expanded = true;
    } else if (cur <= m.half * 0.7) {
      if (this.data.stopExpanded) {
        height = m.half; expanded = false;
      } else {
        this.closeStopDetail();
        return;
      }
    } else if (this.data.stopExpanded) {
      height = m.full; expanded = true;
    } else {
      height = m.half; expanded = false;
    }
    var that = this;
    this.setData({
      stopDragging: false,
      stopPanelHeight: height,
      stopExpanded: expanded,
      stopSnapping: true
    });
    if (this._stopSnapTimer) clearTimeout(this._stopSnapTimer);
    this._stopSnapTimer = setTimeout(function () {
      that.setData({ stopSnapping: false });
      that._stopSnapTimer = null;
    }, 320);
  },

  onResize() {
    if (this.data.showStopDetail) {
      var m = this.computeStopMetrics();
      this.setData({ stopPanelHeight: this.data.stopExpanded ? m.full : m.half });
    }
  },

  onShowLocation() {
    var that = this;

    // 先确认定位权限状态，避免直接 moveToLocation 静默失败
    wx.getSetting({
      success: function(settingRes) {
        var authorized = settingRes.authSetting['scope.userLocation'];
        if (authorized === false) {
          // 用户曾拒绝授权，引导去设置页开启
          wx.showModal({
            title: '需要定位权限',
            content: '定位功能需要获取你的位置权限，请在设置中开启。',
            confirmText: '去设置',
            success: function(modalRes) {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: function(openRes) {
                    if (openRes.authSetting['scope.userLocation']) {
                      that.locateAndMove();
                    }
                  }
                });
              }
            }
          });
          return;
        }
        // 已授权或未询问过，直接定位
        that.locateAndMove();
      },
      fail: function() {
        that.locateAndMove();
      }
    });
  },

  // 获取当前位置并把地图移动到该处
  locateAndMove() {
    var that = this;
    wx.showLoading({ title: '定位中...' });

    wx.getLocation({
      type: 'gcj02',
      success: function(loc) {
        wx.hideLoading();
        that.setData({
          mapLat: loc.latitude,
          mapLng: loc.longitude,
          showLocation: true
        });
        // 坐标系一致后移动视野
        var mapCtx = wx.createMapContext('guideMap', that);
        mapCtx.moveToLocation();
      },
      fail: function(err) {
        wx.hideLoading();
        var msg = '定位失败，请检查是否开启位置权限';
        if (err && err.errMsg && err.errMsg.indexOf('auth') !== -1) {
          msg = '未获得定位授权，请在设置中开启位置权限';
        }
        wx.showToast({ title: msg, icon: 'none', duration: 2000 });
      }
    });
  },

  startVoiceGuide() {
    wx.showToast({ title: '语音讲解加载中...', icon: 'loading', duration: 800 });
    var that = this;
    setTimeout(function() {
      wx.showModal({
        title: '语音讲解',
        content: '正在为你播放「' + that.data.activeRoute.name + '」的全程语音导览。在完整版中将支持潮汕话、普通话双语切换，并可分段收听各点位讲解。',
        showCancel: false,
        confirmText: '好的'
      });
    }, 900);
  },

  openAiChat() {
    nav.go('/pages/ai-chat/ai-chat');
  },

  closeAiChat() {
    this.setData({ showAiChat: false });
  },

  onInputChange(event) {
    this.setData({ inputMessage: event.detail.value });
  },

  sendMessage() {
    var message = this.data.inputMessage.trim();
    if (!message) {
      return;
    }
    var newId = Date.now().toString();
    var userMessage = { id: newId, type: 'user', content: message };
    var currentMessages = this.data.chatMessages.concat([userMessage]);
    this.setData({
      chatMessages: currentMessages,
      inputMessage: '',
      scrollToId: 'msg-' + newId
    });
    
    var that = this;
    var loadingId = (Date.now() + 1).toString();
    var loadingMessage = { id: loadingId, type: 'ai', content: '正在思考中...', isLoading: true };
    that.setData({
      chatMessages: currentMessages.concat([loadingMessage]),
      scrollToId: 'msg-' + loadingId
    });
    
    chatWithAI(currentMessages.slice(0, -1), message, function(toolName, args) {
      var toolTip = '';
      if (toolName === 'get_weather') {
        toolTip = '正在查询' + args.city + '的天气...';
      } else if (toolName === 'search_web') {
        toolTip = '正在搜索"' + args.query + '"...';
      }
      if (toolTip) {
        that.setData({
          chatMessages: currentMessages.concat([userMessage, { id: loadingId, type: 'ai', content: toolTip, isLoading: true }]),
          scrollToId: 'msg-' + loadingId
        });
      }
    }).then(function(result) {
      var aiMessage = { 
        id: (Date.now() + 2).toString(), 
        type: 'ai', 
        content: result.content,
        toolCalls: result.toolCalls
      };
      that.setData({
        chatMessages: currentMessages.concat([userMessage, aiMessage]),
        scrollToId: 'msg-' + aiMessage.id
      });
    }).catch(function(error) {
      console.error('AI对话出错:', error);
      var errorMessage = { 
        id: (Date.now() + 2).toString(), 
        type: 'ai', 
        content: '抱歉，阿樟暂时遇到了一点问题。请稍后再试，或者咨询现场工作人员。'
      };
      that.setData({
        chatMessages: currentMessages.concat([userMessage, errorMessage]),
        scrollToId: 'msg-' + errorMessage.id
      });
    });
  },

  previewImage(event) {
    var src = event.currentTarget.dataset.src;
    var fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: src,
      success: function(res) {
        var tempPath = wx.env.USER_DATA_PATH + '/preview_' + Date.now() + '.jpg';
        fs.writeFile({
          filePath: tempPath,
          data: res.data,
          success: function() {
            wx.previewImage({ current: tempPath, urls: [tempPath] });
          }
        });
      }
    });
  },

  onPageScroll(event) {
    this.setData({ showBackTop: event.scrollTop > 400 });
  },

  scrollToRouteComments() {
    wx.pageScrollTo({ selector: '#routeComments', offset: -16, duration: 320 });
  },

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  onUnload() {
    if (this._stopSnapTimer) { clearTimeout(this._stopSnapTimer); this._stopSnapTimer = null; }
  }
});
