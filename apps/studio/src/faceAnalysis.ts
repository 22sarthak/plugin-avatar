import {
  avatarPresets,
  estimateHairColorFromImage,
  estimateSkinToneFromImage,
  extractFeatureRatiosFromLandmarks,
  matchAvatarPreset,
  type AvatarPresetMatch,
  type FaceFeatures,
  type NormalizedFaceLandmark
} from "@avatar-platform/avatar-core";
import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from "@mediapipe/tasks-vision";

const MEDIAPIPE_VERSION = "0.10.35";
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

export type SelfieAnalysisErrorCode =
  | "unsupported_image"
  | "mediapipe_load_failure"
  | "no_face"
  | "multiple_faces"
  | "low_confidence";

export class SelfieAnalysisError extends Error {
  constructor(
    public readonly code: SelfieAnalysisErrorCode,
    message: string
  ) {
    super(message);
    this.name = "SelfieAnalysisError";
  }
}

export interface SelfieAnalysisResult {
  features: FaceFeatures;
  suggestion: AvatarPresetMatch;
  landmarks: NormalizedFaceLandmark[];
  warnings: string[];
}

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

async function getFaceLandmarker(): Promise<FaceLandmarker> {
  landmarkerPromise ??= FilesetResolver.forVisionTasks(WASM_BASE_URL)
    .then((vision) =>
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: FACE_MODEL_URL
        },
        runningMode: "IMAGE",
        numFaces: 2,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false
      })
    )
    .catch((error: unknown) => {
      landmarkerPromise = null;
      throw new SelfieAnalysisError(
        "mediapipe_load_failure",
        error instanceof Error ? error.message : "MediaPipe could not be loaded."
      );
    });

  return landmarkerPromise;
}

const toCoreLandmarks = (result: FaceLandmarkerResult): NormalizedFaceLandmark[][] =>
  result.faceLandmarks.map((face) =>
    face.map((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility
    }))
  );

export function isSupportedImageFile(file: File): boolean {
  return file.type.startsWith("image/") && !file.type.includes("svg");
}

export async function loadImageFromFile(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  if (!isSupportedImageFile(file)) {
    throw new SelfieAnalysisError("unsupported_image", "Please upload a browser-supported photo file.");
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = objectUrl;

  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new SelfieAnalysisError("unsupported_image", "The selected image could not be decoded.");
  }

  return { image, objectUrl };
}

export async function analyzeSelfieImage(image: HTMLImageElement): Promise<SelfieAnalysisResult> {
  const landmarker = await getFaceLandmarker();
  const result = landmarker.detect(image);
  const faces = toCoreLandmarks(result);

  if (faces.length === 0) {
    throw new SelfieAnalysisError("no_face", "No face was detected. You can still create an avatar manually.");
  }

  if (faces.length > 1) {
    throw new SelfieAnalysisError("multiple_faces", "Multiple faces were detected. Please use a selfie with one face.");
  }

  const landmarks = faces[0];
  const features = extractFeatureRatiosFromLandmarks(landmarks);
  features.estimatedSkinTone = estimateSkinToneFromImage(image, landmarks);
  features.estimatedHairColor = estimateHairColorFromImage(image, landmarks);
  features.confidence = Number(Math.min(1, Math.max(0, features.confidence)).toFixed(2));

  const suggestion = matchAvatarPreset(features, avatarPresets);
  const warnings = features.confidence < 0.45
    ? ["Low confidence result. Treat this as a rough starting point and edit freely."]
    : [];

  return {
    features,
    suggestion,
    landmarks,
    warnings
  };
}
