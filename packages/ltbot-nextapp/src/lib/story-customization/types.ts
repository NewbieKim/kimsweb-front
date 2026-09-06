export interface PartnerValue {
  type: 'preset' | 'custom';
  id?: string;
  name: string;
  emoji: string;
}

export interface ChildProfileInput {
  avatarId: string;
  nickname: string;
  ageGroup: string;
  role: string;
  traitIds: string[];
  partner: PartnerValue;
}

export interface ChildSnapshot extends ChildProfileInput {
  avatarEmoji: string;
  ageLabel: string;
  roleLabel: string;
  traitLabels: string[];
  partnerLabel: string;
}

export interface DreamWorldSnapshot {
  sceneId: string;
  categoryId: string;
  catalogVersion: string;
  name: string;
  emoji: string;
  coverImage: string;
  briefDescription: string;
  ageSetting: string;
  ageSkeleton: string;
  worldView: string;
  emotionalArc: string;
  safetyGuideline: string;
  /** v1 快照兼容字段，新快照不再写入。 */
  id?: string;
  description?: string;
  storySkeleton?: string;
}

export interface TonightMaterialInput {
  intent: string;
  text: string;
}

export interface StoryCustomizationSnapshot {
  schemaVersion: number;
  sequenceNumber: number;
  child: ChildSnapshot;
  dreamWorld: DreamWorldSnapshot;
  growthTheme: string;
  tonightMaterial: TonightMaterialInput | null;
}
