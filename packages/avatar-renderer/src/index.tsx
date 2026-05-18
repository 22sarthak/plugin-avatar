import type { AvatarConfig } from "@avatar-platform/avatar-core";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export interface AvatarRendererProps {
  config: AvatarConfig;
  className?: string;
}

const skinToneColors: Record<string, string> = {
  fair: "#f2c9b6",
  light: "#d9a37c",
  medium: "#b9784f",
  tan: "#8d5638",
  deep: "#573421"
};

function PlaceholderAvatar({ config }: { config: AvatarConfig }) {
  const skinColor = skinToneColors[config.skinTone] ?? config.skinTone ?? "#b9784f";
  const hairColor = config.hairColor || "#1d1714";
  const eyeColor = config.eyeColor || "#3b2416";

  return (
    <group>
      <mesh position={[0, 0.95, 0]}>
        <capsuleGeometry args={[0.45, 0.8, 12, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color={skinColor} roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.88, -0.02]}>
        <sphereGeometry args={[0.43, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>
      <mesh position={[-0.14, 1.58, 0.37]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color={eyeColor} />
      </mesh>
      <mesh position={[0.14, 1.58, 0.37]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color={eyeColor} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.0, 0.82, 0.42]} />
        <meshStandardMaterial color="#426b69" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function AvatarRenderer({ config, className }: AvatarRendererProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%", minHeight: 360 }}>
      <Canvas camera={{ position: [0, 1.45, 3.4], fov: 38 }}>
        <color attach="background" args={["#f7f4ef"]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 3, 4]} intensity={1.5} />
        <PlaceholderAvatar config={config} />
        <OrbitControls enablePan={false} minDistance={2.3} maxDistance={5} target={[0, 1.15, 0]} />
      </Canvas>
    </div>
  );
}
