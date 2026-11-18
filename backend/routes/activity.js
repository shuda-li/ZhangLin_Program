const express = require('express');
const { activities, activityEnrollments } = require('../data/mockData');
const { authenticate, staffOnly } = require('../middleware/auth');

const router = express.Router();

const writeAuth = [authenticate, staffOnly];

router.get('/', (req, res) => {
  const { page = 1, limit = 10, status, type } = req.query;
  
  let filtered = [...activities];
  
  if (status) {
    filtered = filtered.filter(a => a.status === status);
  }
  
  if (type) {
    filtered = filtered.filter(a => a.type === type);
  }
  
  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const data = filtered.slice(start, end);
  
  res.json({
    code: 200,
    data: {
      list: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const activity = activities.find(a => a.id === id);
  
  if (!activity) {
    return res.status(404).json({ code: 404, message: '活动不存在' });
  }
  
  res.json({
    code: 200,
    data: activity
  });
});

router.post('/', writeAuth, (req, res) => {
  const { title, description, place, image, capacity, startTime, endTime, type } = req.body;
  
  if (!title || !description || !place || !startTime || !endTime) {
    return res.status(400).json({ code: 400, message: '请填写必填字段' });
  }
  
  const newActivity = {
    id: String(Date.now()),
    title,
    description,
    place,
    image: image || '',
    capacity: parseInt(capacity) || 30,
    enrolled: 0,
    startTime,
    endTime,
    type: type || 'activity',
    status: 'upcoming',
    createdAt: new Date().toISOString().split('T')[0]
  };
  
  activities.push(newActivity);
  
  res.json({
    code: 200,
    message: '活动创建成功',
    data: newActivity
  });
});

router.put('/:id', writeAuth, (req, res) => {
  const { id } = req.params;
  const index = activities.findIndex(a => a.id === id);
  
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '活动不存在' });
  }
  
  const updateData = req.body;
  activities[index] = { ...activities[index], ...updateData };
  
  res.json({
    code: 200,
    message: '活动更新成功',
    data: activities[index]
  });
});

router.delete('/:id', writeAuth, (req, res) => {
  const { id } = req.params;
  const index = activities.findIndex(a => a.id === id);
  
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '活动不存在' });
  }
  
  activities.splice(index, 1);
  
  res.json({
    code: 200,
    message: '活动删除成功'
  });
});

router.post('/:id/enroll', authenticate, (req, res) => {
  const { id } = req.params;
  // 用户身份以 token 为准，忽略客户端传入的 userId，防止冒名报名
  const userId = req.user.id;

  const activity = activities.find(a => a.id === id);
  if (!activity) {
    return res.status(404).json({ code: 404, message: '活动不存在' });
  }

  if (activity.enrolled >= activity.capacity) {
    return res.status(400).json({ code: 400, message: '活动已满' });
  }

  const existingEnrollment = activityEnrollments.find(e => e.activityId === id && e.userId === userId);
  if (existingEnrollment) {
    return res.status(400).json({ code: 400, message: '已报名此活动' });
  }

  const newEnrollment = {
    id: String(Date.now()),
    activityId: id,
    userId,
    status: 'confirmed',
    createdAt: new Date().toISOString().split('T')[0]
  };
  
  activityEnrollments.push(newEnrollment);
  activity.enrolled += 1;
  
  res.json({
    code: 200,
    message: '报名成功',
    data: newEnrollment
  });
});

router.get('/:id/enrollments', [authenticate, staffOnly], (req, res) => {
  const { id } = req.params;
  const enrollments = activityEnrollments.filter(e => e.activityId === id);
  
  res.json({
    code: 200,
    data: enrollments
  });
});

router.get('/types/list', (req, res) => {
  const types = [
    { value: 'guided-tour', label: '导览讲解' },
    { value: 'workshop', label: '体验课程' },
    { value: 'night-tour', label: '夜游活动' },
    { value: 'study-tour', label: '研学活动' },
    { value: 'performance', label: '文艺表演' },
    { value: 'competition', label: '赛事活动' }
  ];
  
  res.json({
    code: 200,
    data: types
  });
});

module.exports = router;