import express from 'express';

const router = express.Router();

// 模拟数据存储
let mockStats = {
  onlineUsers: Math.floor(Math.random() * 100) + 50, // 50-150之间的随机数
  networkTraffic: {
    incoming: Math.floor(Math.random() * 1024 * 1024 * 100), // 0-100MB的随机数
    outgoing: Math.floor(Math.random() * 1024 * 1024 * 80) // 0-80MB的随机数
  }
};

// 每分钟更新一次模拟数据
setInterval(() => {
  // 在线用户数在原有基础上随机增减
  const userChange = Math.floor(Math.random() * 10) - 5; // -5到5的随机数
  mockStats.onlineUsers = Math.max(
    30,
    Math.min(200, mockStats.onlineUsers + userChange)
  );

  // 流量数据累加
  mockStats.networkTraffic.incoming += Math.floor(
    Math.random() * 1024 * 1024 * 10
  ); // 增加0-10MB
  mockStats.networkTraffic.outgoing += Math.floor(
    Math.random() * 1024 * 1024 * 8
  ); // 增加0-8MB
}, 60000);

// 获取统计数据
router.get('/', (req, res) => {
  res.json({
    onlineUsers: mockStats.onlineUsers,
    networkTraffic: mockStats.networkTraffic,
    timestamp: new Date().toISOString()
  });
});

export default router;
