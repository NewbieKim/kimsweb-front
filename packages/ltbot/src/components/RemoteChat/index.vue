<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  ChatProvider, // 作用：提供聊天上下文，包括会话列表、消息列表、输入框等。
  DEFAULT_SESSION_TITLE, // 默认会话标题
  MessageList,
  PromptInput, // 作用：提供输入框，包括文本输入、表情输入、语音输入等。
  SessionList, // 作用：提供会话列表，包括会话列表、会话列表项等。
  TokenIndicator, // 作用：提供 token 指示器，包括 token 指示器、token 指示器项等。
  createMockSseRuntime, // 作用：创建本地 mock 流，用于本地开发和调试。
  createStreamingRuntime, // 作用：创建真实 SSE 流，用于生产环境。
  deriveSessionTitle, // 作用：根据消息内容自动生成会话标题。
  // useChatSessions, // 已改为数据库持久化，localStorage 版会话管理不再使用（见下方注释块）
} from "@ain-framework/remote-chat-sdk";
import type {
  ChatMessage as SdkChatMessage, // 作用：提供消息，包括消息、消息项等。
  ChatRuntime, // 作用：提供聊天运行时，包括聊天运行时、聊天运行时项等。
  ChatSession as SdkChatSession, // 作用：提供会话，包括会话、会话项等。
} from "@ain-framework/remote-chat-sdk";
import { useChatStore } from "@/stores/modules/chat";
import type { ChatMessage as DbChatMessage, ChatSession as DbChatSession } from "@/types";

/**
 * RemoteChat —— 远程聊天组件（基于 @ain-framework/remote-chat-sdk 1.x）。
 * 两种形态：
 *   - 默认「悬浮窗」：按钮 + 浮动面板（Teleport 到 body）。
 *   - embedded 内嵌模式：不渲染悬浮按钮，面板填满父容器（供 AISidebar 等使用），
 *     点击关闭按钮会向父组件 emit('close')，由父组件决定是否收起。
 * 默认使用 createMockSseRuntime（本地 mock 流，开箱可用）；
 * 配置 VITE_REMOTE_CHAT_API 后自动切换 createStreamingRuntime 对接真实 SSE 后端。
 * 会话元信息与消息内容均持久化到数据库（复用 ChatBot 的 chat store / api，Redis 存储）。
 */

const props = withDefaults(defineProps<{ embedded?: boolean }>(), {
  embedded: false,
});
const emit = defineEmits<{ close: [] }>();

const DRAFT_KEY_PREFIX = "ltbot:remote-chat:draft";

// ===== 旧实现：useChatSessions + localStorage 消息归档（已弃用，注释保留） =====
// const STORAGE_KEY_SESSIONS = "ltbot:remote-chat:sessions";
// const STORAGE_KEY_MESSAGES = "ltbot:remote-chat:session-messages";
//
// function useSessionMessages(storageKey: string) {
//   const archive = ref<Record<string, ChatMessage[]>>(readArchive(storageKey));
//
//   function persist() {
//     try {
//       localStorage.setItem(storageKey, JSON.stringify(archive.value));
//     } catch {
//       // 隐私模式等：仅驻留内存
//     }
//   }
//
//   function save(sessionId: string, messages: readonly ChatMessage[]) {
//     archive.value = { ...archive.value, [sessionId]: cloneMessages(messages) };
//     persist();
//   }
//
//   function load(sessionId: string): ChatMessage[] {
//     const stored = archive.value[sessionId];
//     return stored ? cloneMessages(stored) : [];
//   }
//
//   function remove(sessionId: string) {
//     if (!(sessionId in archive.value)) return;
//     const next = { ...archive.value };
//     delete next[sessionId];
//     archive.value = next;
//     persist();
//   }
//
//   return { save, load, remove };
// }
//
// function readArchive(storageKey: string): Record<string, ChatMessage[]> {
//   if (typeof localStorage === "undefined") return {};
//   try {
//     const raw = localStorage.getItem(storageKey);
//     if (!raw) return {};
//     const parsed: unknown = JSON.parse(raw);
//     if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
//     return parsed as Record<string, ChatMessage[]>;
//   } catch {
//     return {};
//   }
// }
//
// function cloneMessages(messages: readonly ChatMessage[]): ChatMessage[] {
//   return JSON.parse(JSON.stringify(messages)) as ChatMessage[];
// }
//
// const { sessions, activeSessionId, activeSession, create, rename, remove, switchTo, touch } =
//   useChatSessions({ storageKey: STORAGE_KEY_SESSIONS });
// const archive = useSessionMessages(STORAGE_KEY_MESSAGES);

/* ==================== 数据库持久化（复用 ChatBot 的 chat store / api） ==================== */
const chatStore = useChatStore();

const open = ref(false);
const historyOpen = ref(false);
const detached = ref(false);

// 会话列表：SDK SessionList 只需要 id/title/createdAt/updatedAt，按 updatedAt 倒序展示
const sessions = computed<SdkChatSession[]>(() =>
  [...chatStore.sessions]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
);

const activeSessionId = computed<string>(() => chatStore.currentSessionId ?? "");
const activeSession = computed<SdkChatSession | undefined>(() =>
  sessions.value.find((s) => s.id === activeSessionId.value),
);
const LOCALURL = 'http://localhost:6688/api'
const PRODURL = 'https://ltbot.top/api' // 生产环境地址
const API_BASE_URL = process.env.NODE_ENV === 'production' ? PRODURL : LOCALURL // 发送真实会话请求的server api
const apiUrl = `${API_BASE_URL}/chatAgent`;
const runtime: ChatRuntime = apiUrl
  ? createStreamingRuntime({
      api: apiUrl,
      onError: (error) => console.error(`调用${apiUrl}失败`, error),
    })
  : createMockSseRuntime({ frameDelayMs: 30 });

/* ---------- 消息格式转换（SDK parts <-> 数据库 ChatMessage） ---------- */
function generateMessageId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sdkToDbMessage(message: SdkChatMessage): DbChatMessage {
  const textPart = message.parts.find((p) => p.type === "text");
  const reasoningPart = message.parts.find((p) => p.type === "reasoning");
  return {
    role: message.role === "user" ? "user" : message.role === "assistant" ? "assistant" : "tool",
    content: textPart?.text ?? "",
    avatar:
      message.role === "user"
        ? "https://tdesign.gtimg.com/site/avatar.jpg"
        : "https://tdesign.gtimg.com/site/chat-avatar.png",
    name: message.role === "user" ? "自己" : "LTBOT",
    datetime: message.createdAt ?? new Date().toISOString(),
    reasoning: reasoningPart?.text,
  };
}

function dbToSdkMessage(message: DbChatMessage): SdkChatMessage {
  const parts: SdkChatMessage["parts"] = [];
  if (message.reasoning) parts.push({ type: "reasoning", text: message.reasoning });
  if (message.content) parts.push({ type: "text", text: message.content });
  return {
    id: generateMessageId(),
    role: message.role === "user" ? "user" : "assistant",
    parts,
    createdAt: message.datetime,
  };
}

/* ---------- 会话切换 / 消息增量持久化 ---------- */
let switching = false;

async function withSessionSwitch(work: () => void | Promise<void>) {
  switching = true;
  try {
    await work();
  } finally {
    await nextTick();
    switching = false;
  }
}

// 记录每个会话已成功保存到数据库的消息条数，只增量保存，避免重复入库
const savedMessageCount = new Map<string, number>();

// 串行化持久化请求，防止快速切换会话时并发写库
let persistQueue: Promise<void> = Promise.resolve();

// 持久化当前会话消息
function persistCurrentMessages(): Promise<void> {
  const sessionId = activeSessionId.value;
  if (!sessionId) return Promise.resolve();
  const messages = [...runtime.messages.value] as SdkChatMessage[];
  const savedCount = savedMessageCount.get(sessionId) ?? 0;
  if (messages.length <= savedCount) return Promise.resolve();

  persistQueue = persistQueue.then(async () => {
    const saved = savedMessageCount.get(sessionId) ?? 0;
    const delta = messages.slice(saved);
    if (delta.length === 0) return;
    try {
      // chatStore.saveMessages 期望倒序（新在前），内部会转正序后提交给后端
      const result = await chatStore.saveMessages(sessionId, [...delta.map(sdkToDbMessage)].reverse());
      savedMessageCount.set(sessionId, result.totalMessages);
      // 标题自动生成（仅当用户仍停留在该会话时）
      if (activeSessionId.value === sessionId) maybeAutotitle();
    } catch (error) {
      console.error("[remote-chat] 保存消息到数据库失败", error);
    }
  });
  return persistQueue;
}

// 加载当前会话消息
async function loadActiveMessages(sessionId: string) {
  try {
    await chatStore.loadSessionDetail(sessionId); // 加载会话详情：获取会话的详细信息，包括会话的标题、消息列表、会话的创建时间、会话的更新时间等。
    // currentMessages 为倒序（新在前），转回正序后灌入 runtime
    const messages = [...chatStore.currentMessages].reverse();
    runtime.setMessages(messages.map(dbToSdkMessage)); // 将数据库中的消息转换为 SDK 消息，并设置到 runtime 中。
    savedMessageCount.set(sessionId, messages.length); // 记录已保存的消息条数。
  } catch (error) {
    console.error("[remote-chat] 加载会话消息失败", error);
    runtime.setMessages([]);
    savedMessageCount.set(sessionId, 0);
  }
}

async function renameSession(id: string, title: string) {
  try {
    await chatStore.updateSessionTitle(id, title);
  } catch (error) {
    console.error("[remote-chat] 更新会话标题失败", error);
  }
}

function maybeAutotitle() {
  if (activeSession.value?.title !== DEFAULT_SESSION_TITLE) return;
  const title = deriveSessionTitle(runtime.messages.value as SdkChatMessage[]);
  if (title) void renameSession(activeSessionId.value, title);
}

// 流结束后把新增消息保存到数据库
watch(
  () => runtime.status.value,
  (status, prev) => {
    if (switching) return;
    if (prev === "streaming" && status !== "streaming") {
      void persistCurrentMessages();
    }
  },
);

function createLocalSession(title: string): DbChatSession {
  const id = `chat-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const session: DbChatSession = {
    id,
    title,
    lastMessage: "",
    timestamp: Math.floor(Date.now() / 1000),
    createdAt: nowIso,
    updatedAt: nowIso,
    messageCount: 0,
  };
  chatStore.sessions.unshift(session);
  chatStore.currentSessionId = id;
  return session;
}

/* ---------- 会话操作（新建 / 切换 / 重命名 / 删除） ---------- */
async function handleCreate() {
  historyOpen.value = false;
  if (runtime.messages.value.length === 0 && activeSession.value?.title === DEFAULT_SESSION_TITLE) {
    return;
  }
  if (runtime.status.value === "streaming") runtime.stop();
  await persistCurrentMessages();
  await withSessionSwitch(async () => {
    try {
      const session = await chatStore.createSession(DEFAULT_SESSION_TITLE);
      savedMessageCount.set(session.id, 0);
    } catch (error) {
      console.error("[remote-chat] 创建会话失败，使用本地临时会话", error);
      const session = createLocalSession(DEFAULT_SESSION_TITLE);
      savedMessageCount.set(session.id, 0);
    }
    runtime.setMessages([]);
  });
}

async function handleSelect(id: string) {
  historyOpen.value = false;
  if (id === activeSessionId.value) return;
  if (runtime.status.value === "streaming") runtime.stop();
  await persistCurrentMessages();
  await withSessionSwitch(async () => {
    await loadActiveMessages(id);
  });
}

async function handleRename(id: string, title: string) {
  await renameSession(id, title);
}

async function handleDelete(id: string) {
  const wasActive = id === activeSessionId.value;
  if (wasActive && runtime.status.value === "streaming") runtime.stop();
  try {
    await chatStore.deleteSession(id);
  } catch (error) {
    console.error("[remote-chat] 删除会话失败", error);
    return;
  }
  if (!wasActive) return;
  await withSessionSwitch(async () => {
    const next = chatStore.sessions[0];
    if (next) {
      await loadActiveMessages(next.id);
    } else {
      try {
        const session = await chatStore.createSession(DEFAULT_SESSION_TITLE);
        savedMessageCount.set(session.id, 0);
      } catch (error) {
        console.error("[remote-chat] 创建会话失败，使用本地临时会话", error);
        const session = createLocalSession(DEFAULT_SESSION_TITLE);
        savedMessageCount.set(session.id, 0);
      }
      runtime.setMessages([]);
    }
  });
}

function toggleOpen() {
  open.value = !open.value;
  if (!open.value) historyOpen.value = false;
}

function handleCloseClick() {
  if (props.embedded) {
    emit("close");
  } else {
    toggleOpen();
  }
}

const dragPos = ref<{ x: number; y: number } | null>(null);
const isDragging = ref(false);
const dragStart = ref({ pointerX: 0, pointerY: 0, x: 0, y: 0 });

function toggleDetached() {
  detached.value = !detached.value;
  if (!detached.value) {
    dragPos.value = null;
    isDragging.value = false;
  }
}

function onHeaderMouseDown(event: MouseEvent) {
  if (!detached.value) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest("button")) return;
  event.preventDefault();
  dragStart.value = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    x: dragPos.value?.x ?? window.innerWidth - 444,
    y: dragPos.value?.y ?? 24,
  };
  isDragging.value = true;
  document.addEventListener("mousemove", onHeaderMouseMove);
  document.addEventListener("mouseup", onHeaderMouseUp);
}

function onHeaderMouseMove(event: MouseEvent) {
  if (!isDragging.value) return;
  dragPos.value = {
    x: dragStart.value.x + (event.clientX - dragStart.value.pointerX),
    y: dragStart.value.y + (event.clientY - dragStart.value.pointerY),
  };
}

function onHeaderMouseUp() {
  if (!isDragging.value) return;
  isDragging.value = false;
  document.removeEventListener("mousemove", onHeaderMouseMove);
  document.removeEventListener("mouseup", onHeaderMouseUp);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    historyOpen.value = false;
    if (props.embedded) {
      emit("close");
    } else {
      open.value = false;
    }
  }
}

onMounted(async () => {
  window.addEventListener("keydown", onKeydown);
  try {
    await chatStore.fetchSessions();
  } catch (error) {
    console.error("[remote-chat] 加载会话列表失败", error);
  }
  const first = chatStore.sessions[0];
  if (first) {
    await loadActiveMessages(first.id);
  } else {
    try {
      const session = await chatStore.createSession(DEFAULT_SESSION_TITLE);
      savedMessageCount.set(session.id, 0);
      runtime.setMessages([]);
    } catch (error) {
      console.error("[remote-chat] 初始化会话失败，使用本地临时会话", error);
      const session = createLocalSession(DEFAULT_SESSION_TITLE);
      savedMessageCount.set(session.id, 0);
    }
  }
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  document.removeEventListener("mousemove", onHeaderMouseMove);
  document.removeEventListener("mouseup", onHeaderMouseUp);
  void persistCurrentMessages();
});
</script>

<template>
  <Teleport to="body" :disabled="embedded && !detached">
    <div class="ltbot-remote-chat" :class="{ 'ltbot-remote-embedded': embedded }">
      <button
        v-if="!embedded && !open"
        type="button"
        class="ltbot-remote-fab"
        aria-label="打开 Remote AI 助手"
        @click="toggleOpen"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 3c-4.97 0-9 3.36-9 7.5 0 1.73.68 3.32 1.8 4.62L4 20l4.06-1.85c1.2.5 2.53.78 3.94.78 4.97 0 9-3.36 9-7.5S16.97 3 12 3Z"
          />
          <path stroke-linecap="round" d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
        </svg>
        <span>Remote</span>
      </button>

      <div
        v-if="embedded || open"
        class="ltbot-remote-panel"
        :class="{ 'ltbot-remote-panel--embedded': embedded && !detached }"
        :style="detached && dragPos ? { left: dragPos.x + 'px', top: dragPos.y + 'px' } : undefined"
        role="dialog"
        aria-label="Remote AI 助手"
      >
        <!-- 顶栏 -->
        <header class="ltbot-remote-header" @mousedown="onHeaderMouseDown">
          <div class="ltbot-remote-title">
            <span class="ltbot-remote-logo">AI</span>
            <div>
              <div class="ltbot-remote-name">Remote AI 助手</div>
              <div class="ltbot-remote-sub">
                {{ apiUrl ? "真实 SSE 流" : "本地 Mock SSE 流" }}
              </div>
            </div>
          </div>
          <div class="ltbot-remote-actions">
            <button
              type="button"
              class="ltbot-remote-icon-btn"
              title="新建对话"
              aria-label="新建对话"
              @click="handleCreate"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <rect x="5" y="5" width="14" height="14" rx="3" />
                <path stroke-linecap="round" d="M12 8.5v7M8.5 12h7" />
              </svg>
            </button>
            <button
              type="button"
              class="ltbot-remote-icon-btn"
              :class="historyOpen ? 'ltbot-remote-icon-btn-active' : ''"
              title="历史对话"
              aria-label="历史对话"
              :aria-expanded="historyOpen"
              @click="historyOpen = !historyOpen"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12a9 9 0 1 0 3-6.7" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5V8h3.5M12 7.5V12l3 1.5" />
              </svg>
            </button>
            <button
              v-if="embedded"
              type="button"
              class="ltbot-remote-icon-btn"
              :class="detached ? 'ltbot-remote-icon-btn-active' : ''"
              :title="detached ? '嵌入侧边栏' : '悬浮对话弹框'"
              :aria-label="detached ? '嵌入侧边栏' : '悬浮对话弹框'"
              :aria-pressed="detached"
              @click="toggleDetached"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 3h6v6" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 14 21 3" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
            </button>
            <button
              type="button"
              class="ltbot-remote-icon-btn"
              title="关闭"
              aria-label="关闭"
              @click="handleCloseClick"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </header>

        <!-- 历史会话侧栏 -->
        <div v-if="historyOpen" class="ltbot-remote-history-mask" @click="historyOpen = false" />
        <div v-if="historyOpen" class="ltbot-remote-history" @click.stop>
          <SessionList
            :sessions="sessions"
            :active-session-id="activeSessionId"
            @select="handleSelect"
            @rename="handleRename"
            @delete="handleDelete"
          />
        </div>

        <!-- 对话区 -->
        <ChatProvider :runtime="runtime">
          <div class="ltbot-remote-body">
            <div class="ltbot-remote-messages">
              <MessageList />
            </div>
            <div class="ltbot-remote-input">
              <div class="ltbot-remote-tokens">
                <TokenIndicator />
              </div>
              <PromptInput
                :key="activeSessionId"
                :draft-key="`${DRAFT_KEY_PREFIX}:${activeSessionId}`"
              />
            </div>
          </div>
        </ChatProvider>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ltbot-remote-chat {
  font-family:
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
  color-scheme: light;
}

/* 内嵌模式：填满父容器 */
.ltbot-remote-embedded {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 悬浮按钮 */
.ltbot-remote-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #4338ca 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow:
    0 12px 32px -12px rgba(79, 70, 229, 0.65),
    0 4px 12px rgba(15, 23, 42, 0.12);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.ltbot-remote-fab svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.ltbot-remote-fab:hover {
  transform: translateY(-2px);
  box-shadow:
    0 18px 40px -12px rgba(79, 70, 229, 0.7),
    0 6px 16px rgba(15, 23, 42, 0.16);
}

/* 对话浮窗 */
.ltbot-remote-panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  width: min(420px, calc(100vw - 48px));
  height: min(76vh, 680px);
  overflow: hidden;
  border-radius: 18px;
  background: #ffffff;
  box-shadow:
    0 32px 80px -24px rgba(15, 23, 42, 0.45),
    0 0 0 1px rgba(99, 102, 241, 0.12);
  animation: ltbot-remote-pop 0.18s ease-out;
}

/* 悬浮弹框：头部可拖拽 */
.ltbot-remote-panel:not(.ltbot-remote-panel--embedded) .ltbot-remote-header {
  cursor: move;
  user-select: none;
}

/* 内嵌面板：跟随父容器尺寸 */
.ltbot-remote-panel--embedded {
  position: relative;
  right: auto;
  bottom: auto;
  z-index: auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 0;
  box-shadow: none;
  animation: none;
}

@keyframes ltbot-remote-pop {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 顶栏 */
.ltbot-remote-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 60px;
  padding: 0 16px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #4338ca 100%);
  color: #ffffff;
}
.ltbot-remote-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.ltbot-remote-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 13px;
  font-weight: 700;
}
.ltbot-remote-name {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}
.ltbot-remote-sub {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.2;
  opacity: 0.78;
}
.ltbot-remote-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.ltbot-remote-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  transition: background 0.15s ease;
}
.ltbot-remote-icon-btn svg {
  width: 17px;
  height: 17px;
}
.ltbot-remote-icon-btn:hover,
.ltbot-remote-icon-btn-active {
  background: rgba(255, 255, 255, 0.16);
}

/* 历史会话 */
.ltbot-remote-history-mask {
  position: absolute;
  inset: 60px 0 0 0;
  z-index: 20;
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(1px);
}
.ltbot-remote-history {
  position: absolute;
  top: 70px;
  right: 12px;
  z-index: 30;
  width: min(260px, calc(100% - 24px));
  height: calc(100% - 82px);
  overflow: hidden;
  border-radius: 12px;
  background: #ffffff;
  box-shadow:
    0 20px 48px -16px rgba(15, 23, 42, 0.35),
    0 0 0 1px rgba(226, 232, 240, 0.9);
}

/* 对话区 */
.ltbot-remote-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  text-align: left;
}
.ltbot-remote-messages {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.ltbot-remote-input {
  flex-shrink: 0;
  padding: 12px 14px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}
.ltbot-remote-tokens {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
</style>
