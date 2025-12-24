# API 接口文档

## 📋 目录

1. [故事相关接口](#故事相关接口)
2. [积分相关接口](#积分相关接口)

---

## 🎨 故事相关接口

### 1. 获取故事列表

**接口地址**: `GET /api/stories`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 否 | 用户ID，筛选特定用户的故事 |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |
| ageGroup | string | 否 | 年龄组筛选 |
| themeType | string | 否 | 主题类型（CLASSIC/CUSTOM） |

**响应示例**:
```json
{
  "success": true,
  "message": "获取故事列表成功",
  "data": {
    "stories": [
      {
        "id": 1,
        "ageGroup": "3-5岁",
        "themeType": "CLASSIC",
        "classicTheme": "冒险",
        "classicSubTheme": "森林探险",
        "characterSettings": "{\"description\":\"小明和小狗\"}",
        "wordLimit": 500,
        "content": "故事内容...",
        "user": {
          "id": 1,
          "name": "张三",
          "email": "zhangsan@example.com"
        },
        "createdAt": "2024-12-24T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### 2. 创建故事

**接口地址**: `POST /api/stories`

**请求体**:
```json
{
  "userId": 1,
  "ageGroup": "3-5岁",
  "themeType": "CLASSIC",
  "classicTheme": "冒险",
  "classicSubTheme": "森林探险",
  "characterSettings": "{\"description\":\"小明和小狗\"}",
  "wordLimit": 500,
  "content": "故事内容...",
  "extData": "{\"difficulty\":\"medium\"}"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 是 | 用户ID |
| ageGroup | string | 是 | 年龄组 |
| themeType | string | 是 | 主题类型（CLASSIC/CUSTOM） |
| classicTheme | string | 条件必填 | 经典主题（themeType=CLASSIC时必填） |
| classicSubTheme | string | 否 | 经典子主题 |
| customTheme | string | 条件必填 | 自定义主题（themeType=CUSTOM时必填） |
| characterSettings | string | 是 | 人物设定（JSON字符串） |
| wordLimit | number | 是 | 字数限制 |
| content | string | 否 | 故事内容 |
| extData | string | 否 | 扩展字段（JSON字符串） |

**响应示例**:
```json
{
  "success": true,
  "message": "创建故事成功",
  "data": {
    "id": 1,
    "userId": 1,
    "ageGroup": "3-5岁",
    "themeType": "CLASSIC",
    ...
  }
}
```

---

### 3. 获取故事详情

**接口地址**: `GET /api/stories/[id]`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 故事ID |

**响应示例**:
```json
{
  "success": true,
  "message": "获取故事详情成功",
  "data": {
    "id": 1,
    "ageGroup": "3-5岁",
    "themeType": "CLASSIC",
    "classicTheme": "冒险",
    "user": {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    "scoreTransactions": [
      {
        "id": 1,
        "transactionType": "CONSUME_STORY",
        "amount": -10,
        "createdAt": "2024-12-24T10:00:00Z"
      }
    ]
  }
}
```

---

### 4. 更新故事

**接口地址**: `PUT /api/stories/[id]`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 故事ID |

**请求体**:
```json
{
  "content": "更新后的故事内容...",
  "extData": "{\"updated\":true}"
}
```

**说明**: 只需要传入需要更新的字段

---

### 5. 删除故事

**接口地址**: `DELETE /api/stories/[id]`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 故事ID |

**响应示例**:
```json
{
  "success": true,
  "message": "删除故事成功",
  "data": null
}
```

---

## 💰 积分相关接口

### 1. 查询积分信息

**接口地址**: `GET /api/scores`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 是 | 用户ID |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "success": true,
  "message": "获取积分信息成功",
  "data": {
    "balance": 100,
    "transactions": [
      {
        "id": 1,
        "transactionType": "RECHARGE",
        "amount": 100,
        "balanceBefore": 0,
        "balanceAfter": 100,
        "description": "充值 100 积分",
        "createdAt": "2024-12-24T10:00:00Z"
      },
      {
        "id": 2,
        "transactionType": "CONSUME_STORY",
        "amount": -10,
        "balanceBefore": 100,
        "balanceAfter": 90,
        "description": "生成故事消耗 10 积分",
        "storyId": 1,
        "createdAt": "2024-12-24T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

---

### 2. 充值积分

**接口地址**: `POST /api/scores/recharge`

**请求体**:
```json
{
  "userId": 1,
  "amount": 100,
  "description": "充值 100 积分"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 是 | 用户ID |
| amount | number | 是 | 充值金额（必须大于0） |
| description | string | 否 | 充值描述 |

**安全说明**:
> ⚠️ 此接口应该与支付系统集成，需要验证支付凭证。当前为开发版本，请在生产环境中添加以下验证：
> 1. 验证支付订单号
> 2. 验证支付状态
> 3. 验证支付签名
> 4. 防止重复充值

**响应示例**:
```json
{
  "success": true,
  "message": "充值成功",
  "data": {
    "userScore": {
      "userId": 1,
      "balance": 100
    },
    "transaction": {
      "id": 1,
      "transactionType": "RECHARGE",
      "amount": 100,
      "balanceBefore": 0,
      "balanceAfter": 100
    }
  }
}
```

---

### 3. 消耗积分

**接口地址**: `POST /api/scores/consume`

**请求体**:
```json
{
  "userId": 1,
  "amount": 10,
  "transactionType": "CONSUME_STORY",
  "storyId": 1,
  "description": "生成故事消耗 10 积分"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 是 | 用户ID |
| amount | number | 是 | 消费金额（必须大于0） |
| transactionType | string | 是 | 交易类型（CONSUME_STORY/CONSUME_MUSIC） |
| storyId | number | 否 | 关联的故事ID |
| musicId | number | 否 | 关联的音乐ID |
| description | string | 否 | 消费描述 |

**安全说明**:
> ⚠️ 此接口包含以下安全控制：
> 1. 验证用户身份（应结合JWT认证）
> 2. 检查积分余额是否充足
> 3. 使用数据库事务确保一致性
> 4. 记录详细的消费日志

**响应示例**:
```json
{
  "success": true,
  "message": "消费成功",
  "data": {
    "userScore": {
      "userId": 1,
      "balance": 90
    },
    "transaction": {
      "id": 2,
      "transactionType": "CONSUME_STORY",
      "amount": -10,
      "balanceBefore": 100,
      "balanceAfter": 90
    }
  }
}
```

**错误响应示例**:
```json
{
  "success": false,
  "message": "积分不足，当前余额：5，需要：10",
  "error": {
    "code": 400
  }
}
```

---

## 🔐 安全建议

### 生产环境部署前必须添加的安全措施：

1. **身份认证**
   - 实现 JWT 或 Session 认证
   - 所有接口都应验证用户身份
   - 防止用户操作其他用户的数据

2. **积分充值安全**
   - 接入真实支付系统（支付宝、微信支付等）
   - 验证支付回调签名
   - 使用订单号防止重复充值
   - 记录完整的支付流水

3. **积分消耗安全**
   - 防止并发请求导致的重复扣款
   - 使用悲观锁或乐观锁
   - 完整的审计日志

4. **接口限流**
   - 添加 API 访问频率限制
   - 防止恶意刷接口

5. **数据验证**
   - 严格的参数类型和范围验证
   - SQL 注入防护（Prisma 已提供）
   - XSS 防护

---

## 📊 交易类型说明

| 类型 | 说明 | 金额 |
|------|------|------|
| RECHARGE | 充值 | 正数 |
| CONSUME_STORY | 生成故事消费 | 负数 |
| CONSUME_MUSIC | 生成音乐消费 | 负数 |
| REFUND | 退款 | 正数 |
| SYSTEM_GIFT | 系统赠送 | 正数 |

---

## 🔄 后续功能规划

- [ ] 音乐相关接口（参照故事接口）
- [ ] 用户认证和授权系统
- [ ] 故事点赞、收藏功能
- [ ] 故事评论功能
- [ ] 积分商城
- [ ] 会员等级系统

---

**最后更新**: 2025-12-24


