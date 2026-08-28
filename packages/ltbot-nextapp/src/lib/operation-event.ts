import { prisma } from '@/lib/prisma';

export const OPERATION_EVENT_TYPES = {
  PAGE_VIEW: 'page_view',
  STORY_CREATE: 'story_create',
  STORY_GENERATE_SUCCESS: 'story_generate_success',
  STORY_GENERATE_FAILED: 'story_generate_failed',
  TTS_PLAY: 'tts_play',
  FEEDBACK_SUBMIT: 'feedback_submit',
  AUTH_REGISTER: 'auth_register',
  AUTH_LOGIN_SUCCESS: 'auth_login_success',
  AUTH_LOGIN_FAILED: 'auth_login_failed',
  AUTH_RESET_PASSWORD: 'auth_reset_password',
} as const;

export type OperationEventType =
  (typeof OPERATION_EVENT_TYPES)[keyof typeof OPERATION_EVENT_TYPES];

export interface CreateOperationEventInput {
  eventType: string;
  userId?: string | null;
  visitorId?: string | null;
  storyId?: number | null;
  metadata?: unknown;
}

export async function createOperationEvent(input: CreateOperationEventInput) {
  const eventType = (input.eventType || '').trim();
  if (!eventType) {
    return null;
  }

  const metadata =
    input.metadata === undefined ? null : safeJsonStringify(input.metadata);

  return prisma.operationEvent.create({
    data: {
      eventType,
      userId: normalizeNullableString(input.userId),
      visitorId: normalizeNullableString(input.visitorId),
      storyId:
        typeof input.storyId === 'number' && Number.isFinite(input.storyId)
          ? input.storyId
          : null,
      metadata,
    },
  });
}

function normalizeNullableString(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ raw: String(value) });
  }
}
