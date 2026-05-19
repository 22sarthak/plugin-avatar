import { describe, expect, it } from "vitest";
import {
  avatarPresets,
  defaultAvatarConfig,
  matchAvatarPreset,
  normalizeAvatarConfig,
  parseAvatarConfigJson,
  validateAvatarConfig,
  type FaceFeatures
} from "../src/index";

const validConfig = {
  ...defaultAvatarConfig,
  createdAt: "2026-05-18T00:00:00.000Z",
  updatedAt: "2026-05-18T00:00:00.000Z"
};

describe("AvatarConfig validation", () => {
  it("accepts a complete valid config", () => {
    const result = validateAvatarConfig(validConfig);

    expect(result.valid).toBe(true);
    expect(result.config?.animation).toBe("idle_breathing");
  });

  it("normalizes legacy animation aliases", () => {
    const normalized = normalizeAvatarConfig({ ...validConfig, animation: "bounce" });
    const result = validateAvatarConfig(normalized);

    expect(result.valid).toBe(true);
    expect(result.config?.animation).toBe("small_bounce");
  });

  it("rejects invalid enum values and accessory IDs", () => {
    const result = validateAvatarConfig({
      ...validConfig,
      faceShape: "triangle",
      accessoryIds: ["round-glasses", "laser-crown"]
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("faceShape");
    expect(result.errors.join(" ")).toContain("accessoryIds.1");
  });

  it("rejects invalid color strings", () => {
    const result = validateAvatarConfig({ ...validConfig, eyeColor: "espresso" });

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("eyeColor");
  });

  it("rejects oversized avatar JSON", () => {
    const result = validateAvatarConfig({ ...validConfig, id: "avatar-".repeat(6000) });

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("32000 bytes");
  });

  it("returns a clean parse error for invalid JSON", () => {
    const result = parseAvatarConfigJson("{nope");

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["JSON could not be parsed."]);
  });
});

describe("preset matching", () => {
  it("returns a deterministic editable suggestion", () => {
    const features: FaceFeatures = {
      faceAspectRatio: 1.42,
      jawWidthRatio: 0.61,
      eyeDistanceRatio: 0.48,
      noseLengthRatio: 0.29,
      mouthWidthRatio: 0.4,
      estimatedSkinTone: "deep",
      estimatedHairColor: "black",
      confidence: 0.83
    };

    const first = matchAvatarPreset(features, avatarPresets);
    const second = matchAvatarPreset(features, avatarPresets);

    expect({ ...first.config, updatedAt: "dynamic" }).toEqual({ ...second.config, updatedAt: "dynamic" });
    expect(first.config.faceShape).toBe("long");
    expect(first.config.skinTone).toBe("mahogany");
    expect(first.confidence).toBe(0.83);
    expect(first.matchedTraits.join(" ")).toContain("Preset:");
  });
});
