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
export type EstimatedSkinToneBucket = "very_light" | "light" | "medium" | "tan" | "brown" | "deep";
export type EstimatedHairColorBucket = "black" | "dark_brown" | "brown" | "blonde" | "red" | "gray" | "unknown";

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
  estimatedSkinTone: EstimatedSkinToneBucket | string;
  estimatedHairColor: EstimatedHairColorBucket | string;
  confidence: number;
}

export interface NormalizedFaceLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface AvatarPresetMatch {
  config: AvatarConfig;
  confidence: number;
  matchedTraits: string[];
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

const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

const landmarkAt = (landmarks: NormalizedFaceLandmark[], index: number): NormalizedFaceLandmark | undefined =>
  landmarks[index];

const landmarkDistance = (
  landmarks: NormalizedFaceLandmark[],
  firstIndex: number,
  secondIndex: number
): number | null => {
  const first = landmarkAt(landmarks, firstIndex);
  const second = landmarkAt(landmarks, secondIndex);

  if (!first || !second) {
    return null;
  }

  return Math.hypot(first.x - second.x, first.y - second.y);
};

const midpoint = (
  landmarks: NormalizedFaceLandmark[],
  firstIndex: number,
  secondIndex: number
): NormalizedFaceLandmark | undefined => {
  const first = landmarkAt(landmarks, firstIndex);
  const second = landmarkAt(landmarks, secondIndex);

  if (!first || !second) {
    return undefined;
  }

  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2
  };
};

const getBounds = (landmarks: NormalizedFaceLandmark[]) => {
  const valid = landmarks.filter((landmark) => Number.isFinite(landmark.x) && Number.isFinite(landmark.y));
  const xs = valid.map((landmark) => landmark.x);
  const ys = valid.map((landmark) => landmark.y);

  return {
    width: Math.max(0.001, Math.max(...xs) - Math.min(...xs)),
    height: Math.max(0.001, Math.max(...ys) - Math.min(...ys)),
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
    validCount: valid.length
  };
};

export function extractFeatureRatiosFromLandmarks(landmarks: NormalizedFaceLandmark[]): FaceFeatures {
  if (landmarks.length < 120) {
    return {
      faceAspectRatio: 0,
      jawWidthRatio: 0,
      eyeDistanceRatio: 0,
      noseLengthRatio: 0,
      mouthWidthRatio: 0,
      estimatedSkinTone: "medium",
      estimatedHairColor: "unknown",
      confidence: 0
    };
  }

  const bounds = getBounds(landmarks);
  const faceHeight = landmarkDistance(landmarks, 10, 152) ?? bounds.height;
  const faceWidth = landmarkDistance(landmarks, 234, 454) ?? bounds.width;
  const jawWidth = landmarkDistance(landmarks, 172, 397) ?? faceWidth * 0.78;
  const leftEye = midpoint(landmarks, 33, 133);
  const rightEye = midpoint(landmarks, 362, 263);
  const eyeDistance = leftEye && rightEye ? Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y) : faceWidth * 0.46;
  const noseLength = landmarkDistance(landmarks, 168, 2) ?? faceHeight * 0.28;
  const mouthWidth = landmarkDistance(landmarks, 61, 291) ?? faceWidth * 0.38;

  const featureConfidence = [
    faceHeight > 0,
    faceWidth > 0,
    jawWidth > 0,
    eyeDistance > 0,
    noseLength > 0,
    mouthWidth > 0
  ].filter(Boolean).length / 6;

  const reasonableRatioConfidence =
    faceWidth > 0.08 && faceHeight > 0.1 && faceHeight / faceWidth > 0.75 && faceHeight / faceWidth < 1.9
      ? 1
      : 0.55;

  return {
    faceAspectRatio: Number((faceHeight / Math.max(faceWidth, 0.001)).toFixed(3)),
    jawWidthRatio: Number((jawWidth / Math.max(faceWidth, 0.001)).toFixed(3)),
    eyeDistanceRatio: Number((eyeDistance / Math.max(faceWidth, 0.001)).toFixed(3)),
    noseLengthRatio: Number((noseLength / Math.max(faceHeight, 0.001)).toFixed(3)),
    mouthWidthRatio: Number((mouthWidth / Math.max(faceWidth, 0.001)).toFixed(3)),
    estimatedSkinTone: "medium",
    estimatedHairColor: "unknown",
    confidence: Number(clamp((bounds.validCount / 468) * featureConfidence * reasonableRatioConfidence).toFixed(2))
  };
}

type BrowserImageSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas;

const getSourceSize = (image: BrowserImageSource) => {
  if ("naturalWidth" in image && image.naturalWidth) {
    return { width: image.naturalWidth, height: image.naturalHeight };
  }

  if ("videoWidth" in image && image.videoWidth) {
    return { width: image.videoWidth, height: image.videoHeight };
  }

  return { width: image.width, height: image.height };
};

const createSamplingContext = (image: BrowserImageSource): CanvasRenderingContext2D | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const { width, height } = getSourceSize(image);
  if (!width || !height) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0, width, height);
  return context;
};

const averageSamples = (
  context: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  radius = 5
) => {
  const { width, height } = context.canvas;
  const samples: Array<{ r: number; g: number; b: number }> = [];

  for (const point of points) {
    const cx = Math.round(clamp(point.x) * (width - 1));
    const cy = Math.round(clamp(point.y) * (height - 1));
    const sx = Math.max(0, cx - radius);
    const sy = Math.max(0, cy - radius);
    const sw = Math.min(width - sx, radius * 2 + 1);
    const sh = Math.min(height - sy, radius * 2 + 1);
    const data = context.getImageData(sx, sy, sw, sh).data;

    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;

      if (data[index + 3] > 200 && saturation < 0.72) {
        samples.push({ r, g, b });
      }
    }
  }

  if (samples.length < 8) {
    return null;
  }

  return samples.reduce(
    (accumulator, sample) => ({
      r: accumulator.r + sample.r / samples.length,
      g: accumulator.g + sample.g / samples.length,
      b: accumulator.b + sample.b / samples.length
    }),
    { r: 0, g: 0, b: 0 }
  );
};

const classifySkinTone = ({ r, g, b }: { r: number; g: number; b: number }): EstimatedSkinToneBucket => {
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  if (luminance >= 205) return "very_light";
  if (luminance >= 170) return "light";
  if (luminance >= 130) return "medium";
  if (luminance >= 96) return "tan";
  if (luminance >= 66) return "brown";
  return "deep";
};

const classifyHairColor = ({ r, g, b }: { r: number; g: number; b: number }): EstimatedHairColorBucket => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const saturation = max === 0 ? 0 : (max - min) / max;

  if (saturation < 0.16 && luminance > 118) return "gray";
  if (luminance < 42) return "black";
  if (r > g * 1.18 && r > b * 1.45) return "red";
  if (luminance > 150 && r > 140 && g > 120 && b < 125) return "blonde";
  if (luminance < 84) return "dark_brown";
  if (r >= g && g >= b) return "brown";
  return "unknown";
};

export function estimateSkinToneFromImage(
  image: BrowserImageSource,
  landmarks: NormalizedFaceLandmark[]
): EstimatedSkinToneBucket {
  const context = createSamplingContext(image);
  if (!context || landmarks.length < 120) {
    return "medium";
  }

  const samplePoints = [landmarkAt(landmarks, 50), landmarkAt(landmarks, 280), landmarkAt(landmarks, 151)]
    .filter((point): point is NormalizedFaceLandmark => Boolean(point))
    .map((point, index) => ({
      x: point.x,
      y: index === 2 ? point.y + 0.035 : point.y
    }));

  const average = averageSamples(context, samplePoints, 6);
  return average ? classifySkinTone(average) : "medium";
}

export function estimateHairColorFromImage(
  image: BrowserImageSource,
  landmarks: NormalizedFaceLandmark[]
): EstimatedHairColorBucket {
  const context = createSamplingContext(image);
  if (!context || landmarks.length < 120) {
    return "unknown";
  }

  const top = landmarkAt(landmarks, 10);
  const left = landmarkAt(landmarks, 127);
  const right = landmarkAt(landmarks, 356);

  if (!top || !left || !right) {
    return "unknown";
  }

  const samplePoints = [
    { x: top.x, y: top.y - 0.055 },
    { x: (top.x + left.x) / 2, y: top.y - 0.025 },
    { x: (top.x + right.x) / 2, y: top.y - 0.025 }
  ];

  const average = averageSamples(context, samplePoints, 8);
  return average ? classifyHairColor(average) : "unknown";
}

export function inferFaceShapeFromFeatures(features: FaceFeatures): FaceShape {
  if (features.faceAspectRatio > 1.38) return "long";
  if (features.jawWidthRatio < 0.66 && features.faceAspectRatio > 1.12) return "heart";
  if (features.jawWidthRatio > 0.86 && features.faceAspectRatio < 1.15) return "square";
  if (features.faceAspectRatio < 1.08) return "round";
  return "oval";
}

const skinBucketToAvatarTone: Record<EstimatedSkinToneBucket, SkinTone> = {
  very_light: "porcelain",
  light: "sand",
  medium: "amber",
  tan: "copper",
  brown: "copper",
  deep: "mahogany"
};

const hairBucketToAvatarColor: Record<EstimatedHairColorBucket, string> = {
  black: "#15110f",
  dark_brown: "#2f1d14",
  brown: "#4b2e22",
  blonde: "#caa968",
  red: "#7f3f2a",
  gray: "#b8bcc0",
  unknown: defaultAvatarConfig.hairColor
};

const scorePreset = (features: FaceFeatures, preset: AvatarPreset): number => {
  const inferredFaceShape = inferFaceShapeFromFeatures(features);
  let score = preset.defaultConfig.faceShape === inferredFaceShape ? 0.28 : 0;
  score += preset.defaultConfig.skinTone === skinBucketToAvatarTone[features.estimatedSkinTone as EstimatedSkinToneBucket] ? 0.18 : 0;
  score += preset.defaultConfig.hairColor === hairBucketToAvatarColor[features.estimatedHairColor as EstimatedHairColorBucket] ? 0.16 : 0;

  for (const rule of preset.rules) {
    const value = features[rule.feature];
    const weight = rule.weight ?? 0.08;
    if (typeof value === "number") {
      if (rule.operator === "gt" && value > Number(rule.value)) score += weight;
      if (rule.operator === "gte" && value >= Number(rule.value)) score += weight;
      if (rule.operator === "lt" && value < Number(rule.value)) score += weight;
      if (rule.operator === "lte" && value <= Number(rule.value)) score += weight;
      if (rule.operator === "between" && Array.isArray(rule.value) && value >= rule.value[0] && value <= rule.value[1]) score += weight;
    } else if (rule.operator === "eq" && value === rule.value) {
      score += weight;
    }
  }

  return score;
};

export function matchAvatarPreset(faceFeatures: FaceFeatures, presets: AvatarPreset[]): AvatarPresetMatch {
  const candidates = presets.length ? presets : avatarPresets;
  const bestPreset = candidates
    .map((preset) => ({ preset, score: scorePreset(faceFeatures, preset) }))
    .sort((left, right) => right.score - left.score || left.preset.id.localeCompare(right.preset.id))[0]?.preset ?? avatarPresets[0];

  const faceShape = inferFaceShapeFromFeatures(faceFeatures);
  const skinTone = skinBucketToAvatarTone[faceFeatures.estimatedSkinTone as EstimatedSkinToneBucket] ?? defaultAvatarConfig.skinTone;
  const hairColor = hairBucketToAvatarColor[faceFeatures.estimatedHairColor as EstimatedHairColorBucket] ?? defaultAvatarConfig.hairColor;
  const now = new Date().toISOString();
  const config = normalizeAvatarConfig({
    ...bestPreset.defaultConfig,
    id: "selfie-suggestion",
    skinTone,
    faceShape,
    hairColor,
    updatedAt: now
  });

  const matchedTraits = [
    `Preset: ${bestPreset.label}`,
    `Face shape: ${faceShape}`,
    `Skin tone bucket: ${faceFeatures.estimatedSkinTone}`,
    `Hair color bucket: ${faceFeatures.estimatedHairColor}`
  ];

  return {
    config,
    confidence: Number(clamp(faceFeatures.confidence).toFixed(2)),
    matchedTraits
  };
}
