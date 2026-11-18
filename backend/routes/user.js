const express = require('express');
const bcrypt = require('bcryptjs');
const { users } = require('../data/mockData');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// 用户管理全部敏感：仅管理员可访问
router.use(authenticate, adminOnly);

router.get('/', (req, res) => {
  const { page = 1, limit = 10, role, status, keyword } = req.query;
  
  let filtered = users.map(u => {
    const { password, ...user } = u;
    return user;
  });
  
  if (role) {
    filtered = filtered.filter(u => u.role === role);
  }
  
  if (status) {
    filtered = filtered.filter(u => u.status === status);
  }
  
  if (keyword) {
    filtered = filtered.filter(u => 
      u.username.includes(keyword) || u.nickname.includes(keyword)
    );
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
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  
  const { password, ...userData } = user;
  
  res.json({
    code: 200,
    data: userData
  });
});

router.post('/', (req, res) => {
  const { username, password, nickname, role } = req.body;
  
  if (!username || !password || !nickname) {
    return res.status(400).json({ code: 400, message: '请填写必填字段' });
  }
  
  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.status(400).json({ code: 400, message: '用户名已存在' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: String(Date.now()),
    username,
    password: hashedPassword,
    nickname,
    avatar: '',
    role: role || 'visitor',
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
    lastLogin: null
  };
  
  users.push(newUser);
  
  const { password: pwd, ...userData } = newUser;
  
  res.json({
    code: 200,
    message: '用户创建成功',
    data: userData
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  
  const updateData = req.body;
  
  if (updateData.password) {
    updateData.password = bcrypt.hashSync(updateData.password, 10);
  }
  
  users[index] = { ...users[index], ...updateData };
  
  const { password, ...userData } = users[index];
  
  res.json({
    code: 200,
    message: '用户更新成功',
    data: userData
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  
  users.splice(index, 1);
  
  res.json({
    code: 200,
    message: '用户删除成功'
  });
});

router.get('/roles/list', (req, res) => {
  const roles = [
    { value: 'admin', label: '管理员' },
    { value: 'guide', label: '讲解员' },
    { value: 'visitor', label: '普通用户' }
  ];
  
  res.json({
    code: 200,
    data: roles
  });
});

router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  
  users[index].status = status;
  
  res.json({
    code: 200,
    message: '状态更新成功',
    data: { status: users[index].status }
  });
});

module.exports = router;