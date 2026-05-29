export interface ApiEnvelope<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp?: string;
  error?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface OperationOverview {
  uv: number;
  registerUserCount: number;
  loginUserCount: number;
  totalUserCount: number;
  storyCreateCount: number;
  totalStoryCount: number;
  generateSuccessCount: number;
  generateFailedCount: number;
  generateSuccessRate: number;
  ttsPlayCount: number;
  feedbackCount: number;
}

export interface OperationTrendItem {
  date: string;
  uv: number;
  storyCreate: number;
}

export interface GenerateTrendItem {
  date: string;
  success: number;
  failed: number;
}

export interface FailedStoryItem {
  storyId: number;
  userId: string | null;
  themeSummary: string;
  failedAt: string;
  errorMessage: string;
}

export interface OperationMetrics {
  range: {
    startDate: string;
    endDate: string;
  };
  overview: OperationOverview;
  trend: OperationTrendItem[];
  funnel: {
    uv: number;
    loginOrRegister: number;
    storyCreate: number;
    generateSuccess: number;
    ttsPlay: number;
  };
  stability: {
    generateSuccessRate: number;
    generateFailedCount: number;
    recentFailedStories: FailedStoryItem[];
    generateTrend7Days: GenerateTrendItem[];
  };
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  age?: number | null;
  createdAt: string;
  updatedAt: string;
  extData: unknown;
  scoreBalance: number;
  storyCount: number;
  transactionCount: number;
  commentCount: number;
  lastActiveAt: string | null;
}

export interface AdminUserListResponse {
  list: AdminUserListItem[];
  pagination: Pagination;
}

export interface AdminUserDetailResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    age?: number | null;
    createdAt: string;
    updatedAt: string;
    extData: unknown;
    extDataRaw?: string | null;
    userScore?: {
      balance: number;
    } | null;
    stories: Array<{
      id: number;
      ageGroup: string;
      themeType: string;
      classicTheme?: string | null;
      classicSubTheme?: string | null;
      customTheme?: string | null;
      createdAt: string;
      updatedAt: string;
      _count: {
        likes: number;
        favorites: number;
        comments: number;
      };
    }>;
    scoreTransactions: Array<{
      id: number;
      transactionType: string;
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      description?: string | null;
      storyId?: number | null;
      musicId?: number | null;
      createdAt: string;
      story?: {
        id: number;
        customTheme?: string | null;
        classicTheme?: string | null;
        classicSubTheme?: string | null;
      } | null;
      music?: {
        id: number;
        musicStyle: string;
        description: string;
      } | null;
    }>;
    storyLikes: unknown[];
    storyFavorites: unknown[];
    storyComments: unknown[];
    musics: Array<{
      id: number;
      musicStyle: string;
      description: string;
      createdAt: string;
    }>;
  };
  overview: {
    scoreBalance: number;
    storyCount: number;
    transactionCount: number;
    likeCount: number;
    favoriteCount: number;
    commentCount: number;
    musicCount: number;
    followingCount: number;
    followerCount: number;
    lastOperationEvent: unknown;
  };
}
