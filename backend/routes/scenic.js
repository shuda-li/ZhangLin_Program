const express = require('express');
const { scenicSpots } = require('../data/mockData');
const { authenticate, staffOnly } = require('../middleware/auth');

const router = express.Router();

// 写操作统一挂载鉴权：管理员/讲解员可增删改景点
const writeAuth = [authenticate, staffOnly];

router.get('/', (req, res) => {
  const { page = 1, limit = 10, category, keyword } = req.query;
  
  let filtered = [...scenicSpots];
  
  if (category) {
    filtered = filtered.filter(s => s.category === category);
  }
  
  if (keyword) {
    filtered = filtered.filter(s => 
      s.name.includes(keyword) || s.description.includes(keyword)
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
  const spot = scenicSpots.find(s => s.id === id);
  
  if (!spot) {
    return res.status(404).json({ code: 404, message: '景点不存在' });
  }
  
  res.json({
    code: 200,
    data: spot
  });
});

router.post('/', writeAuth, (req, res) => {
  const { name, category, description, image, gallery, features, openTime, ticketPrice, location } = req.body;
  
  if (!name || !category || !description) {
    return res.status(400).json({ code: 400, message: '请填写必填字段' });
  }
  
  const newSpot = {
    id: `spot-${Date.now()}`,
    name,
    category,
    description,
    image: image || '',
    gallery: gallery || [],
    features: features || [],
    openTime: openTime || '09:00-17:00',
    ticketPrice: ticketPrice || '免费',
    location: location || '',
    status: 'open',
    visits: 0,
    createdAt: new Date().toISOString().split('T')[0]
  };
  
  scenicSpots.push(newSpot);
  
  res.json({
    code: 200,
    message: '景点添加成功',
    data: newSpot
  });
});

router.put('/:id', writeAuth, (req, res) => {
  const { id } = req.params;
  const index = scenicSpots.findIndex(s => s.id === id);
  
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '景点不存在' });
  }
  
  const updateData = req.body;
  scenicSpots[index] = { ...scenicSpots[index], ...updateData };
  
  res.json({
    code: 200,
    message: '景点更新成功',
    data: scenicSpots[index]
  });
});

router.delete('/:id', writeAuth, (req, res) => {
  const { id } = req.params;
  const index = scenicSpots.findIndex(s => s.id === id);
  
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '景点不存在' });
  }
  
  scenicSpots.splice(index, 1);
  
  res.json({
    code: 200,
    message: '景点删除成功'
  });
});

router.get('/categories/list', (req, res) => {
  const categories = [...new Set(scenicSpots.map(s => s.category))];
  
  res.json({
    code: 200,
    data: categories.map(cat => ({
      name: cat,
      count: scenicSpots.filter(s => s.category === cat).length
    }))
  });
});

module.exports = router;