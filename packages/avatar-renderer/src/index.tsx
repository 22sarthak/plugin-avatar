import type { AnimationName, AvatarConfig, FaceShape, HairStyle, Outfit } from "@avatar-platform/avatar-core";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { CSSProperties, Ref } from "react";
import type { Group } from "three";

export type AvatarOneShotAnimation =
  | "wave"
  | "tiny_shake"
  | "slide_in"
  | "slide_out"
  | "lean_left"
  | "lean_right";

export type AvatarAnimationOverride = AnimationName | "idle" | "bounce" | "celebrate";

export interface AvatarRendererCaptureHandle {
  capturePng: () => string | null;
}

export interface AvatarRendererProps {
  config: AvatarConfig;
  captureRef?: Ref<AvatarRendererCaptureHandle>;
  className?: string;
  controls?: boolean;
  transparent?: boolean;
  animationOverride?: AvatarAnimationOverride;
  oneShotAnimation?: AvatarOneShotAnimation | null;
  onOneShotComplete?: () => void;
  style?: CSSProperties;
}

const skinToneColors: Record<string, string> = {
  porcelain: "#f6cfbf",
  fair: "#f6cfbf",
  sand: "#e3b08e",
  light: "#e3b08e",
  amber: "#c98760",
  medium: "#c98760",
  copper: "#9d6648",
  tan: "#9d6648",
  mahogany: "#654231",
  deep: "#654231"
};

const skinBlushColors: Record<string, string> = {
  porcelain: "#efaaa1",
  sand: "#cf917d",
  amber: "#b66f59",
  copper: "#8e5442",
  mahogany: "#563227"
};

const outfitColors: Record<Outfit | string, string> = {
  "studio-hoodie": "#4f7874",
  "tailored-jacket": "#27333a",
  "tech-tee": "#927061",
  "soft-knit": "#c3a968",
  "space-suit": "#ece8dc"
};

const outfitTrimColors: Record<Outfit | string, string> = {
  "studio-hoodie": "#efe8dc",
  "tailored-jacket": "#eee2d4",
  "tech-tee": "#dfcab8",
  "soft-knit": "#f0dfaa",
  "space-suit": "#8fbec5"
};

const hairPalettes: Record<string, string> = {
  "#15110f": "#231916",
  "#2f1d14": "#3c271d",
  "#4b2e22": "#5a3829",
  "#7f3f2a": "#8b4a34",
  "#caa968": "#d6bd7d",
  "#b8bcc0": "#c9ced0",
  "#247476": "#2b8282"
};

const faceScale: Record<FaceShape | string, [number, number, number]> = {
  round: [1.02, 0.98, 0.98],
  oval: [0.97, 1.08, 0.98],
  square: [1.04, 1.01, 0.97],
  heart: [1.02, 1.06, 0.98],
  long: [0.93, 1.16, 0.97]
};

const hairScale: Record<HairStyle | string, [number, number, number]> = {
  "short-textured": [1.04, 0.58, 1],
  bob: [1.12, 0.88, 1.05],
  curly: [1.1, 0.76, 1.08],
  "high-puff": [0.92, 1.12, 0.94],
  "side-sweep": [1.13, 0.62, 1],
  buzz: [0.96, 0.24, 0.96]
};

const animationAliases: Record<string, AnimationName> = {
  idle: "idle_breathing",
  bounce: "small_bounce",
  celebrate: "small_bounce"
};

const oneShotDurations: Record<AvatarOneShotAnimation, number> = {
  wave: 1.35,
  tiny_shake: 0.55,
  slide_in: 0.82,
  slide_out: 0.82,
  lean_left: 0.7,
  lean_right: 0.7
};

const resolveAnimationName = (value: string | undefined): AnimationName => {
  if (!value) {
    return "idle_breathing";
  }

  return (animationAliases[value] ?? value) as AnimationName;
};

const easeOutCubic = (value: number): number => 1 - Math.pow(1 - value, 3);
const easeInCubic = (value: number): number => value * value * value;
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function SoftMaterial({
  color,
  roughness = 0.86,
  metalness = 0,
  transparent,
  opacity
}: {
  color: string;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      transparent={transparent}
      opacity={opacity}
    />
  );
}

function RoundedTorso({
  outfit,
  outfitColor,
  trimColor
}: {
  outfit: string;
  outfitColor: string;
  trimColor: string;
}) {
  const torsoScale: [number, number, number] =
    outfit === "space-suit" ? [0.74, 0.54, 0.34] : [0.66, 0.54, 0.3];
  const shoulderScale: [number, number, number] =
    outfit === "tailored-jacket" ? [0.9, 0.18, 0.34] : [0.84, 0.17, 0.32];
  const fabricRoughness = outfit === "space-suit" ? 0.78 : 0.91;

  return (
    <group name="body" position={[0, 0.72, 0]}>
      <mesh castShadow receiveShadow position={[0, -0.03, 0]} scale={torsoScale}>
        <sphereGeometry args={[1, 48, 32]} />
        <SoftMaterial color={outfitColor} roughness={fabricRoughness} metalness={outfit === "space-suit" ? 0.03 : 0} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.34, 0]} scale={shoulderScale}>
        <sphereGeometry args={[1, 40, 24]} />
        <SoftMaterial color={outfitColor} roughness={fabricRoughness} metalness={outfit === "space-suit" ? 0.03 : 0} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.48, 0.23, 0.02]} rotation={[0.08, 0, 0.55]} scale={[0.72, 0.7, 0.92]}>
        <capsuleGeometry args={[0.105, 0.28, 14, 28]} />
        <SoftMaterial color={outfitColor} roughness={fabricRoughness} metalness={outfit === "space-suit" ? 0.03 : 0} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.48, 0.23, 0.02]} rotation={[0.08, 0, -0.55]} scale={[0.72, 0.7, 0.92]}>
        <capsuleGeometry args={[0.105, 0.28, 14, 28]} />
        <SoftMaterial color={outfitColor} roughness={fabricRoughness} metalness={outfit === "space-suit" ? 0.03 : 0} />
      </mesh>
      <mesh position={[0, 0.36, 0.284]} rotation={[0.08, 0, Math.PI]}>
        <torusGeometry args={[0.205, 0.014, 14, 52, Math.PI]} />
        <SoftMaterial color={trimColor} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.32, 0.294]} scale={[0.17, 0.08, 0.018]}>
        <sphereGeometry args={[1, 24, 14]} />
        <SoftMaterial color={trimColor} roughness={0.88} />
      </mesh>
      {outfit === "studio-hoodie" && (
        <>
          <mesh castShadow position={[-0.19, 0.39, 0.13]} rotation={[0.18, 0.14, -0.34]} scale={[0.72, 0.9, 0.72]}>
            <torusGeometry args={[0.23, 0.035, 12, 42, Math.PI]} />
            <SoftMaterial color={trimColor} roughness={0.9} />
          </mesh>
          <mesh position={[-0.065, 0.16, 0.312]} rotation={[0.12, 0, 0.08]}>
            <capsuleGeometry args={[0.01, 0.28, 8, 16]} />
            <SoftMaterial color={trimColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.065, 0.16, 0.312]} rotation={[0.12, 0, -0.08]}>
            <capsuleGeometry args={[0.01, 0.28, 8, 16]} />
            <SoftMaterial color={trimColor} roughness={0.9} />
          </mesh>
        </>
      )}
      {outfit === "tailored-jacket" && (
        <>
          <mesh position={[-0.09, 0.17, 0.318]} rotation={[0.08, 0, -0.42]}>
            <capsuleGeometry args={[0.014, 0.34, 8, 18]} />
            <SoftMaterial color={trimColor} roughness={0.84} />
          </mesh>
          <mesh position={[0.09, 0.17, 0.318]} rotation={[0.08, 0, 0.42]}>
            <capsuleGeometry args={[0.014, 0.34, 8, 18]} />
            <SoftMaterial color={trimColor} roughness={0.84} />
          </mesh>
          <mesh position={[0, 0.04, 0.322]} scale={[0.045, 0.025, 0.008]}>
            <sphereGeometry args={[1, 18, 12]} />
            <SoftMaterial color="#d8bc67" metalness={0.18} roughness={0.36} />
          </mesh>
        </>
      )}
      {outfit === "space-suit" && (
        <>
          <mesh position={[0, 0.12, 0.336]} scale={[0.22, 0.09, 0.035]}>
            <sphereGeometry args={[1, 24, 16]} />
            <SoftMaterial color="#9bcad0" roughness={0.38} metalness={0.08} />
          </mesh>
          <mesh position={[0, 0.38, 0.18]} rotation={[0.02, 0, Math.PI]}>
            <torusGeometry args={[0.235, 0.022, 14, 52, Math.PI]} />
            <SoftMaterial color="#d8ecec" roughness={0.48} metalness={0.04} />
          </mesh>
        </>
      )}
      {outfit === "soft-knit" && (
        <>
          {[-0.2, 0, 0.2].map((x) => (
            <mesh key={x} position={[x, 0.02, 0.31]} rotation={[0.05, 0, 0]}>
              <capsuleGeometry args={[0.006, 0.34, 6, 12]} />
              <SoftMaterial color="#d8c17c" roughness={0.94} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

function Arm({
  side,
  outfitColor,
  skinColor,
  armRef
}: {
  side: -1 | 1;
  outfitColor: string;
  skinColor: string;
  armRef: Ref<Group>;
}) {
  return (
    <group ref={armRef} position={[side * 0.58, 1.04, 0.015]} rotation={[0, 0, side * 0.2]}>
      <mesh castShadow position={[0, -0.22, 0]} rotation={[0.02, 0, side * 0.06]} scale={[0.92, 1, 0.94]}>
        <capsuleGeometry args={[0.082, 0.43, 14, 24]} />
        <SoftMaterial color={outfitColor} roughness={0.91} />
      </mesh>
      <mesh castShadow position={[0, -0.445, 0.012]} scale={[0.82, 0.48, 0.82]}>
        <sphereGeometry args={[0.11, 22, 16]} />
        <SoftMaterial color={outfitColor} roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0, -0.55, 0.02]} scale={[1, 0.86, 1]}>
        <sphereGeometry args={[0.084, 26, 18]} />
        <SoftMaterial color={skinColor} roughness={0.82} />
      </mesh>
    </group>
  );
}

function FaceShapeDetails({
  faceShape,
  skinColor,
  blushColor
}: {
  faceShape: string;
  skinColor: string;
  blushColor: string;
}) {
  if (faceShape === "square") {
    return (
      <>
        <mesh castShadow position={[-0.235, -0.14, 0.055]} scale={[0.16, 0.22, 0.12]}>
          <sphereGeometry args={[1, 24, 18]} />
          <SoftMaterial color={skinColor} roughness={0.84} />
        </mesh>
        <mesh castShadow position={[0.235, -0.14, 0.055]} scale={[0.16, 0.22, 0.12]}>
          <sphereGeometry args={[1, 24, 18]} />
          <SoftMaterial color={skinColor} roughness={0.84} />
        </mesh>
      </>
    );
  }

  if (faceShape === "heart") {
    return (
      <>
        <mesh position={[-0.22, 0.02, 0.345]} scale={[0.07, 0.04, 0.012]}>
          <sphereGeometry args={[1, 18, 12]} />
          <SoftMaterial color={blushColor} roughness={0.9} />
        </mesh>
        <mesh position={[0.22, 0.02, 0.345]} scale={[0.07, 0.04, 0.012]}>
          <sphereGeometry args={[1, 18, 12]} />
          <SoftMaterial color={blushColor} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, -0.31, 0.04]} scale={[0.12, 0.09, 0.1]}>
          <sphereGeometry args={[1, 20, 14]} />
          <SoftMaterial color={skinColor} roughness={0.84} />
        </mesh>
      </>
    );
  }

  if (faceShape === "round") {
    return (
      <>
        <mesh position={[-0.24, -0.04, 0.345]} scale={[0.065, 0.042, 0.012]}>
          <sphereGeometry args={[1, 18, 12]} />
          <SoftMaterial color={blushColor} roughness={0.9} />
        </mesh>
        <mesh position={[0.24, -0.04, 0.345]} scale={[0.065, 0.042, 0.012]}>
          <sphereGeometry args={[1, 18, 12]} />
          <SoftMaterial color={blushColor} roughness={0.9} />
        </mesh>
      </>
    );
  }

  if (faceShape === "long") {
    return (
      <mesh castShadow position={[0, -0.33, 0.05]} scale={[0.16, 0.13, 0.11]}>
        <sphereGeometry args={[1, 22, 16]} />
        <SoftMaterial color={skinColor} roughness={0.84} />
      </mesh>
    );
  }

  if (faceShape === "oval") {
    return (
      <mesh castShadow position={[0, -0.28, 0.06]} scale={[0.18, 0.09, 0.1]}>
        <sphereGeometry args={[1, 22, 16]} />
        <SoftMaterial color={skinColor} roughness={0.84} />
      </mesh>
    );
  }

  return null;
}

function HairSculpt({
  hairStyle,
  hairColor,
  activeHairScale
}: {
  hairStyle: string;
  hairColor: string;
  activeHairScale: [number, number, number];
}) {
  const refinedHairColor = hairPalettes[hairColor.toLowerCase()] ?? hairColor;
  const frontTufts: Array<[number, number, number, number]> = [
    [-0.27, 0.19, 0.3, 0.12],
    [-0.11, 0.27, 0.34, 0.145],
    [0.08, 0.27, 0.335, 0.135],
    [0.25, 0.18, 0.29, 0.11]
  ];

  if (hairStyle === "buzz") {
    return (
      <mesh castShadow position={[0, 0.21, -0.015]} scale={activeHairScale}>
        <sphereGeometry args={[0.438, 42, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <SoftMaterial color={refinedHairColor} roughness={0.93} />
      </mesh>
    );
  }

  return (
    <group>
      <mesh castShadow position={[0, 0.25, -0.025]} scale={activeHairScale}>
        <sphereGeometry args={[0.438, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <SoftMaterial color={refinedHairColor} roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0, 0.09, -0.22]} scale={[0.92, 0.5, 0.54]}>
        <sphereGeometry args={[0.36, 34, 18]} />
        <SoftMaterial color={refinedHairColor} roughness={0.94} />
      </mesh>
      {hairStyle !== "high-puff" && (
        <>
          <mesh castShadow position={[-0.34, 0.05, 0.08]} rotation={[0.16, 0, -0.13]} scale={[0.8, 1.05, 0.74]}>
            <capsuleGeometry args={[0.065, 0.2, 10, 20]} />
            <SoftMaterial color={refinedHairColor} roughness={0.94} />
          </mesh>
          <mesh castShadow position={[0.34, 0.05, 0.08]} rotation={[0.16, 0, 0.13]} scale={[0.8, 1.05, 0.74]}>
            <capsuleGeometry args={[0.065, 0.2, 10, 20]} />
            <SoftMaterial color={refinedHairColor} roughness={0.94} />
          </mesh>
        </>
      )}

      {hairStyle === "short-textured" && (
        <>
          {frontTufts.map(([x, y, z, size]) => (
            <mesh key={`${x}-${size}`} castShadow position={[x, y, z]} rotation={[0.12, 0, -x * 0.5]} scale={[1.18, 0.72, 0.82]}>
              <sphereGeometry args={[size, 22, 16]} />
              <SoftMaterial color={refinedHairColor} roughness={0.94} />
            </mesh>
          ))}
          <mesh castShadow position={[0.31, 0.09, 0.12]} rotation={[0.35, 0.05, -0.1]}>
            <capsuleGeometry args={[0.06, 0.2, 10, 20]} />
            <SoftMaterial color={refinedHairColor} roughness={0.94} />
          </mesh>
          <mesh castShadow position={[-0.31, 0.08, 0.1]} rotation={[0.35, -0.05, 0.1]}>
            <capsuleGeometry args={[0.055, 0.16, 10, 20]} />
            <SoftMaterial color={refinedHairColor} roughness={0.94} />
          </mesh>
        </>
      )}

      {hairStyle === "side-sweep" && (
        <>
          {[
            [-0.2, 0.29, 0.315, 0.13],
            [0.02, 0.29, 0.35, 0.17],
            [0.25, 0.2, 0.31, 0.15]
          ].map(([x, y, z, size]) => (
            <mesh key={`${x}-${z}`} castShadow position={[x, y, z]} rotation={[0.1, 0, -0.28]} scale={[1.55, 0.68, 0.9]}>
              <sphereGeometry args={[size, 24, 16]} />
              <SoftMaterial color={refinedHairColor} roughness={0.93} />
            </mesh>
          ))}
          <mesh castShadow position={[-0.08, 0.18, 0.37]} rotation={[0.3, 0, 0.95]}>
            <capsuleGeometry args={[0.02, 0.34, 8, 18]} />
            <SoftMaterial color="#f3eadf" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0.36, 0, 0.05]} rotation={[0.12, 0, -0.12]}>
            <capsuleGeometry args={[0.085, 0.3, 10, 22]} />
            <SoftMaterial color={refinedHairColor} roughness={0.93} />
          </mesh>
        </>
      )}

      {hairStyle === "curly" && (
        <>
          {[
            [-0.37, 0.12, 0.09, 0.115],
            [-0.3, 0.27, 0.2, 0.125],
            [-0.13, 0.35, 0.32, 0.135],
            [0.08, 0.36, 0.32, 0.135],
            [0.27, 0.27, 0.22, 0.125],
            [0.37, 0.11, 0.09, 0.115],
            [-0.23, 0.12, 0.35, 0.11],
            [0.21, 0.12, 0.35, 0.11],
            [0, 0.22, 0.39, 0.105]
          ].map(([x, y, z, size]) => (
            <mesh key={`${x}-${y}-${z}`} castShadow position={[x, y, z]} scale={[1, 0.94, 0.96]}>
              <sphereGeometry args={[size, 22, 18]} />
              <SoftMaterial color={refinedHairColor} roughness={0.95} />
            </mesh>
          ))}
        </>
      )}

      {hairStyle === "bob" && (
        <>
          <mesh castShadow position={[-0.39, -0.06, 0.02]} rotation={[0.03, 0, -0.05]} scale={[0.82, 1.15, 0.72]}>
            <capsuleGeometry args={[0.12, 0.42, 12, 24]} />
            <SoftMaterial color={refinedHairColor} roughness={0.92} />
          </mesh>
          <mesh castShadow position={[0.39, -0.06, 0.02]} rotation={[0.03, 0, 0.05]} scale={[0.82, 1.15, 0.72]}>
            <capsuleGeometry args={[0.12, 0.42, 12, 24]} />
            <SoftMaterial color={refinedHairColor} roughness={0.92} />
          </mesh>
          <mesh castShadow position={[0, 0.18, 0.35]} scale={[1.85, 0.48, 0.42]}>
            <sphereGeometry args={[0.14, 24, 16]} />
            <SoftMaterial color={refinedHairColor} roughness={0.92} />
          </mesh>
          <mesh castShadow position={[0, -0.27, 0.13]} scale={[1.6, 0.18, 0.35]}>
            <sphereGeometry args={[0.14, 24, 12]} />
            <SoftMaterial color={refinedHairColor} roughness={0.92} />
          </mesh>
        </>
      )}

      {hairStyle === "high-puff" && (
        <>
          <mesh castShadow position={[0, 0.52, -0.02]} scale={[1.02, 1.02, 0.95]}>
            <sphereGeometry args={[0.25, 32, 24]} />
            <SoftMaterial color={refinedHairColor} roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, 0.32, 0.05]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.055, 0.18, 10, 20]} />
            <SoftMaterial color={refinedHairColor} roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, 0.29, 0.3]} scale={[1.35, 0.5, 0.45]}>
            <sphereGeometry args={[0.13, 24, 16]} />
            <SoftMaterial color={refinedHairColor} roughness={0.95} />
          </mesh>
        </>
      )}
    </group>
  );
}

function FaceFeatures({
  config,
  eyeX,
  eyeY,
  eyeSize,
  eyeColor,
  hairColor,
  skinColor
}: {
  config: AvatarConfig;
  eyeX: number;
  eyeY: number;
  eyeSize: [number, number, number];
  eyeColor: string;
  hairColor: string;
  skinColor: string;
}) {
  const browRotation = config.eyebrowStyle === "lifted" ? 0.2 : config.eyebrowStyle === "straight" ? 0.02 : -0.12;
  const browThickness = config.eyebrowStyle === "bold" ? 0.018 : 0.012;
  const refinedHairColor = hairPalettes[hairColor.toLowerCase()] ?? hairColor;
  const mouthColor = "#6e4239";
  const scleraScale: [number, number, number] = [eyeSize[0] * 1.55, eyeSize[1] * 1.45, 0.016];
  const irisScale: [number, number, number] = [eyeSize[0] * 0.68, eyeSize[1] * 0.72, 0.01];

  return (
    <group>
      <mesh position={[-eyeX, eyeY, 0.372]} scale={scleraScale}>
        <sphereGeometry args={[1, 24, 18]} />
        <SoftMaterial color="#fff8ee" roughness={0.58} />
      </mesh>
      <mesh position={[eyeX, eyeY, 0.372]} scale={scleraScale}>
        <sphereGeometry args={[1, 24, 18]} />
        <SoftMaterial color="#fff8ee" roughness={0.58} />
      </mesh>
      <mesh position={[-eyeX, eyeY - 0.001, 0.391]} scale={irisScale}>
        <sphereGeometry args={[1, 20, 14]} />
        <SoftMaterial color={eyeColor} roughness={0.38} />
      </mesh>
      <mesh position={[eyeX, eyeY - 0.001, 0.391]} scale={irisScale}>
        <sphereGeometry args={[1, 20, 14]} />
        <SoftMaterial color={eyeColor} roughness={0.38} />
      </mesh>
      <mesh position={[-eyeX, eyeY - 0.002, 0.402]} scale={[eyeSize[0] * 0.28, eyeSize[1] * 0.32, 0.006]}>
        <sphereGeometry args={[1, 14, 10]} />
        <SoftMaterial color="#1f1916" roughness={0.44} />
      </mesh>
      <mesh position={[eyeX, eyeY - 0.002, 0.402]} scale={[eyeSize[0] * 0.28, eyeSize[1] * 0.32, 0.006]}>
        <sphereGeometry args={[1, 14, 10]} />
        <SoftMaterial color="#1f1916" roughness={0.44} />
      </mesh>
      <mesh position={[-eyeX - 0.014, eyeY + 0.013, 0.412]} scale={[0.01, 0.005, 0.004]}>
        <sphereGeometry args={[1, 12, 8]} />
        <SoftMaterial color="#ffffff" roughness={0.28} />
      </mesh>
      <mesh position={[eyeX - 0.014, eyeY + 0.013, 0.412]} scale={[0.01, 0.005, 0.004]}>
        <sphereGeometry args={[1, 12, 8]} />
        <SoftMaterial color="#ffffff" roughness={0.28} />
      </mesh>
      <mesh position={[-eyeX, eyeY + 0.034, 0.399]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.005, 0.09, 6, 12]} />
        <SoftMaterial color={skinColor} roughness={0.86} />
      </mesh>
      <mesh position={[eyeX, eyeY + 0.034, 0.399]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.005, 0.09, 6, 12]} />
        <SoftMaterial color={skinColor} roughness={0.86} />
      </mesh>

      <mesh position={[-0.15, 0.155, 0.398]} rotation={[0, 0, Math.PI / 2 + browRotation]}>
        <capsuleGeometry args={[browThickness, 0.13, 8, 18]} />
        <SoftMaterial color={refinedHairColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 0.155, 0.398]} rotation={[0, 0, Math.PI / 2 - browRotation]}>
        <capsuleGeometry args={[browThickness, 0.13, 8, 18]} />
        <SoftMaterial color={refinedHairColor} roughness={0.9} />
      </mesh>

      <mesh position={[0, -0.025, 0.403]} scale={[0.032, 0.054, 0.022]}>
        <sphereGeometry args={[1, 18, 12]} />
        <SoftMaterial color={skinColor} roughness={0.86} />
      </mesh>
      <mesh position={[0, -0.172, 0.41]} rotation={[0, 0, Math.PI]} scale={[1.12, 0.72, 1]}>
        <torusGeometry args={[0.07, 0.0055, 8, 32, Math.PI]} />
        <SoftMaterial color={mouthColor} roughness={0.72} />
      </mesh>

      {config.facialHairStyle !== "none" && (
        <group>
          {config.facialHairStyle === "stubble" && (
            <mesh position={[0, -0.215, 0.404]} scale={[0.18, 0.075, 0.015]}>
              <sphereGeometry args={[1, 22, 12]} />
              <SoftMaterial color={refinedHairColor} roughness={0.96} transparent opacity={0.38} />
            </mesh>
          )}
          {config.facialHairStyle === "goatee" && (
            <mesh position={[0, -0.255, 0.405]} scale={[0.07, 0.09, 0.014]}>
              <sphereGeometry args={[1, 18, 12]} />
              <SoftMaterial color={refinedHairColor} roughness={0.95} />
            </mesh>
          )}
          {config.facialHairStyle === "full-beard" && (
            <mesh position={[0, -0.245, 0.387]} scale={[0.26, 0.18, 0.04]}>
              <sphereGeometry args={[1, 28, 16]} />
              <SoftMaterial color={refinedHairColor} roughness={0.95} />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
}

function Accessories({
  accessoryIds,
  eyeX
}: {
  accessoryIds: string[];
  eyeX: number;
}) {
  const hasAccessory = (id: string) => accessoryIds.includes(id);

  return (
    <>
      {hasAccessory("round-glasses") && (
        <group position={[0, 0.033, 0.424]}>
          <mesh position={[-eyeX, 0, 0]} scale={[1.08, 0.82, 1]}>
            <torusGeometry args={[0.064, 0.0048, 10, 40]} />
            <SoftMaterial color="#263437" roughness={0.5} metalness={0.08} />
          </mesh>
          <mesh position={[eyeX, 0, 0]} scale={[1.08, 0.82, 1]}>
            <torusGeometry args={[0.064, 0.0048, 10, 40]} />
            <SoftMaterial color="#263437" roughness={0.5} metalness={0.08} />
          </mesh>
          <mesh position={[0, 0.004, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.004, Math.max(0.052, eyeX * 0.66), 6, 12]} />
            <SoftMaterial color="#263437" roughness={0.5} metalness={0.08} />
          </mesh>
        </group>
      )}

      {hasAccessory("visor") && (
        <mesh position={[0, 0.065, 0.432]} scale={[0.31, 0.046, 0.019]}>
          <sphereGeometry args={[1, 32, 12]} />
          <SoftMaterial color="#8ad9d6" roughness={0.24} metalness={0.08} transparent opacity={0.68} />
        </mesh>
      )}

      {hasAccessory("earrings") && (
        <>
          <mesh position={[-0.424, -0.078, 0.07]}>
            <torusGeometry args={[0.028, 0.0045, 8, 24]} />
            <SoftMaterial color="#d8bc67" metalness={0.25} roughness={0.34} />
          </mesh>
          <mesh position={[0.424, -0.078, 0.07]}>
            <torusGeometry args={[0.028, 0.0045, 8, 24]} />
            <SoftMaterial color="#d8bc67" metalness={0.25} roughness={0.34} />
          </mesh>
        </>
      )}

      {hasAccessory("headphones") && (
        <group position={[0, 0.07, 0]}>
          <mesh>
            <torusGeometry args={[0.475, 0.013, 12, 54, Math.PI]} />
            <SoftMaterial color="#2a3030" roughness={0.68} />
          </mesh>
          <mesh position={[-0.416, -0.006, 0.065]} scale={[0.7, 1.08, 0.8]}>
            <capsuleGeometry args={[0.055, 0.11, 10, 18]} />
            <SoftMaterial color="#2a3030" roughness={0.68} />
          </mesh>
          <mesh position={[0.416, -0.006, 0.065]} scale={[0.7, 1.08, 0.8]}>
            <capsuleGeometry args={[0.055, 0.11, 10, 18]} />
            <SoftMaterial color="#2a3030" roughness={0.68} />
          </mesh>
        </group>
      )}
    </>
  );
}

function AnimatedAvatar({
  animationOverride,
  config,
  oneShotAnimation,
  onOneShotComplete
}: {
  animationOverride?: AvatarAnimationOverride;
  config: AvatarConfig;
  oneShotAnimation?: AvatarOneShotAnimation | null;
  onOneShotComplete?: () => void;
}) {
  const group = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const head = useRef<Group>(null);
  const animationStartedAt = useRef<number | null>(null);
  const oneShotStartedAt = useRef<number | null>(null);
  const previousOneShot = useRef<AvatarOneShotAnimation | null | undefined>(null);
  const reducedMotion = usePrefersReducedMotion();

  const skinColor = skinToneColors[config.skinTone] ?? config.skinTone ?? skinToneColors.amber;
  const blushColor = skinBlushColors[config.skinTone] ?? "#ae674f";
  const hairColor = config.hairColor || "#15110f";
  const eyeColor = config.eyeColor || "#2f1d14";
  const outfitColor = outfitColors[config.outfit] ?? "#5d8580";
  const trimColor = outfitTrimColors[config.outfit] ?? "#f5efe6";
  const activeFaceScale = faceScale[config.faceShape] ?? faceScale.oval;
  const activeHairScale = hairScale[config.hairStyle] ?? hairScale["short-textured"];

  const eyeX = config.eyeShape === "round" ? 0.158 : config.eyeShape === "bright" ? 0.17 : 0.15;
  const eyeY = config.eyeShape === "soft" ? 0.04 : 0.054;
  const eyeSize: [number, number, number] =
    config.eyeShape === "round"
      ? [0.039, 0.043, 0.02]
      : config.eyeShape === "bright"
        ? [0.046, 0.033, 0.02]
        : [0.044, 0.027, 0.019];

  const neckShape = useMemo(() => {
    if (config.outfit === "space-suit") return { radius: 0.12, length: 0.1 };
    return { radius: 0.105, length: 0.12 };
  }, [config.outfit]);

  const baseAnimation = resolveAnimationName(animationOverride ?? config.animation);

  useEffect(() => {
    animationStartedAt.current = null;
  }, [baseAnimation]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (animationStartedAt.current === null) {
      animationStartedAt.current = time;
    }

    if (previousOneShot.current !== oneShotAnimation) {
      previousOneShot.current = oneShotAnimation;
      oneShotStartedAt.current = oneShotAnimation ? time : null;
    }

    const elapsed = time - animationStartedAt.current;
    const motionScale = reducedMotion ? 0.18 : 1;
    let rootX = 0;
    let rootY = 0;
    let rootRotationY = Math.sin(time * 0.42) * 0.018 * motionScale;
    let rootRotationZ = 0;
    let headRotationY = Math.sin(time * 0.5) * 0.012 * motionScale;
    let headRotationZ = Math.sin(time * 0.74) * 0.014 * motionScale;
    let rightArmRotationZ = -0.22;
    let rightArmRotationX = 0;
    let leftArmRotationZ = 0.22;

    if (!reducedMotion) {
      if (baseAnimation === "idle_breathing") {
        rootY += Math.sin(time * 1.55) * 0.014;
      }

      if (baseAnimation === "small_bounce") {
        rootY += Math.abs(Math.sin(time * 2.05)) * 0.035;
        rootRotationY += Math.sin(time * 1.4) * 0.035;
      }

      if (baseAnimation === "tiny_shake") {
        rootX += Math.sin(time * 10.5) * 0.012;
        rootRotationZ += Math.sin(time * 12) * 0.022;
      }

      if (baseAnimation === "wave") {
        rightArmRotationZ = -1.0 + Math.sin(time * 6) * 0.28;
        rightArmRotationX = -0.12;
        headRotationZ += Math.sin(time * 1.8) * 0.018;
      }

      if (baseAnimation === "sleep_float") {
        rootY += 0.045 + Math.sin(time * 0.82) * 0.035;
        rootRotationZ += Math.sin(time * 0.62) * 0.045;
        headRotationZ += -0.08 + Math.sin(time * 0.8) * 0.018;
      }

      if (baseAnimation === "slide_in") {
        const progress = easeOutCubic(clamp01(elapsed / 0.9));
        rootX += -0.72 * (1 - progress);
        rootY += Math.sin(progress * Math.PI) * 0.035;
      }

      if (baseAnimation === "slide_out") {
        const progress = easeInCubic(clamp01(elapsed / 0.9));
        rootX += 0.72 * progress;
        rootY += Math.sin(progress * Math.PI) * 0.025;
      }

      if (baseAnimation === "lean_left") {
        rootRotationZ += 0.16 + Math.sin(time * 1.4) * 0.014;
        headRotationZ -= 0.05;
      }

      if (baseAnimation === "lean_right") {
        rootRotationZ -= 0.16 + Math.sin(time * 1.4) * 0.014;
        headRotationZ += 0.05;
      }
    }

    if (oneShotAnimation && oneShotStartedAt.current !== null) {
      const duration = oneShotDurations[oneShotAnimation] * (reducedMotion ? 0.7 : 1);
      const progress = clamp01((time - oneShotStartedAt.current) / duration);
      const pulse = Math.sin(progress * Math.PI);
      const cycle = Math.sin(progress * Math.PI * 2);
      const oneShotScale = reducedMotion && oneShotAnimation !== "wave" ? 0.35 : 1;

      if (oneShotAnimation === "wave") {
        rightArmRotationZ = -1.05 + Math.sin(progress * Math.PI * 8) * 0.32 * oneShotScale;
        rightArmRotationX = -0.13;
        headRotationZ += pulse * 0.035 * oneShotScale;
      }

      if (oneShotAnimation === "tiny_shake") {
        rootX += cycle * 0.034 * oneShotScale;
        rootRotationZ += cycle * 0.05 * oneShotScale;
      }

      if (oneShotAnimation === "slide_in") {
        rootX += -0.85 * (1 - easeOutCubic(progress)) * oneShotScale;
        rootY += pulse * 0.045 * oneShotScale;
      }

      if (oneShotAnimation === "slide_out") {
        rootX += 0.85 * easeInCubic(progress) * oneShotScale;
        rootY += pulse * 0.035 * oneShotScale;
      }

      if (oneShotAnimation === "lean_left") {
        rootRotationZ += pulse * 0.22 * oneShotScale;
        headRotationZ -= pulse * 0.08 * oneShotScale;
      }

      if (oneShotAnimation === "lean_right") {
        rootRotationZ -= pulse * 0.22 * oneShotScale;
        headRotationZ += pulse * 0.08 * oneShotScale;
      }

      if (progress >= 1) {
        oneShotStartedAt.current = null;
        previousOneShot.current = oneShotAnimation;
        onOneShotComplete?.();
      }
    }

    if (group.current) {
      group.current.position.x = rootX;
      group.current.position.y = rootY;
      group.current.rotation.y = rootRotationY;
      group.current.rotation.z = rootRotationZ;
    }

    if (head.current) {
      head.current.rotation.z = headRotationZ;
      head.current.rotation.y = headRotationY;
    }

    if (rightArm.current) {
      rightArm.current.rotation.z = rightArmRotationZ;
      rightArm.current.rotation.x = rightArmRotationX;
    }

    if (leftArm.current) {
      leftArm.current.rotation.z = leftArmRotationZ;
      leftArm.current.rotation.x = 0;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <RoundedTorso outfit={config.outfit} outfitColor={outfitColor} trimColor={trimColor} />

      <mesh castShadow position={[0, 1.18, 0]} scale={[1, 0.88, 1]}>
        <capsuleGeometry args={[neckShape.radius, neckShape.length, 12, 22]} />
        <SoftMaterial color={skinColor} roughness={0.84} />
      </mesh>

      <Arm side={-1} outfitColor={outfitColor} skinColor={skinColor} armRef={leftArm} />
      <Arm side={1} outfitColor={outfitColor} skinColor={skinColor} armRef={rightArm} />

      <group ref={head} name="head" position={[0, 1.58, 0]}>
        <mesh castShadow receiveShadow scale={activeFaceScale}>
          <sphereGeometry args={[0.425, 64, 46]} />
          <SoftMaterial color={skinColor} roughness={0.82} />
        </mesh>

        <FaceShapeDetails faceShape={config.faceShape} skinColor={skinColor} blushColor={blushColor} />
        <HairSculpt hairStyle={config.hairStyle} hairColor={hairColor} activeHairScale={activeHairScale} />
        <FaceFeatures
          config={config}
          eyeX={eyeX}
          eyeY={eyeY}
          eyeSize={eyeSize}
          eyeColor={eyeColor}
          hairColor={hairColor}
          skinColor={skinColor}
        />
        <Accessories accessoryIds={config.accessoryIds} eyeX={eyeX} />
      </group>
    </group>
  );
}

export function AvatarRenderer({
  animationOverride,
  captureRef,
  config,
  className,
  controls = true,
  oneShotAnimation,
  onOneShotComplete,
  transparent = false,
  style
}: AvatarRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useImperativeHandle(
    captureRef,
    () => ({
      capturePng: () => canvasRef.current?.toDataURL("image/png") ?? null
    }),
    []
  );

  return (
    <div className={className} style={{ width: "100%", height: "100%", minHeight: 360, ...style }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.52, 3.05], fov: 32 }}
        gl={{ alpha: transparent, preserveDrawingBuffer: Boolean(captureRef) }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
        }}
      >
        {!transparent && <color attach="background" args={["#f7f1e8"]} />}
        <ambientLight intensity={0.72} />
        <directionalLight castShadow position={[2.6, 4.1, 3.1]} intensity={1.08} color="#fff7ed" shadow-mapSize={[1536, 1536]} />
        <directionalLight position={[-2.7, 2.1, 2.2]} intensity={0.48} color="#f0dcc9" />
        <directionalLight position={[0.35, 2.55, -3.1]} intensity={0.64} color="#dbe8ff" />
        <pointLight position={[-1.8, 1.45, 1.8]} intensity={0.16} color="#fff2d7" />
        <Environment preset="studio" environmentIntensity={0.18} />
        <AnimatedAvatar
          animationOverride={animationOverride}
          config={config}
          oneShotAnimation={oneShotAnimation}
          onOneShotComplete={onOneShotComplete}
        />
        {!transparent && (
          <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.098, 0]}>
            <circleGeometry args={[1.42, 72]} />
            <SoftMaterial color="#e7ded1" roughness={0.94} />
          </mesh>
        )}
        <ContactShadows position={[0, 0.105, 0]} opacity={transparent ? 0.14 : 0.21} scale={3.7} blur={3.2} far={2.3} />
        {controls && <OrbitControls enablePan={false} minDistance={2.2} maxDistance={4.4} target={[0, 1.24, 0]} />}
      </Canvas>
    </div>
  );
}
