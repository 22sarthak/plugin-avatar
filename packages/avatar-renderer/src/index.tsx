import type { AvatarConfig, FaceShape, HairStyle, Outfit } from "@avatar-platform/avatar-core";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import type { Group } from "three";

export interface AvatarRendererProps {
  config: AvatarConfig;
  className?: string;
  style?: CSSProperties;
}

const skinToneColors: Record<string, string> = {
  porcelain: "#f0c7b3",
  fair: "#f2c9b6",
  sand: "#d6a27a",
  light: "#d9a37c",
  amber: "#b9784f",
  medium: "#b9784f",
  copper: "#8d5638",
  tan: "#8d5638",
  mahogany: "#55311f",
  deep: "#573421"
};

const outfitColors: Record<Outfit | string, string> = {
  "studio-hoodie": "#426b69",
  "tailored-jacket": "#26343f",
  "tech-tee": "#8f5e46",
  "soft-knit": "#d1b86f",
  "space-suit": "#e8e8df"
};

const faceScale: Record<FaceShape | string, [number, number, number]> = {
  round: [1.04, 0.95, 1],
  oval: [0.95, 1.1, 1],
  square: [1.08, 1, 0.96],
  heart: [1.03, 1.06, 1],
  long: [0.9, 1.22, 0.96]
};

const hairScale: Record<HairStyle | string, [number, number, number]> = {
  "short-textured": [1.04, 0.72, 1.02],
  bob: [1.16, 0.95, 1.08],
  curly: [1.25, 0.88, 1.18],
  "high-puff": [0.92, 1.34, 0.92],
  "side-sweep": [1.24, 0.74, 1],
  buzz: [0.96, 0.42, 0.96]
};

function AnimatedAvatar({ config }: { config: AvatarConfig }) {
  const group = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const head = useRef<Group>(null);

  const skinColor = skinToneColors[config.skinTone] ?? config.skinTone ?? skinToneColors.amber;
  const hairColor = config.hairColor || "#15110f";
  const eyeColor = config.eyeColor || "#2f1d14";
  const outfitColor = outfitColors[config.outfit] ?? "#426b69";
  const activeFaceScale = faceScale[config.faceShape] ?? faceScale.oval;
  const activeHairScale = hairScale[config.hairStyle] ?? hairScale["short-textured"];
  const hasAccessory = (id: string) => config.accessoryIds.includes(id);

  const eyeX = config.eyeShape === "round" ? 0.155 : config.eyeShape === "bright" ? 0.17 : 0.145;
  const eyeY = config.eyeShape === "soft" ? 1.58 : 1.6;
  const eyeSize: [number, number, number] =
    config.eyeShape === "round" ? [0.046, 0.046, 0.046] : config.eyeShape === "bright" ? [0.05, 0.038, 0.046] : [0.045, 0.028, 0.04];

  const browRotation = config.eyebrowStyle === "lifted" ? 0.18 : config.eyebrowStyle === "straight" ? 0 : -0.12;
  const browThickness = config.eyebrowStyle === "bold" ? 0.024 : 0.014;

  const bodyShape = useMemo(() => {
    if (config.outfit === "tailored-jacket") return { width: 0.92, height: 0.84, depth: 0.36 };
    if (config.outfit === "space-suit") return { width: 1.04, height: 0.88, depth: 0.46 };
    return { width: 0.96, height: 0.82, depth: 0.4 };
  }, [config.outfit]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const breathing = Math.sin(time * 1.7) * 0.018;
    const bounce = Math.abs(Math.sin(time * 2.1)) * 0.025;

    if (group.current) {
      group.current.position.y = breathing + (config.animation === "celebrate" ? bounce : 0);
      group.current.rotation.y = config.animation === "celebrate" ? Math.sin(time * 2) * 0.12 : Math.sin(time * 0.45) * 0.035;
    }

    if (head.current) {
      head.current.rotation.z = Math.sin(time * 0.8) * 0.025;
    }

    if (rightArm.current) {
      rightArm.current.rotation.z =
        config.animation === "wave" ? -1.05 + Math.sin(time * 6) * 0.32 : config.animation === "celebrate" ? -1.35 : -0.28;
    }

    if (leftArm.current) {
      leftArm.current.rotation.z = config.animation === "celebrate" ? 1.35 : 0.28;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <group name="body" position={[0, 0.75, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[bodyShape.width, bodyShape.height, bodyShape.depth]} />
          <meshStandardMaterial color={outfitColor} roughness={0.78} metalness={config.outfit === "space-suit" ? 0.08 : 0} />
        </mesh>
        {config.outfit === "studio-hoodie" && (
          <mesh position={[0, 0.23, 0.215]}>
            <torusGeometry args={[0.24, 0.014, 10, 40, Math.PI]} />
            <meshStandardMaterial color="#f2eee7" roughness={0.75} />
          </mesh>
        )}
      </group>

      <group ref={leftArm} position={[-0.55, 1.04, 0]} rotation={[0, 0, 0.28]}>
        <mesh castShadow position={[0, -0.26, 0]}>
          <capsuleGeometry args={[0.08, 0.44, 8, 16]} />
          <meshStandardMaterial color={outfitColor} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, -0.56, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.78} />
        </mesh>
      </group>

      <group ref={rightArm} position={[0.55, 1.04, 0]} rotation={[0, 0, -0.28]}>
        <mesh castShadow position={[0, -0.26, 0]}>
          <capsuleGeometry args={[0.08, 0.44, 8, 16]} />
          <meshStandardMaterial color={outfitColor} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, -0.56, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.78} />
        </mesh>
      </group>

      <group ref={head} name="head" position={[0, 1.55, 0]}>
        <mesh castShadow scale={activeFaceScale}>
          <sphereGeometry args={[0.42, 40, 36]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        <mesh castShadow position={[0, 0.28, -0.02]} scale={activeHairScale}>
          <sphereGeometry args={[0.43, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={hairColor} roughness={0.88} />
        </mesh>

        {config.hairStyle === "bob" && (
          <>
            <mesh castShadow position={[-0.36, -0.02, -0.02]}>
              <capsuleGeometry args={[0.11, 0.42, 8, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.88} />
            </mesh>
            <mesh castShadow position={[0.36, -0.02, -0.02]}>
              <capsuleGeometry args={[0.11, 0.42, 8, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.88} />
            </mesh>
          </>
        )}

        {config.hairStyle === "curly" && (
          <>
            {[-0.32, -0.16, 0.16, 0.32].map((x) => (
              <mesh key={x} castShadow position={[x, 0.21, 0.08]}>
                <sphereGeometry args={[0.13, 18, 18]} />
                <meshStandardMaterial color={hairColor} roughness={0.92} />
              </mesh>
            ))}
          </>
        )}

        {config.hairStyle === "high-puff" && (
          <mesh castShadow position={[0, 0.58, 0]}>
            <sphereGeometry args={[0.28, 24, 24]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
        )}

        <mesh position={[-eyeX, eyeY - 1.55, 0.37]} scale={eyeSize}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={eyeColor} roughness={0.35} />
        </mesh>
        <mesh position={[eyeX, eyeY - 1.55, 0.37]} scale={eyeSize}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={eyeColor} roughness={0.35} />
        </mesh>

        <mesh position={[-0.15, 0.16, 0.39]} rotation={[0, 0, browRotation]}>
          <boxGeometry args={[0.16, browThickness, 0.018]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.15, 0.16, 0.39]} rotation={[0, 0, -browRotation]}>
          <boxGeometry args={[0.16, browThickness, 0.018]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>

        {config.facialHairStyle !== "none" && (
          <mesh position={[0, -0.2, 0.39]} scale={[config.facialHairStyle === "full-beard" ? 1.25 : 0.75, config.facialHairStyle === "goatee" ? 0.48 : 0.32, 0.08]}>
            <sphereGeometry args={[0.18, 20, 12]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
        )}

        {hasAccessory("round-glasses") && (
          <group position={[0, 0.03, 0.405]}>
            <mesh position={[-0.15, 0, 0]}>
              <torusGeometry args={[0.09, 0.009, 8, 28]} />
              <meshStandardMaterial color="#1f2a2b" roughness={0.35} metalness={0.2} />
            </mesh>
            <mesh position={[0.15, 0, 0]}>
              <torusGeometry args={[0.09, 0.009, 8, 28]} />
              <meshStandardMaterial color="#1f2a2b" roughness={0.35} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.12, 0.012, 0.012]} />
              <meshStandardMaterial color="#1f2a2b" />
            </mesh>
          </group>
        )}

        {hasAccessory("visor") && (
          <mesh position={[0, 0.08, 0.43]}>
            <boxGeometry args={[0.52, 0.08, 0.035]} />
            <meshStandardMaterial color="#6fd1d4" roughness={0.2} metalness={0.25} transparent opacity={0.72} />
          </mesh>
        )}

        {hasAccessory("earrings") && (
          <>
            <mesh position={[-0.43, -0.08, 0.05]}>
              <torusGeometry args={[0.045, 0.006, 8, 18]} />
              <meshStandardMaterial color="#d7b85d" metalness={0.35} roughness={0.3} />
            </mesh>
            <mesh position={[0.43, -0.08, 0.05]}>
              <torusGeometry args={[0.045, 0.006, 8, 18]} />
              <meshStandardMaterial color="#d7b85d" metalness={0.35} roughness={0.3} />
            </mesh>
          </>
        )}

        {hasAccessory("headphones") && (
          <group position={[0, 0.08, 0]}>
            <mesh>
              <torusGeometry args={[0.49, 0.018, 10, 44, Math.PI]} />
              <meshStandardMaterial color="#252b2d" roughness={0.55} />
            </mesh>
            <mesh position={[-0.43, 0, 0.05]}>
              <boxGeometry args={[0.1, 0.22, 0.14]} />
              <meshStandardMaterial color="#252b2d" roughness={0.55} />
            </mesh>
            <mesh position={[0.43, 0, 0.05]}>
              <boxGeometry args={[0.1, 0.22, 0.14]} />
              <meshStandardMaterial color="#252b2d" roughness={0.55} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}

export function AvatarRenderer({ config, className, style }: AvatarRendererProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%", minHeight: 360, ...style }}>
      <Canvas shadows camera={{ position: [0, 1.45, 3.6], fov: 36 }}>
        <color attach="background" args={["#f7f4ef"]} />
        <ambientLight intensity={0.75} />
        <directionalLight castShadow position={[2.4, 4, 3.2]} intensity={1.65} shadow-mapSize={[1024, 1024]} />
        <Environment preset="city" environmentIntensity={0.35} />
        <AnimatedAvatar config={config} />
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.1, 0]}>
          <circleGeometry args={[1.45, 48]} />
          <meshStandardMaterial color="#e2ddd3" roughness={0.86} />
        </mesh>
        <ContactShadows position={[0, 0.11, 0]} opacity={0.28} scale={4} blur={2.6} far={2.5} />
        <OrbitControls enablePan={false} minDistance={2.25} maxDistance={5} target={[0, 1.15, 0]} />
      </Canvas>
    </div>
  );
}
