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
          
          <!-- <div class="history-section" v-if="yesterdayChats.length > 0">
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
          </div> -->
          
          <div class="history-section" v-if="olderChats.length > 0">
            <div class="section-title">历史对话</div>
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
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { MockSSEResponse } from './mockdata/sseRequest-reasoning';
  import { ArrowDownIcon, CheckCircleIcon } from 'tdesign-icons-vue-next';
  import { useRouter } from 'vue-router';
  // MCP 相关依赖,包括初始化 MCP Server、获取工具定义、执行工具调用
  import { initMcpServer, getToolDefinitions, executeToolCall } from '@/mcp';
  import { useChatStore } from '@/stores/modules/chat';
  
  const router = useRouter();
  const abortController = ref(null); // 用于中断请求
  
  // 使用 Chat Store
  const chatStore = useChatStore();
  
  // 初始化 MCP Server 和加载会话列表
  onMounted(async () => {
    initMcpServer();
    // 加载会话列表
    try {
      await chatStore.fetchSessions();
      console.log('会话列表加载成功');
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  });
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
  
  // 使用 Store 的数据（替换本地状态）
  const currentChatId = computed(() => chatStore.currentSessionId);
  const todayChats = computed(() => chatStore.todayChats);
  const yesterdayChats = computed(() => chatStore.yesterdayChats);
  const olderChats = computed(() => chatStore.olderChats);

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

  // 快捷操作处理函数
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

  const startNewChat = async () => {
    try {
      // 1. 如果当前有未保存的消息，先保存
      if (chatList.value.length > 0 && currentChatId.value) {
        await saveCurrentChat();
      }
      
      // 2. 创建新会话（后端）
      const newSession = await chatStore.createSession('新对话');
      console.log('创建新会话成功:', newSession.id);
      
      // 3. 清空本地消息列表
      chatList.value = [];
    } catch (error) {
      console.error('创建新会话失败:', error);
      // 降级方案：如果 API 失败，仍然创建本地会话
      const newChatId = 'chat-' + Date.now();
      chatStore.currentSessionId = newChatId;
      chatList.value = [];
    }
  };

  const switchToChat = async (chatId) => {
    try {
      // 1. 保存当前会话（如果有未保存的消息）
      if (chatList.value.length > 0 && currentChatId.value) {
        await saveCurrentChat();
      }
      
      // 2. 从后端加载会话详情
      await chatStore.loadSessionDetail(chatId);
      console.log('切换到会话:', chatId, '消息数:', chatStore.currentMessages.length);
      
      // 3. 同步到本地 chatList（Store 中的消息已经是倒序）
      chatList.value = [...chatStore.currentMessages];
    } catch (error) {
      console.error('切换会话失败:', error);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await chatStore.deleteSession(chatId);
      console.log('删除会话成功:', chatId);
      
      // 如果删除的是当前会话，清空消息列表
      if (currentChatId.value === chatId) {
        chatList.value = [];
      }
    } catch (error) {
      console.error('删除会话失败:', error);
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
  
  // 输入处理函数
  const inputEnter = async function (inputValue) {
    if (isStreamLoad.value) {
      return;
    }
    if (!inputValue) return;

    // 如果是第一条消息且没有当前聊天ID，创建新聊天
    if (chatList.value.length === 0 && !currentChatId.value) {
      try {
        const newSession = await chatStore.createSession(
          generateChatTitle(inputValue),
          inputValue
        );
        console.log('自动创建新会话:', newSession.id);
      } catch (error) {
        console.error('自动创建会话失败:', error);
        // 降级方案：创建本地临时会话
        const newChatId = 'chat-' + Date.now();
        chatStore.currentSessionId = newChatId;
      }
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
  
  const handleData = async (userMessage, isRecursive = false) => {
    loading.value = true;
    isStreamLoad.value = true;
    const lastItem = chatList.value[0];
    
    if (!isRecursive) {
        abortController.value = new AbortController();
    }
    
    try {
      // 构建消息历史，保留最近 20 条上下文以支持多轮对话
      // 注意：这里不再简单 slice(1) 且 reverse，而是要保留 tool 调用的完整链路
      // chatList 是倒序的 (最新的在 index 0)，所以我们需要反转   
      const fullHistory = [...chatList.value].reverse();
      // 移除最后一个（也就是当前的 lastItem，即正在生成的空 assistant 消息）
      fullHistory.pop(); 
      const recentMessages = fullHistory.slice(-20).map(msg => {
          const apiMsg = {
              role: msg.role,
              content: msg.content || '' // OpenAI 不允许 null content (除非有 tool_calls)
          };
          if (msg.tool_calls) apiMsg.tool_calls = msg.tool_calls;
          if (msg.tool_call_id) apiMsg.tool_call_id = msg.tool_call_id;
          return apiMsg;
      });
      
      // 如果不是递归（即这是用户的新消息），添加用户消息
      // 递归时，用户消息已经在 chatList 历史中了
      if (userMessage) {
        recentMessages.push({
          role: 'user',
          content: userMessage
        });
      }
      // 获取工具定义
      const tools = getToolDefinitions();
      // 调用 API (使用非流式以简化 Tool Call 处理)
      const response = await getChatDataStream(recentMessages, {
        signal: abortController.value.signal,
        tools: tools.length > 0 ? tools : undefined,
        stream: false
      });
      const data = await response.json();
      if (data.error) {
          throw new Error(data.error.message || 'API Error');
      }
      const message = data.choices[0].message;
      // 1. 检查是否有 Tool Calls
      if (message.tool_calls) {
          // 更新当前 Assistant 消息，记录 tool_calls
          // 注意：这里要把本次 AI 的回复（可能包含 content 和 tool_calls）完整记录
          if (message.content) lastItem.content = message.content;
          lastItem.tool_calls = message.tool_calls;
          // 在 UI 上显示提示
          lastItem.content += (lastItem.content ? '\n\n' : '') + '⚙️ 正在处理待办指令...';
          // 遍历执行所有工具
          for (const toolCall of message.tool_calls) {
              const fnName = toolCall.function.name;
              let fnArgs = {};
              try {
                  fnArgs = JSON.parse(toolCall.function.arguments);
              } catch (e) {
                  console.error('解析工具参数失败', e);
              }
              // 执行本地 MCP 工具
              const result = await executeToolCall(fnName, fnArgs);
              // 将 Tool 结果插入到 chatList (头部插入，因为 chatList 是倒序)
              chatList.value.unshift({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(result),
                  name: fnName,
                  datetime: new Date().toDateString(),
                  avatar: 'https://tdesign.gtimg.com/site/chat-avatar.png', // 保持格式一致
              });
          }
          // 准备下一轮对话：创建一个新的 Assistant 占位符用于显示最终结果
          const nextAssistantItem = {
              avatar: 'https://tdesign.gtimg.com/site/chat-avatar.png',
              name: 'LTBOT',
              datetime: new Date().toDateString(),
              content: '', 
              role: 'assistant',
          };
          chatList.value.unshift(nextAssistantItem);
          // 递归调用 AI，让它看到 Tool 结果并生成回复
          await handleData(null, true);
          return;
      }

      // 2. 普通回复 (无 Tool Calls)
      if (message.content) {
          // 如果是递归调用回来的，替换掉之前的"正在执行..."提示（如果想保留也可以追加）
          // 这里我们选择直接显示最终结果
          lastItem.content = message.content;
      }
      
      // 【新增】对话完成后，自动保存到数据库
      if (!isRecursive && currentChatId.value) {
        try {
          // 保存最新的两条消息（用户消息 + AI 回复）
          const latestMessages = chatList.value.slice(0, 2).map(msg => ({
            role: msg.role,
            content: msg.content,
            avatar: msg.avatar,
            name: msg.name,
            datetime: msg.datetime,
            reasoning: msg.reasoning,
            tool_calls: msg.tool_calls,
            tool_call_id: msg.tool_call_id
          }));
          
          await chatStore.saveMessages(currentChatId.value, latestMessages);
          console.log('消息已自动保存到数据库');
        } catch (error) {
          console.error('保存消息失败:', error);
        }
      }
      
      isStreamLoad.value = false;
      loading.value = false;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('请求已被用户中断');
        lastItem.content += '\n[已中断]';
      } else {
        console.error('DeepSeek API 调用失败:', error);
        lastItem.content += `\n[错误: ${error.message}]`;
      }
      isStreamLoad.value = false;
      loading.value = false;
    } finally {
      if (!isRecursive) {
          abortController.value = null;
      }
    }
  };
  // DeepSeek API 配置
  const DEEPSEEK_CONFIG = {
    apiUrl: import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '', // 请在 .env 文件中设置 VITE_DEEPSEEK_API_KEY
    model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat',
    maxTokens: 2048,
    temperature: 0.7
  };
  console.log('DEEPSEEK_CONFIG', DEEPSEEK_CONFIG);

  // 调用 DeepSeek API 获取聊天数据
  const getChatDataStream = async (messages, options = {}) => {
    try {
      const {
        model = DEEPSEEK_CONFIG.model,
        maxTokens = DEEPSEEK_CONFIG.maxTokens,
        temperature = DEEPSEEK_CONFIG.temperature,
        signal = null,
        tools = undefined,
        stream = true
      } = options;

      const requestBody = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream,
        tools
      };

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
        },
        body: JSON.stringify(requestBody)
      };

      if (signal) {
        fetchOptions.signal = signal;
      }

      const response = await fetch(DEEPSEEK_CONFIG.apiUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`DeepSeek API Error: ${response.status} ${response.statusText}`);
      }

      return response;

    } catch (error) {
      console.error('DeepSeek API 调用失败:', error);
      throw error;
    }
  };
  
  // 保存当前会话（辅助函数）
  const saveCurrentChat = async () => {
    if (!currentChatId.value || chatList.value.length === 0) {
      return;
    }
    
    try {
      // 计算需要保存的新消息
      // Store 中已保存的消息数量
      const savedCount = chatStore.currentMessages.length;
      // 本地新增的消息（chatList 是倒序的）
      const newMessages = chatList.value.slice(0, chatList.value.length - savedCount);
      
      if (newMessages.length > 0) {
        // 转换消息格式
        const messagesToSave = newMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          avatar: msg.avatar,
          name: msg.name,
          datetime: msg.datetime,
          reasoning: msg.reasoning,
          tool_calls: msg.tool_calls,
          tool_call_id: msg.tool_call_id
        }));
        
        await chatStore.saveMessages(currentChatId.value, messagesToSave);
        console.log('保存了', newMessages.length, '条新消息');
      }
    } catch (error) {
      console.error('保存会话失败:', error);
    }
  };
  
  // 组件卸载前保存当前会话
  onBeforeUnmount(async () => {
    if (chatList.value.length > 0 && currentChatId.value) {
      await saveCurrentChat();
      console.log('组件卸载前已保存会话');
    }
  });
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
        width: 80px;
        
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
  