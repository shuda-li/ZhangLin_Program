const express = require('express');
const { stats, scenicSpots, activities, users } = require('../data/mockData');
const { authenticate, staffOnly } = require('../middleware/auth');

const router = express.Router();

// 统计数据仅对管理员/讲解员开放
router.use(authenticate, staffOnly);

router.get('/overview', (req, res) => {
  const overviewStats = {
    totalScenicSpots: scenicSpots.length,
    totalActivities: activities.length,
    totalUsers: users.length,
    totalVisits: scenicSpots.reduce((sum, spot) => sum + spot.visits, 0),
    todayVisits: Math.floor(Math.random() * 200) + 50,
    weeklyVisits: [856, 723, 987, 1056, 1234, 1567, 1342],
    monthlyVisits: [4520, 5120, 6350, 7890, 8230, 9150]
  };
  
  res.json({
    code: 200,
    data: overviewStats
  });
});

router.get('/activities', (req, res) => {
  const ongoing = activities.filter(a => a.status === 'ongoing').length;
  const upcoming = activities.filter(a => a.status === 'upcoming').length;
  const limited = activities.filter(a => a.status === 'limited').length;
  const totalEnrollments = activities.reduce((sum, a) => sum + a.enrolled, 0);
  
  res.json({
    code: 200,
    data: {
      totalActivities: activities.length,
      ongoing,
      upcoming,
      limited,
      totalEnrollments,
      byType: [
        { type: '导览讲解', value: activities.filter(a => a.type === 'guided-tour').length },
        { type: '体验课程', value: activities.filter(a => a.type === 'workshop').length },
        { type: '夜游活动', value: activities.filter(a => a.type === 'night-tour').length },
        { type: '研学活动', value: activities.filter(a => a.type === 'study-tour').length },
        { type: '文艺表演', value: activities.filter(a => a.type === 'performance').length },
        { type: '赛事活动', value: activities.filter(a => a.type === 'competition').length }
      ]
    }
  });
});

router.get('/users', (req, res) => {
  const activeUsers = users.filter(u => u.status === 'active').length;
  const admins = users.filter(u => u.role === 'admin').length;
  const guides = users.filter(u => u.role === 'guide').length;
  const visitors = users.filter(u => u.role === 'visitor').length;
  
  res.json({
    code: 200,
    data: {
      totalUsers: users.length,
      activeUsers,
      newUsers: Math.floor(Math.random() * 20) + 5,
      byRole: [
        { role: '管理员', value: admins },
        { role: '讲解员', value: guides },
        { role: '普通用户', value: visitors }
      ]
    }
  });
});

router.get('/scenic', (req, res) => {
  const visitsByCategory = scenicSpots.reduce((acc, spot) => {
    acc[spot.category] = (acc[spot.category] || 0) + spot.visits;
    return acc;
  }, {});
  
  const topSpots = [...scenicSpots]
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5)
    .map(s => ({ name: s.name, visits: s.visits }));
  
  res.json({
    code: 200,
    data: {
      totalVisits: scenicSpots.reduce((sum, spot) => sum + spot.visits, 0),
      openSpots: scenicSpots.filter(s => s.status === 'open').length,
      visitsByCategory: Object.entries(visitsByCategory).map(([category, visits]) => ({ category, visits })),
      topSpots
    }
  });
});

router.get('/daily', (req, res) => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  
  const dailyData = days.map((day, index) => ({
    day,
    visits: index === todayIndex ? Math.floor(Math.random() * 300) + 100 : Math.floor(Math.random() * 200) + 50,
    activities: Math.floor(Math.random() * 5) + 1,
    users: Math.floor(Math.random() * 50) + 10
  }));
  
  res.json({
    code: 200,
    data: dailyData
  });
});

module.exports = router;