import type { AnimationName, AvatarConfig, FaceShape, HairStyle, Outfit } from "@avatar-platform/avatar-core";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
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

export interface AvatarRendererProps {
  config: AvatarConfig;
  className?: string;
  controls?: boolean;
  transparent?: boolean;
  animationOverride?: AvatarAnimationOverride;
  oneShotAnimation?: AvatarOneShotAnimation | null;
  onOneShotComplete?: () => void;
  style?: CSSProperties;
}

const skinToneColors: Record<string, string> = {
  porcelain: "#f4cdbc",
  fair: "#f4cdbc",
  sand: "#dfad88",
  light: "#dfad88",
  amber: "#c6855a",
  medium: "#c6855a",
  copper: "#9b6242",
  tan: "#9b6242",
  mahogany: "#62402f",
  deep: "#62402f"
};

const skinBlushColors: Record<string, string> = {
  porcelain: "#f0aa9f",
  sand: "#ce8d77",
  amber: "#ae674f",
  copper: "#854a39",
  mahogany: "#4b2c25"
};

const outfitColors: Record<Outfit | string, string> = {
  "studio-hoodie": "#5d8580",
  "tailored-jacket": "#26313b",
  "tech-tee": "#9d705c",
  "soft-knit": "#c9ad66",
  "space-suit": "#ebe8dd"
};

const outfitTrimColors: Record<Outfit | string, string> = {
  "studio-hoodie": "#f5efe6",
  "tailored-jacket": "#f0e7dc",
  "tech-tee": "#e7d5c7",
  "soft-knit": "#f5e7bc",
  "space-suit": "#94bfc6"
};

const hairPalettes: Record<string, string> = {
  "#15110f": "#201815",
  "#2f1d14": "#41291d",
  "#4b2e22": "#5d3a29",
  "#7f3f2a": "#914e35",
  "#caa968": "#d8bd7a",
  "#b8bcc0": "#c8ccd0",
  "#247476": "#2c8585"
};

const faceScale: Record<FaceShape | string, [number, number, number]> = {
  round: [1.04, 0.96, 0.98],
  oval: [0.96, 1.1, 0.98],
  square: [1.06, 1.01, 0.96],
  heart: [1.03, 1.07, 0.98],
  long: [0.91, 1.2, 0.96]
};

const hairScale: Record<HairStyle | string, [number, number, number]> = {
  "short-textured": [1.02, 0.64, 0.98],
  bob: [1.12, 0.9, 1.04],
  curly: [1.12, 0.78, 1.06],
  "high-puff": [0.92, 1.2, 0.92],
  "side-sweep": [1.12, 0.66, 0.98],
  buzz: [0.94, 0.3, 0.94]
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
    outfit === "space-suit" ? [0.72, 0.58, 0.34] : [0.64, 0.56, 0.3];
  const shoulderScale: [number, number, number] =
    outfit === "tailored-jacket" ? [0.82, 0.16, 0.32] : [0.76, 0.16, 0.3];

  return (
    <group name="body" position={[0, 0.72, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.02, 0]} scale={torsoScale}>
        <sphereGeometry args={[1, 48, 32]} />
        <SoftMaterial color={outfitColor} roughness={0.88} metalness={outfit === "space-suit" ? 0.04 : 0} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.34, 0]} scale={shoulderScale}>
        <sphereGeometry args={[1, 40, 24]} />
        <SoftMaterial color={outfitColor} roughness={0.86} metalness={outfit === "space-suit" ? 0.04 : 0} />
      </mesh>
      <mesh position={[0, 0.34, 0.255]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.2, 0.016, 12, 44, Math.PI]} />
        <SoftMaterial color={trimColor} roughness={0.82} />
      </mesh>
      {outfit === "studio-hoodie" && (
        <>
          <mesh position={[-0.065, 0.16, 0.298]} rotation={[0.12, 0, 0.08]}>
            <capsuleGeometry args={[0.012, 0.28, 8, 16]} />
            <SoftMaterial color={trimColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.065, 0.16, 0.298]} rotation={[0.12, 0, -0.08]}>
            <capsuleGeometry args={[0.012, 0.28, 8, 16]} />
            <SoftMaterial color={trimColor} roughness={0.9} />
          </mesh>
        </>
      )}
      {outfit === "tailored-jacket" && (
        <mesh position={[0, 0.12, 0.305]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.014, 0.42, 8, 18]} />
          <SoftMaterial color={trimColor} roughness={0.84} />
        </mesh>
      )}
      {outfit === "space-suit" && (
        <mesh position={[0, 0.12, 0.33]} scale={[0.22, 0.09, 0.035]}>
          <sphereGeometry args={[1, 24, 16]} />
          <SoftMaterial color="#9bcad0" roughness={0.42} metalness={0.08} />
        </mesh>
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
    <group ref={armRef} position={[side * 0.55, 1.02, 0.02]} rotation={[0, 0, side * 0.22]}>
      <mesh castShadow position={[0, -0.23, 0]} rotation={[0, 0, side * 0.05]}>
        <capsuleGeometry args={[0.075, 0.42, 12, 22]} />
        <SoftMaterial color={outfitColor} roughness={0.88} />
      </mesh>
      <mesh castShadow position={[0, -0.53, 0.018]} scale={[1, 0.88, 1]}>
        <sphereGeometry args={[0.088, 24, 18]} />
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
    [-0.26, 0.22, 0.27, 0.13],
    [-0.1, 0.28, 0.32, 0.15],
    [0.08, 0.28, 0.31, 0.14],
    [0.25, 0.22, 0.26, 0.12]
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
      <mesh castShadow position={[0, 0.25, -0.02]} scale={activeHairScale}>
        <sphereGeometry args={[0.438, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <SoftMaterial color={refinedHairColor} roughness={0.92} />
      </mesh>

      {hairStyle === "short-textured" && (
        <>
          {frontTufts.map(([x, y, z, size]) => (
            <mesh key={`${x}-${size}`} castShadow position={[x, y, z]} scale={[1.05, 0.72, 0.84]}>
              <sphereGeometry args={[size, 22, 16]} />
              <SoftMaterial color={refinedHairColor} roughness={0.94} />
            </mesh>
          ))}
          <mesh castShadow position={[0.32, 0.09, 0.08]} rotation={[0.35, 0.05, -0.08]}>
            <capsuleGeometry args={[0.07, 0.22, 10, 20]} />
            <SoftMaterial color={refinedHairColor} roughness={0.94} />
          </mesh>
        </>
      )}

      {hairStyle === "side-sweep" && (
        <>
          {[
            [-0.15, 0.3, 0.31, 0.15],
            [0.07, 0.28, 0.33, 0.17],
            [0.28, 0.18, 0.27, 0.14]
          ].map(([x, y, z, size]) => (
            <mesh key={`${x}-${z}`} castShadow position={[x, y, z]} rotation={[0.1, 0, -0.22]} scale={[1.4, 0.72, 0.9]}>
              <sphereGeometry args={[size, 24, 16]} />
              <SoftMaterial color={refinedHairColor} roughness={0.93} />
            </mesh>
          ))}
          <mesh castShadow position={[0.36, 0.01, 0.03]} rotation={[0.12, 0, -0.12]}>
            <capsuleGeometry args={[0.095, 0.32, 10, 22]} />
            <SoftMaterial color={refinedHairColor} roughness={0.93} />
          </mesh>
        </>
      )}

      {hairStyle === "curly" && (
        <>
          {[
            [-0.36, 0.12, 0.08, 0.12],
            [-0.28, 0.28, 0.2, 0.13],
            [-0.12, 0.34, 0.31, 0.14],
            [0.08, 0.35, 0.31, 0.14],
            [0.27, 0.27, 0.21, 0.13],
            [0.36, 0.1, 0.08, 0.12],
            [-0.2, 0.13, 0.34, 0.115],
            [0.2, 0.12, 0.34, 0.115]
          ].map(([x, y, z, size]) => (
            <mesh key={`${x}-${y}-${z}`} castShadow position={[x, y, z]}>
              <sphereGeometry args={[size, 22, 18]} />
              <SoftMaterial color={refinedHairColor} roughness={0.95} />
            </mesh>
          ))}
        </>
      )}

      {hairStyle === "bob" && (
        <>
          <mesh castShadow position={[-0.38, -0.05, 0.01]} rotation={[0.03, 0, -0.05]} scale={[0.86, 1.12, 0.72]}>
            <capsuleGeometry args={[0.12, 0.42, 12, 24]} />
            <SoftMaterial color={refinedHairColor} roughness={0.92} />
          </mesh>
          <mesh castShadow position={[0.38, -0.05, 0.01]} rotation={[0.03, 0, 0.05]} scale={[0.86, 1.12, 0.72]}>
            <capsuleGeometry args={[0.12, 0.42, 12, 24]} />
            <SoftMaterial color={refinedHairColor} roughness={0.92} />
          </mesh>
          <mesh castShadow position={[0, 0.17, 0.34]} scale={[1.8, 0.5, 0.42]}>
            <sphereGeometry args={[0.14, 24, 16]} />
            <SoftMaterial color={refinedHairColor} roughness={0.92} />
          </mesh>
        </>
      )}

      {hairStyle === "high-puff" && (
        <>
          <mesh castShadow position={[0, 0.55, -0.02]} scale={[1.05, 1.08, 0.95]}>
            <sphereGeometry args={[0.27, 32, 24]} />
            <SoftMaterial color={refinedHairColor} roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, 0.29, 0.29]} scale={[1.35, 0.52, 0.45]}>
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
  const mouthColor = "#6d3d34";

  return (
    <group>
      <mesh position={[-eyeX, eyeY, 0.376]} scale={eyeSize}>
        <sphereGeometry args={[1, 24, 18]} />
        <SoftMaterial color={eyeColor} roughness={0.42} />
      </mesh>
      <mesh position={[eyeX, eyeY, 0.376]} scale={eyeSize}>
        <sphereGeometry args={[1, 24, 18]} />
        <SoftMaterial color={eyeColor} roughness={0.42} />
      </mesh>
      <mesh position={[-eyeX - 0.014, eyeY + 0.012, 0.407]} scale={[0.012, 0.006, 0.004]}>
        <sphereGeometry args={[1, 12, 8]} />
        <SoftMaterial color="#fff7ed" roughness={0.34} />
      </mesh>
      <mesh position={[eyeX - 0.014, eyeY + 0.012, 0.407]} scale={[0.012, 0.006, 0.004]}>
        <sphereGeometry args={[1, 12, 8]} />
        <SoftMaterial color="#fff7ed" roughness={0.34} />
      </mesh>

      <mesh position={[-0.15, 0.155, 0.398]} rotation={[0, 0, Math.PI / 2 + browRotation]}>
        <capsuleGeometry args={[browThickness, 0.13, 8, 18]} />
        <SoftMaterial color={refinedHairColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 0.155, 0.398]} rotation={[0, 0, Math.PI / 2 - browRotation]}>
        <capsuleGeometry args={[browThickness, 0.13, 8, 18]} />
        <SoftMaterial color={refinedHairColor} roughness={0.9} />
      </mesh>

      <mesh position={[0, -0.03, 0.402]} scale={[0.035, 0.055, 0.022]}>
        <sphereGeometry args={[1, 18, 12]} />
        <SoftMaterial color={skinColor} roughness={0.86} />
      </mesh>
      <mesh position={[0, -0.172, 0.407]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.077, 0.006, 8, 28, Math.PI]} />
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
        <group position={[0, 0.032, 0.414]}>
          <mesh position={[-eyeX, 0, 0]}>
            <torusGeometry args={[0.075, 0.006, 10, 36]} />
            <SoftMaterial color="#243034" roughness={0.42} metalness={0.08} />
          </mesh>
          <mesh position={[eyeX, 0, 0]}>
            <torusGeometry args={[0.075, 0.006, 10, 36]} />
            <SoftMaterial color="#243034" roughness={0.42} metalness={0.08} />
          </mesh>
          <mesh position={[0, 0.004, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.005, Math.max(0.06, eyeX * 0.74), 6, 12]} />
            <SoftMaterial color="#243034" roughness={0.42} metalness={0.08} />
          </mesh>
        </group>
      )}

      {hasAccessory("visor") && (
        <mesh position={[0, 0.065, 0.43]} scale={[0.34, 0.06, 0.024]}>
          <sphereGeometry args={[1, 32, 12]} />
          <SoftMaterial color="#78d2d2" roughness={0.26} metalness={0.08} transparent opacity={0.72} />
        </mesh>
      )}

      {hasAccessory("earrings") && (
        <>
          <mesh position={[-0.432, -0.075, 0.055]}>
            <torusGeometry args={[0.038, 0.005, 8, 22]} />
            <SoftMaterial color="#d8bc67" metalness={0.25} roughness={0.34} />
          </mesh>
          <mesh position={[0.432, -0.075, 0.055]}>
            <torusGeometry args={[0.038, 0.005, 8, 22]} />
            <SoftMaterial color="#d8bc67" metalness={0.25} roughness={0.34} />
          </mesh>
        </>
      )}

      {hasAccessory("headphones") && (
        <group position={[0, 0.07, 0]}>
          <mesh>
            <torusGeometry args={[0.49, 0.016, 12, 48, Math.PI]} />
            <SoftMaterial color="#2b3032" roughness={0.64} />
          </mesh>
          <mesh position={[-0.43, -0.005, 0.055]} scale={[0.72, 1.18, 0.86]}>
            <capsuleGeometry args={[0.06, 0.12, 10, 18]} />
            <SoftMaterial color="#2b3032" roughness={0.64} />
          </mesh>
          <mesh position={[0.43, -0.005, 0.055]} scale={[0.72, 1.18, 0.86]}>
            <capsuleGeometry args={[0.06, 0.12, 10, 18]} />
            <SoftMaterial color="#2b3032" roughness={0.64} />
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

  const eyeX = config.eyeShape === "round" ? 0.155 : config.eyeShape === "bright" ? 0.168 : 0.148;
  const eyeY = config.eyeShape === "soft" ? 0.037 : 0.05;
  const eyeSize: [number, number, number] =
    config.eyeShape === "round"
      ? [0.04, 0.045, 0.02]
      : config.eyeShape === "bright"
        ? [0.048, 0.034, 0.02]
        : [0.046, 0.027, 0.019];

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

      <mesh castShadow position={[0, 1.18, 0]} scale={[1, 0.9, 1]}>
        <capsuleGeometry args={[neckShape.radius, neckShape.length, 12, 22]} />
        <SoftMaterial color={skinColor} roughness={0.84} />
      </mesh>

      <Arm side={-1} outfitColor={outfitColor} skinColor={skinColor} armRef={leftArm} />
      <Arm side={1} outfitColor={outfitColor} skinColor={skinColor} armRef={rightArm} />

      <group ref={head} name="head" position={[0, 1.56, 0]}>
        <mesh castShadow receiveShadow scale={activeFaceScale}>
          <sphereGeometry args={[0.405, 56, 42]} />
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
  config,
  className,
  controls = true,
  oneShotAnimation,
  onOneShotComplete,
  transparent = false,
  style
}: AvatarRendererProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%", minHeight: 360, ...style }}>
      <Canvas shadows camera={{ position: [0, 1.48, 3.25], fov: 34 }} gl={{ alpha: transparent }}>
        {!transparent && <color attach="background" args={["#f8f5ef"]} />}
        <ambientLight intensity={0.88} />
        <directionalLight castShadow position={[2.8, 4.3, 3.2]} intensity={1.25} shadow-mapSize={[1536, 1536]} />
        <directionalLight position={[-2.6, 2.2, 2]} intensity={0.42} color="#f4dfcd" />
        <directionalLight position={[0, 2.4, -3]} intensity={0.58} color="#dcecff" />
        <Environment preset="studio" environmentIntensity={0.24} />
        <AnimatedAvatar
          animationOverride={animationOverride}
          config={config}
          oneShotAnimation={oneShotAnimation}
          onOneShotComplete={onOneShotComplete}
        />
        {!transparent && (
          <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.1, 0]}>
            <circleGeometry args={[1.38, 64]} />
            <SoftMaterial color="#e8e1d6" roughness={0.92} />
          </mesh>
        )}
        <ContactShadows position={[0, 0.105, 0]} opacity={transparent ? 0.16 : 0.24} scale={3.5} blur={2.8} far={2.2} />
        {controls && <OrbitControls enablePan={false} minDistance={2.25} maxDistance={4.6} target={[0, 1.2, 0]} />}
      </Canvas>
    </div>
  );
}
