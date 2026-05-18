export type SkinTone = "fair" | "light" | "medium" | "tan" | "deep";
export type FaceShape = "round" | "oval" | "square" | "heart" | "long";
export type EyeShape = "almond" | "round" | "hooded" | "monolid";
export type AnimationName = "idle" | "wave" | "turntable";

export interface AvatarConfig {
  id: string;
  version: number;
  skinTone: SkinTone | string;
  faceShape: FaceShape | string;
  eyeShape: EyeShape | string;
  eyeColor: string;
  eyebrowStyle: string;
  hairStyle: string;
  hairColor: string;
  facialHairStyle: string;
  outfit: string;
  accessoryIds: string[];
  animation: AnimationName | string;
  createdAt: string;
  updatedAt: string;
}

export interface FaceFeatures {
  faceAspectRatio: number;
  jawWidthRatio: number;
  eyeDistanceRatio: number;
  noseLengthRatio: number;
  mouthWidthRatio: number;
  estimatedSkinTone: string;
  estimatedHairColor: string;
  confidence: number;
}

export type AvatarPresetRuleOperator = "eq" | "gt" | "gte" | "lt" | "lte" | "between";

export interface AvatarPresetRule {
  feature: keyof FaceFeatures;
  operator: AvatarPresetRuleOperator;
  value: string | number | [number, number];
  weight?: number;
}

export interface AvatarPreset {
  id: string;
  label: string;
  rules: AvatarPresetRule[];
  defaultConfig: AvatarConfig;
}

export interface AvatarCreatedEvent {
  type: "avatar:created";
  payload: {
    avatar: AvatarConfig;
  };
}

export interface AvatarUpdatedEvent {
  type: "avatar:updated";
  payload: {
    avatar: AvatarConfig;
  };
}

export interface AvatarExportedEvent {
  type: "avatar:exported";
  payload: {
    avatar: AvatarConfig;
    configJson: string;
    screenshotDataUrl?: string;
    embedCode?: string;
  };
}

export type AvatarIntegrationEvent =
  | AvatarCreatedEvent
  | AvatarUpdatedEvent
  | AvatarExportedEvent;

export const createSampleAvatarConfig = (): AvatarConfig => {
  const now = new Date().toISOString();

  return {
    id: "sample-avatar",
    version: 1,
    skinTone: "medium",
    faceShape: "oval",
    eyeShape: "almond",
    eyeColor: "#3b2416",
    eyebrowStyle: "soft-arch",
    hairStyle: "short-textured",
    hairColor: "#1d1714",
    facialHairStyle: "none",
    outfit: "studio-hoodie",
    accessoryIds: ["round-glasses"],
    animation: "idle",
    createdAt: now,
    updatedAt: now
  };
};
