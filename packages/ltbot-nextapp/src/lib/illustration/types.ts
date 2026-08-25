export const ILLUSTRATION_JOB_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  SKIPPED: 'SKIPPED',
} as const;

export type IllustrationJobStatus =
  (typeof ILLUSTRATION_JOB_STATUS)[keyof typeof ILLUSTRATION_JOB_STATUS];

export const ILLUSTRATION_FRAME_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type IllustrationFrameStatus =
  (typeof ILLUSTRATION_FRAME_STATUS)[keyof typeof ILLUSTRATION_FRAME_STATUS];

export const PROVIDER_TYPES = {
  OPENAI_IMAGE: 'OPENAI_IMAGE',
  BYTEPLUS: 'BYTEPLUS',
  RECRAFT: 'RECRAFT',
  STABILITY_AI: 'STABILITY_AI',
  OTHER: 'OTHER',
} as const;

export type ProviderType = (typeof PROVIDER_TYPES)[keyof typeof PROVIDER_TYPES];

export const FAIL_REASON_CODES = {
  NONE: 'NONE',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  SIGNATURE_INVALID: 'SIGNATURE_INVALID',
  CALLBACK_MISSING: 'CALLBACK_MISSING',
  PROVIDER_REJECTED: 'PROVIDER_REJECTED',
  INVALID_INPUT: 'INVALID_INPUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type FailReasonCode =
  (typeof FAIL_REASON_CODES)[keyof typeof FAIL_REASON_CODES];

export interface StartIllustrationRequest {
  storyId: number;
  userId?: string;
  provider?: ProviderType;
  maxFrames?: number;
  forceRegenerate?: boolean;
  idempotencyKey?: string;
  triggerSource?: 'story_generated' | 'manual_retry' | 'ops_repair' | 'other';
}

export interface IllustrationWebhookPayload {
  provider: ProviderType;
  providerRequestId?: string;
  providerTaskId: string;
  storyId: number;
  jobId: number;
  frameIndex: number;
  status: 'SUCCESS' | 'FAILED' | 'PROCESSING';
  imageUrl?: string;
  width?: number;
  height?: number;
  errorCode?: string;
  errorMessage?: string;
  finishedAt?: string;
  rawPayload?: unknown;
}

export interface IllustrationProgressQuery {
  storyId: number;
  includeFailedFrames?: boolean;
  includePrompt?: boolean;
}

export interface IllustrationFrameDTO {
  frameIndex: number;
  status: IllustrationFrameStatus;
  imageUrl: string | null;
  failReasonCode: FailReasonCode | null;
  failReasonMessage: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  updatedAt: string;
}

export interface IllustrationProgressResponse {
  storyId: number;
  jobId: number | null;
  status: IllustrationJobStatus;
  generated: number;
  target: number;
  coverFrameIndex: 0;
  coverReady: boolean;
  frames: IllustrationFrameDTO[];
  updatedAt: string;
}

export interface IllustrationFeatureFlags {
  enabled: boolean;
  internalStartEnabled: boolean;
  webhookEnabled: boolean;
  progressiveRenderEnabled: boolean;
  overlayTextFallbackEnabled: boolean;
  allowProviderList: ProviderType[];
}

export interface QuotaPolicy {
  enabled: boolean;
  dailyImageBudget: number;
  monthlyImageBudget: number;
  perUserDailyLimit: number;
  perStoryFrameLimit: number;
  stopWhenExceeded: boolean;
}

export interface RetryPolicy {
  frameMaxRetries: number;
  webhookVerifyMaxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableReasons: FailReasonCode[];
}

export interface IllustrationFrameVM {
  key: string;
  frameIndex: number;
  imageUrl: string | null;
  status: 'placeholder' | 'loading' | 'ready' | 'failed';
  alt: string;
  caption?: string;
  canRetry: boolean;
  isCover: boolean;
}
