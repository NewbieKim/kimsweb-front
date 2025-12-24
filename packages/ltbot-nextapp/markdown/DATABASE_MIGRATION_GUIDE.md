# 数据库表结构更新操作指引

## 📋 表结构设计说明

### 1. Story（故事模型）
存储用户创建的故事信息，包括：
- **ageGroup**: 年龄组（如：3-5岁、6-8岁、9-12岁）
- **themeType**: 主题类型（枚举：CLASSIC经典、CUSTOM自定义）
- **classicTheme**: 经典主题（如：冒险、友谊、勇气）
- **classicSubTheme**: 经典子主题（如：森林探险、海底世界）
- **customTheme**: 自定义主题
- **characterSettings**: 人物设定（JSON格式）
- **wordLimit**: 字数限制
- **content**: 生成的故事内容
- **extData**: 拓展字段（JSON格式）

### 2. Music（音乐模型）
存储用户创建的音乐信息，包括：
- **musicStyle**: 音乐风格（如：轻快、舒缓、激昂、神秘）
- **description**: 音乐描述
- **audioUrl**: 生成的音乐文件URL
- **extData**: 拓展字段（JSON格式）

### 3. 积分系统（双表设计）

#### UserScore（用户积分余额表）
记录用户当前积分余额：
- **userId**: 用户ID（唯一）
- **balance**: 当前积分余额

#### ScoreTransaction（积分交易记录表）
记录所有积分变动历史：
- **transactionType**: 交易类型（枚举）
  - RECHARGE: 充值
  - CONSUME_STORY: 消费-生成故事
  - CONSUME_MUSIC: 消费-生成音乐
  - REFUND: 退款
  - SYSTEM_GIFT: 系统赠送
- **amount**: 交易金额（正数增加，负数减少）
- **balanceBefore**: 交易前余额
- **balanceAfter**: 交易后余额
- **storyId/musicId**: 关联的业务ID（可选）

---

## 🚀 数据库同步操作步骤

### 方式一：开发环境迁移（推荐）

#### 步骤 1：生成迁移文件
```bash
npx prisma migrate dev --name add_story_music_score_models
```

这个命令会：
- 创建新的迁移文件
- 自动应用到数据库
- 重新生成 Prisma Client

#### 步骤 2：验证迁移
```bash
# 查看迁移状态
npx prisma migrate status
```

#### 步骤 3：生成 Prisma Client（如果需要）
```bash
npx prisma generate
```

---

### 方式二：生产环境部署

#### 步骤 1：生成迁移文件（在开发环境）
```bash
npx prisma migrate dev --name add_story_music_score_models
```

#### 步骤 2：部署到生产环境
```bash
npx prisma migrate deploy
```

---

### 方式三：原型开发（快速同步，会丢失数据）

⚠️ **警告：此方式会删除所有数据**

```bash
npx prisma db push
```

---

## 🔍 常用 Prisma 命令

### 查看数据库
```bash
# 打开 Prisma Studio 可视化界面
npx prisma studio
```

### 重置数据库（开发环境）
```bash
# 删除数据库并重新创建
npx prisma migrate reset
```

### 查看迁移历史
```bash
npx prisma migrate status
```

### 格式化 schema 文件
```bash
npx prisma format
```

---

## 💡 使用示例

### 1. 创建故事并扣除积分

```typescript
import { PrismaClient, ThemeType, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function createStoryWithScoreDeduction(userId: number) {
  // 使用事务确保数据一致性
  return await prisma.$transaction(async (tx) => {
    // 1. 查询用户积分
    const userScore = await tx.userScore.findUnique({
      where: { userId }
    });

    if (!userScore || userScore.balance < 10) {
      throw new Error('积分不足');
    }

    // 2. 创建故事
    const story = await tx.story.create({
      data: {
        userId,
        ageGroup: '6-8岁',
        themeType: ThemeType.CLASSIC,
        classicTheme: '冒险',
        classicSubTheme: '森林探险',
        characterSettings: JSON.stringify({
          mainCharacter: { name: '小明', age: 7 },
          companions: [{ name: '小狗', type: '宠物' }]
        }),
        wordLimit: 500,
        extData: JSON.stringify({ difficulty: 'medium' })
      }
    });

    // 3. 扣除积分
    const newBalance = userScore.balance - 10;
    await tx.userScore.update({
      where: { userId },
      data: { balance: newBalance }
    });

    // 4. 记录交易
    await tx.scoreTransaction.create({
      data: {
        userId,
        transactionType: TransactionType.CONSUME_STORY,
        amount: -10,
        balanceBefore: userScore.balance,
        balanceAfter: newBalance,
        storyId: story.id,
        description: '生成故事消耗积分'
      }
    });

    return story;
  });
}
```

### 2. 充值积分

```typescript
async function rechargeScore(userId: number, amount: number) {
  return await prisma.$transaction(async (tx) => {
    // 获取或创建用户积分记录
    let userScore = await tx.userScore.findUnique({
      where: { userId }
    });

    if (!userScore) {
      userScore = await tx.userScore.create({
        data: { userId, balance: 0 }
      });
    }

    const newBalance = userScore.balance + amount;

    // 更新余额
    await tx.userScore.update({
      where: { userId },
      data: { balance: newBalance }
    });

    // 记录交易
    await tx.scoreTransaction.create({
      data: {
        userId,
        transactionType: TransactionType.RECHARGE,
        amount,
        balanceBefore: userScore.balance,
        balanceAfter: newBalance,
        description: `充值 ${amount} 积分`
      }
    });

    return newBalance;
  });
}
```

### 3. 查询用户积分和交易记录

```typescript
async function getUserScoreInfo(userId: number) {
  // 获取当前余额
  const userScore = await prisma.userScore.findUnique({
    where: { userId }
  });

  // 获取交易记录
  const transactions = await prisma.scoreTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      story: true,
      music: true
    }
  });

  return {
    balance: userScore?.balance || 0,
    transactions
  };
}
```

---

## 📝 注意事项

1. **数据备份**：在生产环境执行迁移前，务必备份数据库
2. **事务处理**：涉及积分的操作必须使用事务，确保数据一致性
3. **积分校验**：每次消费前检查余额是否充足
4. **日志记录**：所有积分变动都会记录在 ScoreTransaction 表中
5. **索引优化**：已为常用查询字段添加索引，提升查询性能
6. **JSON 字段**：extData 和 characterSettings 使用 JSON 格式，便于扩展

---

## 🔧 故障排除

### 问题 1：迁移失败
```bash
# 查看详细错误信息
npx prisma migrate status

# 如果是开发环境，可以重置数据库
npx prisma migrate reset
```

### 问题 2：Prisma Client 类型不匹配
```bash
# 重新生成 Prisma Client
npx prisma generate
```

### 问题 3：数据库锁定
```bash
# 关闭所有数据库连接
# 对于 SQLite，确保没有其他进程在使用 dev.db 文件
```

---

## 📚 相关文档

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma Migrate 指南](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Next.js + Prisma 最佳实践](https://www.prisma.io/nextjs)

---

**更新日期**: 2024-12-24
**版本**: v1.0.0

