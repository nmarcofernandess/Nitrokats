import { Edges } from '@react-three/drei';

type Vec3 = [number, number, number];

const ARENA_SIZE = 60;
const WALL_HEIGHT = 4;

export const Arena = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[ARENA_SIZE, ARENA_SIZE]} />
        <meshStandardMaterial color="#050510" />
      </mesh>

      <gridHelper args={[ARENA_SIZE, ARENA_SIZE / 2, 0xff00ff, 0x1a1a3a]} position={[0, 0, 0]} />

      <Wall position={[0, WALL_HEIGHT / 2, -ARENA_SIZE / 2]} rotation={[0, 0, 0]} width={ARENA_SIZE} />
      <Wall position={[0, WALL_HEIGHT / 2, ARENA_SIZE / 2]} rotation={[0, 0, 0]} width={ARENA_SIZE} />
      <Wall position={[ARENA_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} width={ARENA_SIZE} />
      <Wall position={[-ARENA_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} width={ARENA_SIZE} />

      <Pillar position={[-ARENA_SIZE / 2, 0, -ARENA_SIZE / 2]} />
      <Pillar position={[ARENA_SIZE / 2, 0, -ARENA_SIZE / 2]} />
      <Pillar position={[-ARENA_SIZE / 2, 0, ARENA_SIZE / 2]} />
      <Pillar position={[ARENA_SIZE / 2, 0, ARENA_SIZE / 2]} />
    </group>
  );
};

interface WallProps {
  position: Vec3;
  rotation: Vec3;
  width: number;
}

const Wall = ({ position, rotation, width }: WallProps) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[width, WALL_HEIGHT, 1]} />
        <meshStandardMaterial color="#0a0a20" />
        <Edges color="#00ffff" threshold={15} />
      </mesh>

      <mesh position={[0, 0, 0.51]}>
        <planeGeometry args={[width, 0.2]} />
        <meshBasicMaterial color="#00ffff" toneMapped={false} />
      </mesh>
    </group>
  );
};

interface PillarProps {
  position: Vec3;
}

const Pillar = ({ position }: PillarProps) => {
  return (
    <mesh position={[position[0], WALL_HEIGHT / 2, position[2]]}>
      <boxGeometry args={[2, WALL_HEIGHT + 2, 2]} />
      <meshStandardMaterial color="#1a1a3a" />
      <Edges color="#ff00ff" threshold={15} />
    </mesh>
  );
};
