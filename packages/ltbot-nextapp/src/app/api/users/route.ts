import { NextResponse } from 'next/server';

// 模拟用户数据
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 25 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 30 },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 },
];

// GET 请求处理函数
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (id) {
    const user = users.find(u => u.id === parseInt(id));
    if (user) {
      return NextResponse.json(user);
    } else {
      return NextResponse.json({ error: '未找到用户' }, { status: 404 });
    }
  }
  
  return NextResponse.json(users);
}

// POST 请求处理函数
export async function POST(request: Request) {
  const userData = await request.json();
  
  // 简单验证
  if (!userData.name || !userData.email) {
    return NextResponse.json(
      { error: '姓名和邮箱为必填项' }, 
      { status: 400 }
    );
  }
  
  // 创建新用户（模拟）
  const newUser = {
    id: users.length + 1,
    name: userData.name,
    email: userData.email,
    age: userData.age || 0
  };
  
  // 在实际应用中，这里会保存到数据库
  users.push(newUser);
  
  return NextResponse.json(newUser, { status: 201 });
}