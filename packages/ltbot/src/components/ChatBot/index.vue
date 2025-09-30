<template>
    <div class="chat-box">
      <!-- 侧边栏 -->
      <div class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <div class="sidebar-header">
          <div class="logo-section">
            <div class="logo">
              <span class="logo-icon">🤖</span>
              <span class="logo-text" v-if="!sidebarCollapsed" @click="goWorkBench">LTBOT</span>
            </div>
            <button 
              class="collapse-btn" 
              @click="toggleSidebar"
              :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
            >
              {{ sidebarCollapsed ? '▶' : '◀' }}
            </button>
          </div>
          <button 
            class="new-chat-btn" 
            @click="startNewChat"
            v-if="!sidebarCollapsed"
          >
            ➕ 开启新对话
          </button>
        </div>
        
        <div class="chat-history" v-if="!sidebarCollapsed">
          <div class="history-section">
            <div class="section-title">今天</div>
            <div 
              v-for="chat in todayChats" 
              :key="chat.id"
              class="chat-item"
              :class="{ 'active': currentChatId === chat.id }"
              @click="switchToChat(chat.id)"
            >
              <div class="chat-title">{{ chat.title }}</div>
              <div class="chat-actions">
                <button @click.stop="deleteChat(chat.id)" class="delete-btn" title="删除">
                  🗑️
                </button>
              </div>
            </div>
          </div>
          
          <div class="history-section" v-if="yesterdayChats.length > 0">
            <div class="section-title">昨天</div>
            <div 
              v-for="chat in yesterdayChats" 
              :key="chat.id"
              class="chat-item"
              :class="{ 'active': currentChatId === chat.id }"
              @click="switchToChat(chat.id)"
            >
              <div class="chat-title">{{ chat.title }}</div>
              <div class="chat-actions">
                <button @click.stop="deleteChat(chat.id)" class="delete-btn" title="删除">
                  🗑️
                </button>
              </div>
            </div>
          </div>
          
          <div class="history-section" v-if="olderChats.length > 0">
            <div class="section-title">7天内</div>
            <div 
              v-for="chat in olderChats" 
              :key="chat.id"
              class="chat-item"
              :class="{ 'active': currentChatId === chat.id }"
              @click="switchToChat(chat.id)"
            >
              <div class="chat-title">{{ chat.title }}</div>
              <div class="chat-actions">
                <button @click.stop="deleteChat(chat.id)" class="delete-btn" title="删除">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主聊天区域 -->
      <div class="main-chat-area" :class="{ 'expanded': sidebarCollapsed }">
        <!-- 初始化页面 -->
        <div v-if="chatList.length === 0" class="chat-welcome">
        <div class="welcome-content">
          <div class="welcome-header">
            <div class="ai-icon">
              🤖
            </div>
            <h2 class="welcome-title">今天有什么可以帮到你？</h2>
          </div>
          
          <div class="welcome-input-section">
            <div class="input-wrapper">
              <input 
                v-model="welcomeInput"
                class="welcome-input"
                placeholder="给 LTBOT 发送消息"
                @keyup.enter="handleWelcomeSubmit"
              />
              <div class="input-actions">
                <button class="action-btn" @click="handleQuickAction('深度思考')" title="深度思考">
                  🧠
                </button>
                <button class="action-btn" @click="handleQuickAction('联网搜索')" title="联网搜索">
                  🌐
                </button>
                <button class="action-btn" @click="handleQuickAction('附件')" title="附件">
                  📎
                </button>
                <button 
                  class="send-btn" 
                  @click="handleWelcomeSubmit"
                  :disabled="!welcomeInput.trim()"
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
          
          <div class="quick-suggestions">
            <button 
              v-for="suggestion in quickSuggestions" 
              :key="suggestion"
              class="suggestion-btn"
              @click="handleSuggestionClick(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <!-- 聊天界面 -->
      <t-chat
        v-else
        ref="chatRef"
        :clear-history="chatList.length > 0 && !isStreamLoad"
        :data="chatList"
        :text-loading="loading"
        :is-stream-load="isStreamLoad"
        style="height: 600px"
        @scroll="handleChatScroll"
        @clear="clearConfirm"
      >
        <!-- eslint-disable vue/no-unused-vars -->
        <template #content="{ item, index }">
          <t-chat-reasoning v-if="item.reasoning?.length > 0" expand-icon-placement="right">
            <template #header>
              <t-chat-loading v-if="isStreamLoad && item.content.length === 0" text="思考中..." />
              <div v-else style="display: flex; align-items: center">
                <CheckCircleIcon style="color: var(--td-success-color-5); font-size: 20px; margin-right: 8px" />
                <span>已深度思考</span>
              </div>
            </template>
            <t-chat-content v-if="item.reasoning.length > 0" :content="item.reasoning" />
          </t-chat-reasoning>
          <t-chat-content v-if="item.content.length > 0" :content="item.content" />
        </template>
        <template #actions="{ item, index }">
          <t-chat-action
            :content="item.content"
            :operation-btn="['good', 'bad', 'replay', 'copy']"
            @operation="handleOperation"
          />
        </template>
        <template #footer>
          <t-chat-input :stop-disabled="isStreamLoad" @send="inputEnter" @stop="onStop"> </t-chat-input>
        </template>
      </t-chat>
      
      <t-button v-show="isShowToBottom" variant="text" class="bottomBtn" @click="backBottom">
        <div class="to-bottom">
          <ArrowDownIcon />
        </div>
      </t-button>
      </div>
    </div>
  </template>

  <script setup lang="jsx">
  import { ref, computed } from 'vue';
  import { MockSSEResponse } from './mockdata/sseRequest-reasoning';
  import { ArrowDownIcon, CheckCircleIcon } from 'tdesign-icons-vue-next';
  import { useRouter } from 'vue-router';
  const router = useRouter();
  const abortController = ref(null);
  const loading = ref(false);
  // 流式数据加载中
  const isStreamLoad = ref(false);
  
  const chatRef = ref(null);
  const isShowToBottom = ref(false);
  
  // 欢迎页面相关状态
  const welcomeInput = ref('');
  const quickSuggestions = ref([
    '写一篇关于人工智能的文章',
    '帮我分析一下近期股票市场趋势',
    '解释量子计算的原理',
    '推荐一些学习编程的资源'
  ]);

  // 侧边栏相关状态
  const sidebarCollapsed = ref(false);
  const currentChatId = ref(null);
  const chatHistory = ref([
    {
      id: 'chat-1',
      title: '获取DeepSeek API Key步骤指南',
      lastMessage: '如何获取DeepSeek的API Key？',
      timestamp: new Date(),
      messages: []
    },
    {
      id: 'chat-2', 
      title: 'Element UI Cascader全层开示例',
      lastMessage: '如何实现Element UI级联选择器？',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
      messages: []
    },
    {
      id: 'chat-3',
      title: 'TypeScript#extends关键字应用...',
      lastMessage: 'TypeScript中extends的用法',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
      messages: []
    },
    {
      id: 'chat-4',
      title: 'UI高无法识别原因及解决方法',
      lastMessage: '为什么UI组件无法正常显示？',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 昨天
      messages: []
    },
    {
      id: 'chat-5',
      title: 'Vercel部署npm错误解决方案',
      lastMessage: 'Vercel部署时出现npm错误怎么办？',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3天前
      messages: []
    }
  ]);

  // 计算属性：按时间分组聊天历史
  const todayChats = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return chatHistory.value.filter(chat => {
      const chatDate = new Date(chat.timestamp);
      chatDate.setHours(0, 0, 0, 0);
      return chatDate.getTime() === today.getTime();
    });
  });

  const yesterdayChats = computed(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return chatHistory.value.filter(chat => {
      const chatDate = new Date(chat.timestamp);
      chatDate.setHours(0, 0, 0, 0);
      return chatDate.getTime() === yesterday.getTime();
    });
  });

  const olderChats = computed(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    
    return chatHistory.value.filter(chat => {
      const chatTime = new Date(chat.timestamp).getTime();
      return chatTime < yesterday.getTime() && chatTime >= sevenDaysAgo.getTime();
    });
  });

  const goWorkBench = () => {
    router.push({ path: '/workBench' })
  }

  // 滚动到底部
  const backBottom = () => {
    chatRef.value.scrollToBottom({
      behavior: 'smooth',
    });
  };
  // 是否显示回到底部按钮
  const handleChatScroll = function ({ e }) {
    const scrollTop = e.target.scrollTop;
    isShowToBottom.value = scrollTop < 0;
  };
  // 清空消息
  const clearConfirm = function () {
    chatList.value = [];
  };
  const handleOperation = function (type, options) {
    console.log('handleOperation', type, options);
  };

  // 欢迎页面处理函数
  const handleWelcomeSubmit = () => {
    if (welcomeInput.value.trim()) {
      inputEnter(welcomeInput.value.trim());
      welcomeInput.value = '';
    }
  };

  const handleSuggestionClick = (suggestion) => {
    inputEnter(suggestion);
  };

  const handleQuickAction = (action) => {
    console.log('快捷操作:', action);
    // 这里可以根据不同的操作执行不同的逻辑
    switch(action) {
      case '深度思考':
        // 可以设置一个标志，让AI进行更深入的思考
        break;
      case '联网搜索':
        // 可以启用联网搜索功能
        break;
      case '附件':
        // 可以打开文件选择器
        break;
    }
  };

  // 侧边栏功能方法
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  const startNewChat = () => {
    // 保存当前聊天（如果有消息）
    if (chatList.value.length > 0 && currentChatId.value) {
      const currentChat = chatHistory.value.find(chat => chat.id === currentChatId.value);
      if (currentChat) {
        currentChat.messages = [...chatList.value];
      }
    }
    
    // 创建新对话
    const newChatId = 'chat-' + Date.now();
    const newChat = {
      id: newChatId,
      title: '新对话',
      lastMessage: '',
      timestamp: new Date(),
      messages: []
    };
    
    // 添加到历史记录
    chatHistory.value.unshift(newChat);
    
    // 切换到新对话
    currentChatId.value = newChatId;
    chatList.value = [];
  };

  const switchToChat = (chatId) => {
    // 保存当前聊天
    if (currentChatId.value && chatList.value.length > 0) {
      const currentChat = chatHistory.value.find(chat => chat.id === currentChatId.value);
      if (currentChat) {
        currentChat.messages = [...chatList.value];
      }
    }
    
    // 切换到选中的聊天
    currentChatId.value = chatId;
    const selectedChat = chatHistory.value.find(chat => chat.id === chatId);
    if (selectedChat) {
      chatList.value = [...selectedChat.messages];
    }
  };

  const deleteChat = (chatId) => {
    const index = chatHistory.value.findIndex(chat => chat.id === chatId);
    if (index > -1) {
      chatHistory.value.splice(index, 1);
      
      // 如果删除的是当前聊天，切换到新对话
      if (currentChatId.value === chatId) {
        currentChatId.value = null;
        chatList.value = [];
      }
    }
  };

  // 修改输入处理，为新对话生成标题
  const generateChatTitle = (message) => {
    if (message.length > 30) {
      return message.substring(0, 30) + '...';
    }
    return message;
  };

  // 倒序渲染
  const chatList = ref([]);
  
  const onStop = function () {
    console.log('用户点击停止按钮，中断请求');
    if (abortController.value) {
      // 中断当前请求
      abortController.value.abort();
      console.log('请求已中断');
    }
    // 重置状态
    loading.value = false;
    isStreamLoad.value = false;
  };
  
  const inputEnter = function (inputValue) {
    if (isStreamLoad.value) {
      return;
    }
    if (!inputValue) return;

    // 如果是第一条消息且没有当前聊天ID，创建新聊天
    if (chatList.value.length === 0 && !currentChatId.value) {
      const newChatId = 'chat-' + Date.now();
      const newChat = {
        id: newChatId,
        title: generateChatTitle(inputValue),
        lastMessage: inputValue,
        timestamp: new Date(),
        messages: []
      };
      chatHistory.value.unshift(newChat);
      currentChatId.value = newChatId;
    }

    const params = {
      avatar: 'https://tdesign.gtimg.com/site/avatar.jpg',
      name: '自己',
      datetime: new Date().toDateString(),
      content: inputValue,
      role: 'user',
    };
    chatList.value.unshift(params);
    // 空消息占位
    const params2 = {
      avatar: 'https://tdesign.gtimg.com/site/chat-avatar.png',
      name: 'LTBOT',
      datetime: new Date().toDateString(),
      content: '',
      reasoning: '',
      role: 'assistant',
    };
    chatList.value.unshift(params2);
    handleData(inputValue);
  };
  
  const handleData = async (userMessage) => {
    loading.value = true;
    isStreamLoad.value = true;
    const lastItem = chatList.value[0];
    
    // 创建新的 AbortController 实例
    abortController.value = new AbortController();
    
    try {
      // 构建消息历史，只取最近10条消息避免 token 过多
      const recentMessages = chatList.value
        .slice(1) // 跳过当前空的 assistant 消息
        .reverse() // 恢复时间顺序
        .slice(-10) // 取最近10条
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // 添加当前用户消息
      recentMessages.push({
        role: 'user',
        content: userMessage
      });

      // 调用 DeepSeek API 进行流式回答，传入 signal
      const response = await getChatDataStream(recentMessages, {
        signal: abortController.value.signal
      });
      console.log('=========response============', response);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader(); // 获取流读取器
      const decoder = new TextDecoder(); // 创建文本解码器
      
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      loading.value = false;
      
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              isStreamLoad.value = false;
              lastItem.duration = Math.floor(Date.now() / 1000) % 100; // 简单的用时计算
              break;
            }
            
            const chunk = decoder.decode(value, { stream: true }); // 解码二进制数据为文本
            const lines = chunk.split('\n').filter(line => line.trim()); // 按行分割，过滤空行
            
            for (const line of lines) { // 遍历每一行
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6); // 去掉data:前缀
                
                if (dataStr === '[DONE]') { // 如果数据为[DONE]，则结束流
                  isStreamLoad.value = false;
                  lastItem.duration = Math.floor(Date.now() / 1000) % 100;
                  return;
                }
                
                try {
                  const data = JSON.parse(dataStr);
                  const content = data.choices?.[0]?.delta?.content || '';
                  
                  if (content) {
                    lastItem.content += content; // 累加内容
                  }
                } catch (parseError) {
                  console.warn('解析 SSE 数据失败:', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          console.error('处理流数据时出错:', streamError);
          lastItem.role = 'error';
          lastItem.content = '处理回答时出现错误，请重试。';
          isStreamLoad.value = false;
          loading.value = false;
        }
      };

      await processStream();
      
    } catch (error) {
      // 如果是用户主动中断请求，不显示错误信息
      if (error.name === 'AbortError') {
        console.log('请求已被用户中断');
        lastItem.role = 'error';
        lastItem.content = '请求已中断';
      } else {
        console.error('DeepSeek API 调用失败:', error);
        lastItem.role = 'error';
        lastItem.content = `调用 AI 服务失败: ${error.message}`;
      }
      isStreamLoad.value = false;
      loading.value = false;
    } finally {
      // 清理 AbortController
      abortController.value = null;
    }
  };
  // DeepSeek API 配置
  const DEEPSEEK_CONFIG = {
    apiUrl: import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-591250370fc54f6e82b9d98af991a975', // 请在 .env 文件中设置 VITE_DEEPSEEK_API_KEY
    model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat',
    maxTokens: 2048,
    temperature: 0.7
  };
  console.log('DEEPSEEK_CONFIG', DEEPSEEK_CONFIG);

  // 调用 DeepSeek API 获取聊天数据，流式调用 DeepSeek API
  const getChatDataStream = async (messages, options = {}) => {
    try {
      const {
        model = DEEPSEEK_CONFIG.model,
        maxTokens = DEEPSEEK_CONFIG.maxTokens,
        temperature = DEEPSEEK_CONFIG.temperature,
        signal = null
      } = options;

      const requestBody = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true // 流式请求
      };

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
        },
        body: JSON.stringify(requestBody)
      };

      // 如果提供了 signal，则添加到 fetch 选项中
      if (signal) {
        fetchOptions.signal = signal;
      }

      const response = await fetch(DEEPSEEK_CONFIG.apiUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`DeepSeek API Error: ${response.status} ${response.statusText}`);
      }

      return response;

    } catch (error) {
      console.error('DeepSeek 流式 API 调用失败:', error);
      throw error;
    }
  };
  </script>

  <style lang="less">
  /* 应用滚动条样式 */
  ::-webkit-scrollbar-thumb {
    background-color: var(--td-scrollbar-color);
  }
  ::-webkit-scrollbar-thumb:horizontal:hover {
    background-color: var(--td-scrollbar-hover-color);
  }
  ::-webkit-scrollbar-track {
    background-color: var(--td-scroll-track-color);
  }
  .chat-box {
    position: relative;
    display: flex;
    height: 600px;
    
    // 侧边栏样式
    .sidebar {
      width: 260px;
      background: #f8f9fa;
      border-right: 1px solid #e1e5e9;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
      
      &.sidebar-collapsed {
        width: 60px;
        
        .sidebar-header .logo-text {
          display: none;
        }
      }
      
      .sidebar-header {
        padding: 16px;
        border-bottom: 1px solid #e1e5e9;
        
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          
          .logo {
            display: flex;
            align-items: center;
            gap: 8px;
            
            .logo-icon {
              font-size: 24px;
            }
            
            .logo-text {
              font-size: 18px;
              font-weight: 600;
              color: #2c3e50;
            }
          }
          
          .collapse-btn {
            padding: 4px 8px;
            border: none;
            background: transparent;
            border-radius: 6px;
            cursor: pointer;
            color: #6c757d;
            font-size: 12px;
            transition: all 0.2s ease;
            
            &:hover {
              background: #e9ecef;
              color: #2c3e50;
            }
          }
        }
        
        .new-chat-btn {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #4285f4;
          background: transparent;
          color: #4285f4;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
          
          &:hover {
            background: #4285f4;
            color: white;
          }
        }
      }
      
      .chat-history {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        
        .history-section {
          margin-bottom: 16px;
          
          .section-title {
            font-size: 12px;
            color: #6c757d;
            margin-bottom: 8px;
            padding: 0 8px;
            font-weight: 500;
          }
          
          .chat-item {
            padding: 12px;
            margin-bottom: 4px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            
            &:hover {
              background: #e9ecef;
              
              .chat-actions .delete-btn {
                opacity: 1;
              }
            }
            
            &.active {
              background: #e3f2fd;
              border-left: 3px solid #4285f4;
            }
            
            .chat-title {
              font-size: 14px;
              color: #2c3e50;
              line-height: 1.4;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              flex: 1;
              margin-right: 8px;
            }
            
            .chat-actions {
              .delete-btn {
                padding: 4px;
                border: none;
                background: transparent;
                border-radius: 4px;
                cursor: pointer;
                opacity: 0;
                transition: all 0.2s ease;
                font-size: 12px;
                
                &:hover {
                  background: #f1f3f4;
                }
              }
            }
          }
        }
      }
    }
    
    // 主聊天区域
    .main-chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
      
      &.expanded {
        width: calc(100% - 60px);
      }
    }
    
    // 欢迎页面样式
    .chat-welcome {
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      
      .welcome-content {
        max-width: 600px;
        width: 100%;
        text-align: center;
        
        .welcome-header {
          margin-bottom: 40px;
          
          .ai-icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.9;
          }
          
          .welcome-title {
            font-size: 28px;
            font-weight: 600;
            color: #2c3e50;
            margin: 0;
            line-height: 1.3;
          }
        }
        
        .welcome-input-section {
          margin-bottom: 32px;
          
          .input-wrapper {
            position: relative;
            max-width: 480px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid #e1e8ed;
            overflow: hidden;
            transition: all 0.3s ease;
            
            &:focus-within {
              box-shadow: 0 6px 30px rgba(0, 0, 0, 0.15);
              border-color: #4285f4;
            }
          }
          
          .welcome-input {
            width: 100%;
            padding: 16px 120px 16px 20px;
            border: none;
            outline: none;
            font-size: 16px;
            background: transparent;
            color: #2c3e50;
            
            &::placeholder {
              color: #8e9aaf;
            }
          }
          
          .input-actions {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .action-btn {
            width: 32px;
            height: 32px;
            border: none;
            background: transparent;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: all 0.2s ease;
            
            &:hover {
              background: #f0f2f5;
            }
          }
          
          .send-btn {
            width: 32px;
            height: 32px;
            border: none;
            background: #4285f4;
            color: white;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.2s ease;
            
            &:hover:not(:disabled) {
              background: #3367d6;
              transform: scale(1.05);
            }
            
            &:disabled {
              background: #e0e0e0;
              cursor: not-allowed;
            }
          }
        }
        
        .quick-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          
          .suggestion-btn {
            padding: 12px 20px;
            border: 1px solid #d0d7de;
            background: white;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            color: #57606a;
            transition: all 0.2s ease;
            white-space: nowrap;
            
            &:hover {
              border-color: #4285f4;
              color: #4285f4;
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(66, 133, 244, 0.2);
            }
          }
        }
      }
    }
    .bottomBtn {
      position: absolute;
      left: 50%;
      margin-left: -20px;
      bottom: 210px;
      padding: 0;
      border: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      box-shadow: 0px 8px 10px -5px rgba(0, 0, 0, 0.08), 0px 16px 24px 2px rgba(0, 0, 0, 0.04),
        0px 6px 30px 5px rgba(0, 0, 0, 0.05);
    }
    .to-bottom {
      width: 40px;
      height: 40px;
      border: 1px solid #dcdcdc;
      box-sizing: border-box;
      background: var(--td-bg-color-container);
      border-radius: 50%;
      font-size: 24px;
      line-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      .t-icon {
        font-size: 24px;
      }
    }
  }
  
  .model-select {
    display: flex;
    align-items: center;
    .t-select {
      width: 112px;
      height: 32px;
      margin-right: 8px;
      .t-input {
        border-radius: 32px;
        padding: 0 15px;
      }
    }
    .check-box {
      width: 112px;
      height: 32px;
      border-radius: 32px;
      border: 0;
      background: #e7e7e7;
      color: rgba(0, 0, 0, 0.9);
      box-sizing: border-box;
      flex: 0 0 auto;
      .t-button__text {
        display: flex;
        align-items: center;
        justify-content: center;
        span {
          margin-left: 4px;
        }
      }
    }
    .check-box.is-active {
      border: 1px solid #d9e1ff;
      background: #f2f3ff;
      color: var(--td-brand-color);
    }
  }
  </style>
  