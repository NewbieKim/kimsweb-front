/**
 * 测试脚本：获取飞书文档空间列表
 * 使用方法：tsx test-spaces.ts
 */
import 'dotenv/config';
import { FeishuClient } from './src/api/feishu.js';

async function testGetSpaces() {
    console.log('='.repeat(60));
    console.log('飞书文档空间列表获取测试');
    console.log('='.repeat(60));
    console.log('');

    // 检查环境变量
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;

    if (!appId || !appSecret) {
        console.error('❌ 错误：未找到飞书应用凭证');
        console.error('');
        console.error('请在 packages/doc-mcp/ 目录下创建 .env 文件，内容如下：');
        console.error('');
        console.error('FEISHU_APP_ID=你的应用ID');
        console.error('FEISHU_APP_SECRET=你的应用密钥');
        console.error('');
        console.error('获取凭证步骤：');
        console.error('1. 访问 https://open.feishu.cn/');
        console.error('2. 创建企业自建应用');
        console.error('3. 获取 App ID 和 App Secret');
        console.error('4. 开启权限：云空间 > 查看、评论和导出云空间 (wiki:wiki:readonly)');
        console.error('');
        process.exit(1);
    }

    console.log('✅ 环境变量已配置');
    console.log(`📱 App ID: ${appId.substring(0, 8)}***`);
    console.log('');

    try {
        // 创建飞书客户端
        const client = new FeishuClient(appId, appSecret);
        
        console.log('🔄 正在获取访问令牌...');
        const token = await client.getAccessToken();
        console.log(`✅ 访问令牌获取成功: ${token.substring(0, 20)}...`);
        console.log('');

        console.log('🔄 正在获取文档空间列表...');
        const response = await client.getSpaces();
        
        console.log('');
        console.log('='.repeat(60));
        console.log(`📚 找到 ${response.items?.length || 0} 个文档空间`);
        console.log('='.repeat(60));
        console.log('');

        if (response.items && response.items.length > 0) {
            response.items.forEach((space, index) => {
                console.log(`${index + 1}. 【${space.name}】`);
                console.log(`   空间ID: ${space.space_id}`);
                if (space.description) {
                    console.log(`   描述: ${space.description}`);
                }
                console.log('');
            });

            // 输出JSON格式（方便复制使用）
            console.log('='.repeat(60));
            console.log('JSON 格式输出：');
            console.log('='.repeat(60));
            console.log(JSON.stringify(response.items.map(s => ({
                id: s.space_id,
                name: s.name,
                description: s.description
            })), null, 2));
        } else {
            console.log('ℹ️  没有找到任何文档空间');
            console.log('');
            console.log('可能原因：');
            console.log('1. 应用权限不足（需要 wiki:wiki 或 wiki:wiki:readonly 权限）');
            console.log('2. 当前账号下确实没有知识空间');
            console.log('');
            console.log('请检查应用权限配置：');
            console.log('https://open.feishu.cn/app → 你的应用 → 权限管理 → 云空间');
        }

        if (response.has_more) {
            console.log('');
            console.log('⚠️  还有更多空间，使用 page_token 获取下一页');
        }

    } catch (error) {
        console.error('');
        console.error('='.repeat(60));
        console.error('❌ 获取文档空间失败');
        console.error('='.repeat(60));
        console.error('');
        
        if (error instanceof Error) {
            console.error('错误信息:', error.message);
            
            if (error.message.includes('Access denied') || error.message.includes('权限')) {
                console.error('');
                console.error('💡 这是权限问题，请按以下步骤操作：');
                console.error('');
                console.error('1. 访问飞书开放平台: https://open.feishu.cn/app');
                console.error('2. 选择你的应用');
                console.error('3. 进入「权限管理」');
                console.error('4. 找到「云空间」相关权限');
                console.error('5. 开启「查看、评论和导出云空间」权限');
                console.error('6. 点击「申请发布」或在「版本管理与发布」中发布应用');
                console.error('7. 确保应用已被租户管理员审核通过');
            }
        } else {
            console.error('错误:', error);
        }
        
        console.error('');
        process.exit(1);
    }
}

// 运行测试
testGetSpaces().catch(console.error);

