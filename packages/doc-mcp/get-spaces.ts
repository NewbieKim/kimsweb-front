/**
 * 直接获取飞书文档空间列表
 */
import 'dotenv/config';
import { FeishuClient } from './src/api/feishu.js';

async function main() {
    console.log('开始获取飞书文档空间列表...\n');
    
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;
    
    console.log('App ID:', appId);
    console.log('App Secret:', appSecret ? '已配置' : '未配置');
    console.log('');
    
    if (!appId || !appSecret) {
        console.error('错误：环境变量未配置');
        process.exit(1);
    }
    
    try {
        const client = new FeishuClient(appId, appSecret);
        
        console.log('1. 获取访问令牌...');
        const token = await client.getAccessToken();
        console.log('✅ 访问令牌获取成功:', token.substring(0, 30) + '...');
        console.log('');
        
        console.log('2. 获取文档空间列表...');
        const response = await client.getSpaces();
        console.log('');
        
        if (response.items && response.items.length > 0) {
            console.log(`✅ 成功！找到 ${response.items.length} 个文档空间：\n`);
            console.log('='.repeat(80));
            
            response.items.forEach((space, index) => {
                console.log(`\n${index + 1}. ${space.name}`);
                console.log(`   空间ID: ${space.space_id}`);
                if (space.description) {
                    console.log(`   描述: ${space.description}`);
                }
            });
            
            console.log('\n' + '='.repeat(80));
            console.log('\nJSON 格式：\n');
            console.log(JSON.stringify(response.items, null, 2));
            
        } else {
            console.log('⚠️  没有找到文档空间');
            console.log('\n可能的原因：');
            console.log('1. 应用权限不足（需要 wiki:wiki 或 wiki:wiki:readonly）');
            console.log('2. 账号下确实没有知识空间');
            console.log('3. 应用未发布或未审核通过');
        }
        
    } catch (error) {
        console.error('\n❌ 获取失败！');
        console.error('\n错误信息:', error instanceof Error ? error.message : String(error));
        
        if (error instanceof Error) {
            console.error('\n错误堆栈:\n', error.stack);
        }
        
        console.error('\n请检查：');
        console.error('1. App ID 和 App Secret 是否正确');
        console.error('2. 应用是否已开启「云空间」权限');
        console.error('3. 应用是否已发布并审核通过');
        
        process.exit(1);
    }
}

main();

