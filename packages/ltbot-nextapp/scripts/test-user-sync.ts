/**
 * 用户同步测试脚本
 * 用于验证 Clerk 用户同步功能是否正常工作
 * 
 * 使用方法：
 * 1. 确保已登录 Clerk 账号
 * 2. 在浏览器控制台运行此脚本
 * 3. 查看输出结果
 */

async function testUserSync() {
  console.log('========================================');
  console.log('🧪 开始测试用户同步功能');
  console.log('========================================\n');

  try {
    // 测试 1: 检查同步状态
    console.log('📊 测试 1: 检查同步状态...');
    const statusResponse = await fetch('/api/users/sync', {
      method: 'GET',
    });
    const statusData = await statusResponse.json();
    console.log('✅ 同步状态:', statusData);
    console.log('');

    // 测试 2: 手动触发同步
    if (!statusData.data?.synced) {
      console.log('🔄 测试 2: 触发用户同步...');
      const syncResponse = await fetch('/api/users/sync', {
        method: 'POST',
      });
      const syncData = await syncResponse.json();
      console.log('✅ 同步结果:', syncData);
      console.log('');
    } else {
      console.log('✅ 用户已同步，跳过测试 2');
      console.log('');
    }

    // 测试 3: 验证数据库记录
    console.log('🔍 测试 3: 验证数据库记录...');
    const verifyResponse = await fetch('/api/users/sync', {
      method: 'GET',
    });
    const verifyData = await verifyResponse.json();
    
    if (verifyData.data?.user) {
      const user = verifyData.data.user;
      console.log('✅ 用户信息:', {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        积分余额: user.userScore?.balance,
      });
    } else {
      console.error('❌ 未找到用户记录');
    }
    console.log('');

    // 测试总结
    console.log('========================================');
    console.log('✅ 测试完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 自动执行
testUserSync();

// 导出供手动调用
if (typeof window !== 'undefined') {
  (window as any).testUserSync = testUserSync;
  console.log('💡 提示：在浏览器控制台输入 testUserSync() 运行测试');
}

export { testUserSync };

