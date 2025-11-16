// 掘金风格的文章数据结构
export interface Article {
  id: number;
  title: string;
  category: string;
  content: string;
  image: string;
  link: string;
  author: string;
  date: string;
  readTime: string;
  likes: number;
  tags: string[];
}

// 掘金风格的文章数据
export const articleData: Article[] = [
  {
    id: 1,
    title: "Vue3 + TypeScript 最佳实践：从入门到精通",
    category: "前端",
    content: "本文详细介绍了Vue3和TypeScript的结合使用，包括组合式API、类型定义、组件开发等最佳实践。通过实际案例演示如何构建类型安全的Vue应用。",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop",
    link: "/article/1",
    author: "前端小王子",
    date: "2024-01-15",
    readTime: "8分钟",
    likes: 256,
    tags: ["Vue3", "TypeScript", "前端", "最佳实践"]
  },
  {
    id: 2,
    title: "深入理解React Hooks：useEffect的完整指南",
    category: "前端",
    content: "React Hooks是React 16.8引入的重要特性，本文重点解析useEffect的使用场景、依赖数组、清理函数等核心概念。",
    image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=200&fit=crop",
    link: "/article/2",
    author: "React专家",
    date: "2024-01-14",
    readTime: "12分钟",
    likes: 189,
    tags: ["React", "Hooks", "useEffect", "前端"]
  },
  {
    id: 3,
    title: "Node.js性能优化：从基础到高级技巧",
    category: "后端",
    content: "Node.js作为服务端JavaScript运行时，性能优化至关重要。本文分享内存管理、事件循环、集群模式等优化策略。",
    image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=200&fit=crop",
    link: "/article/3",
    author: "Node.js大师",
    date: "2024-01-13",
    readTime: "15分钟",
    likes: 324,
    tags: ["Node.js", "性能优化", "后端", "JavaScript"]
  },
  {
    id: 4,
    title: "微服务架构设计模式与实践",
    category: "架构",
    content: "微服务架构已经成为现代应用开发的主流选择。本文介绍服务发现、配置管理、熔断器等核心设计模式。",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop",
    link: "/article/4",
    author: "架构师老王",
    date: "2024-01-12",
    readTime: "20分钟",
    likes: 421,
    tags: ["微服务", "架构", "设计模式", "分布式"]
  },
  {
    id: 5,
    title: "Docker容器化部署完整指南",
    category: "运维",
    content: "Docker彻底改变了应用部署方式。本文从基础概念到生产环境部署，全面讲解Docker的使用技巧和最佳实践。",
    image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=200&fit=crop",
    link: "/article/5",
    author: "DevOps工程师",
    date: "2024-01-11",
    readTime: "10分钟",
    likes: 298,
    tags: ["Docker", "容器化", "运维", "部署"]
  },
  {
    id: 6,
    title: "机器学习入门：从线性回归到神经网络",
    category: "AI",
    content: "机器学习是人工智能的核心技术。本文通过Python代码示例，循序渐进地介绍机器学习的基本概念和算法实现。",
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop",
    link: "/article/6",
    author: "AI研究员",
    date: "2024-01-10",
    readTime: "18分钟",
    likes: 567,
    tags: ["机器学习", "AI", "Python", "神经网络"]
  },
  {
    id: 7,
    title: "Web安全攻防：XSS和CSRF防护策略",
    category: "安全",
    content: "Web应用安全是开发者的必修课。本文详细分析XSS和CSRF攻击原理，并提供实用的防护方案和代码示例。",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop",
    link: "/article/7",
    author: "安全专家",
    date: "2024-01-09",
    readTime: "14分钟",
    likes: 234,
    tags: ["Web安全", "XSS", "CSRF", "防护"]
  },
  {
    id: 8,
    title: "GraphQL vs REST：如何选择API设计",
    category: "API",
    content: "GraphQL和REST都是流行的API设计方式。本文对比两者的优缺点，帮助你在不同场景下做出合适的选择。",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop",
    link: "/article/8",
    author: "API架构师",
    date: "2024-01-08",
    readTime: "11分钟",
    likes: 178,
    tags: ["GraphQL", "REST", "API", "设计"]
  }
];