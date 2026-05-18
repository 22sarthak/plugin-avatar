export const AVATAR_CONFIG_VERSION = 1;

export type SkinTone = "porcelain" | "sand" | "amber" | "copper" | "mahogany";
export type FaceShape = "round" | "oval" | "square" | "heart" | "long";
export type EyeShape = "almond" | "round" | "soft" | "bright";
export type EyebrowStyle = "soft-arch" | "straight" | "bold" | "lifted";
export type HairStyle = "short-textured" | "bob" | "curly" | "high-puff" | "side-sweep" | "buzz";
export type FacialHairStyle = "none" | "stubble" | "goatee" | "full-beard";
export type Outfit = "studio-hoodie" | "tailored-jacket" | "tech-tee" | "soft-knit" | "space-suit";
export type AccessoryId = "round-glasses" | "visor" | "earrings" | "headphones";
export type AnimationName = "idle" | "wave" | "celebrate";

export interface AvatarConfig {
  id: string;
  version: number;
  skinTone: SkinTone | string;
  faceShape: FaceShape | string;
  eyeShape: EyeShape | string;
  eyeColor: string;
  eyebrowStyle: EyebrowStyle | string;
  hairStyle: HairStyle | string;
  hairColor: string;
  facialHairStyle: FacialHairStyle | string;
  outfit: Outfit | string;
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

export interface TraitOption<TValue extends string = string> {
  id: TValue;
  label: string;
  value?: string;
  description?: string;
}

export interface TraitCategory {
  id: "skin" | "face" | "hair" | "eyes" | "outfit" | "accessories" | "animation";
  label: string;
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  config?: AvatarConfig;
}

const timestamp = "2026-05-18T00:00:00.000Z";

export const skinToneOptions: TraitOption<SkinTone>[] = [
  { id: "porcelain", label: "Porcelain", value: "#f0c7b3" },
  { id: "sand", label: "Sand", value: "#d6a27a" },
  { id: "amber", label: "Amber", value: "#b9784f" },
  { id: "copper", label: "Copper", value: "#8d5638" },
  { id: "mahogany", label: "Mahogany", value: "#55311f" }
];

export const faceShapeOptions: TraitOption<FaceShape>[] = [
  { id: "round", label: "Round" },
  { id: "oval", label: "Oval" },
  { id: "square", label: "Square" },
  { id: "heart", label: "Heart" },
  { id: "long", label: "Long" }
];

export const eyeShapeOptions: TraitOption<EyeShape>[] = [
  { id: "almond", label: "Almond" },
  { id: "round", label: "Round" },
  { id: "soft", label: "Soft" },
  { id: "bright", label: "Bright" }
];

export const eyeColorOptions: TraitOption[] = [
  { id: "espresso", label: "Espresso", value: "#2f1d14" },
  { id: "hazel", label: "Hazel", value: "#7b542c" },
  { id: "green", label: "Green", value: "#54725d" },
  { id: "blue", label: "Blue", value: "#4f6f92" },
  { id: "gray", label: "Gray", value: "#7a8187" }
];

export const eyebrowStyleOptions: TraitOption<EyebrowStyle>[] = [
  { id: "soft-arch", label: "Soft Arch" },
  { id: "straight", label: "Straight" },
  { id: "bold", label: "Bold" },
  { id: "lifted", label: "Lifted" }
];

export const hairStyleOptions: TraitOption<HairStyle>[] = [
  { id: "short-textured", label: "Short Textured" },
  { id: "bob", label: "Bob" },
  { id: "curly", label: "Curly" },
  { id: "high-puff", label: "High Puff" },
  { id: "side-sweep", label: "Side Sweep" },
  { id: "buzz", label: "Buzz" }
];

export const hairColorOptions: TraitOption[] = [
  { id: "black", label: "Black", value: "#15110f" },
  { id: "brown", label: "Brown", value: "#4b2e22" },
  { id: "auburn", label: "Auburn", value: "#7f3f2a" },
  { id: "blonde", label: "Blonde", value: "#caa968" },
  { id: "silver", label: "Silver", value: "#b8bcc0" },
  { id: "teal", label: "Teal", value: "#247476" }
];

export const facialHairStyleOptions: TraitOption<FacialHairStyle>[] = [
  { id: "none", label: "None" },
  { id: "stubble", label: "Stubble" },
  { id: "goatee", label: "Goatee" },
  { id: "full-beard", label: "Full Beard" }
];

export const outfitOptions: TraitOption<Outfit>[] = [
  { id: "studio-hoodie", label: "Studio Hoodie", value: "#426b69" },
  { id: "tailored-jacket", label: "Tailored Jacket", value: "#26343f" },
  { id: "tech-tee", label: "Tech Tee", value: "#8f5e46" },
  { id: "soft-knit", label: "Soft Knit", value: "#d1b86f" },
  { id: "space-suit", label: "Space Suit", value: "#e8e8df" }
];

export const accessoryOptions: TraitOption<AccessoryId>[] = [
  { id: "round-glasses", label: "Round Glasses" },
  { id: "visor", label: "Visor" },
  { id: "earrings", label: "Earrings" },
  { id: "headphones", label: "Headphones" }
];

export const animationOptions: TraitOption<AnimationName>[] = [
  { id: "idle", label: "Idle" },
  { id: "wave", label: "Wave" },
  { id: "celebrate", label: "Celebrate" }
];

export const avatarTraitCategories: TraitCategory[] = [
  { id: "skin", label: "Skin", description: "Skin tone and base face silhouette." },
  { id: "face", label: "Face", description: "Face shape, brows, and facial hair." },
  { id: "hair", label: "Hair", description: "Hair shape and color." },
  { id: "eyes", label: "Eyes", description: "Eye shape and iris color." },
  { id: "outfit", label: "Outfit", description: "Upper body style and color." },
  { id: "accessories", label: "Accessories", description: "Optional glasses, audio, and accent pieces." },
  { id: "animation", label: "Animation", description: "Preview animation for the placeholder avatar." }
];

export const defaultAvatarConfig: AvatarConfig = {
  id: "local-avatar",
  version: AVATAR_CONFIG_VERSION,
  skinTone: "amber",
  faceShape: "oval",
  eyeShape: "almond",
  eyeColor: "#2f1d14",
  eyebrowStyle: "soft-arch",
  hairStyle: "short-textured",
  hairColor: "#15110f",
  facialHairStyle: "none",
  outfit: "studio-hoodie",
  accessoryIds: ["round-glasses"],
  animation: "idle",
  createdAt: timestamp,
  updatedAt: timestamp
};

export const avatarPresets: AvatarPreset[] = [
  {
    id: "studio-classic",
    label: "Studio Classic",
    rules: [],
    defaultConfig: defaultAvatarConfig
  },
  {
    id: "soft-editorial",
    label: "Soft Editorial",
    rules: [],
    defaultConfig: {
      ...defaultAvatarConfig,
      id: "soft-editorial",
      skinTone: "sand",
      faceShape: "heart",
      eyeShape: "soft",
      eyeColor: "#54725d",
      eyebrowStyle: "lifted",
      hairStyle: "bob",
      hairColor: "#7f3f2a",
      outfit: "soft-knit",
      accessoryIds: ["earrings"],
      animation: "wave"
    }
  },
  {
    id: "future-ready",
    label: "Future Ready",
    rules: [],
    defaultConfig: {
      ...defaultAvatarConfig,
      id: "future-ready",
      skinTone: "copper",
      faceShape: "square",
      eyeShape: "bright",
      eyeColor: "#4f6f92",
      eyebrowStyle: "bold",
      hairStyle: "side-sweep",
      hairColor: "#247476",
      facialHairStyle: "stubble",
      outfit: "space-suit",
      accessoryIds: ["visor", "headphones"],
      animation: "celebrate"
    }
  }
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requiredStringFields: Array<keyof AvatarConfig> = [
  "id",
  "skinTone",
  "faceShape",
  "eyeShape",
  "eyeColor",
  "eyebrowStyle",
  "hairStyle",
  "hairColor",
  "facialHairStyle",
  "outfit",
  "animation",
  "createdAt",
  "updatedAt"
];

export function normalizeAvatarConfig(value: unknown): AvatarConfig {
  if (!isObject(value)) {
    return { ...defaultAvatarConfig, updatedAt: new Date().toISOString() };
  }

  const config = value as Partial<AvatarConfig>;
  const now = new Date().toISOString();

  return {
    ...defaultAvatarConfig,
    ...config,
    id: typeof config.id === "string" && config.id.trim() ? config.id : defaultAvatarConfig.id,
    version: AVATAR_CONFIG_VERSION,
    accessoryIds: Array.isArray(config.accessoryIds)
      ? config.accessoryIds.filter((item): item is string => typeof item === "string")
      : [],
    createdAt: typeof config.createdAt === "string" ? config.createdAt : now,
    updatedAt: typeof config.updatedAt === "string" ? config.updatedAt : now
  };
}

export function validateAvatarConfig(value: unknown): ValidationResult {
  if (!isObject(value)) {
    return { valid: false, errors: ["Avatar config must be an object."] };
  }

  const normalized = normalizeAvatarConfig(value);
  const errors: string[] = [];

  if (typeof normalized.version !== "number") {
    errors.push("version must be a number.");
  }

  for (const field of requiredStringFields) {
    if (typeof normalized[field] !== "string" || String(normalized[field]).trim() === "") {
      errors.push(`${field} must be a non-empty string.`);
    }
  }

  if (!Array.isArray(normalized.accessoryIds)) {
    errors.push("accessoryIds must be an array.");
  }

  return {
    valid: errors.length === 0,
    errors,
    config: errors.length === 0 ? normalized : undefined
  };
}

export function isAvatarConfig(value: unknown): value is AvatarConfig {
  return validateAvatarConfig(value).valid;
}

export function serializeAvatarConfig(config: AvatarConfig): string {
  return JSON.stringify(normalizeAvatarConfig(config), null, 2);
}

export function parseAvatarConfigJson(json: string): ValidationResult {
  try {
    return validateAvatarConfig(JSON.parse(json));
  } catch {
    return { valid: false, errors: ["JSON could not be parsed."] };
  }
}

export const createSampleAvatarConfig = (): AvatarConfig => ({
  ...defaultAvatarConfig,
  id: "sample-avatar",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
