import { useEffect, useMemo, useRef } from 'react';
import { Group } from 'three';
import { gameRegistry } from '../Utils/ObjectRegistry';

type Vec3 = [number, number, number];

interface BuildingData {
  id: string;
  position: Vec3;
  height: number;
  color: string;
  glow: string;
}

const ARENA_SIZE = 60;
const ROAD_WIDTH = 8;
const SIDEWALK_HEIGHT = 0.24;
const BLOCK_SIZE = 2;
const WALL_HEIGHT = 5.2;

const BUILDING_COLORS = ['#8fb8ff', '#7ea7f3', '#93c2b6', '#b5c1ff', '#9ba5ca'];
const WINDOW_GLOWS = ['#8be8ff', '#b9f2ff', '#ffd98e', '#ffb3f2'];

const seededNoise = (x: number, z: number, salt: number) => {
  const value = Math.sin(x * 12.9898 + z * 78.233 + salt * 33.97) * 43758.5453;
  return value - Math.floor(value);
};

const buildCityLayout = (): BuildingData[] => {
  const nodes = [-25, -21, -17, -13, -9, 9, 13, 17, 21, 25];
  const blocks: BuildingData[] = [];
  let index = 0;

  for (const x of nodes) {
    for (const z of nodes) {
      const streetGap = Math.abs(x) <= ROAD_WIDTH || Math.abs(z) <= ROAD_WIDTH;
      if (streetGap) {
        continue;
      }

      const includeRoll = seededNoise(x, z, 1);
      if (includeRoll < 0.16) {
        continue;
      }

      const verticality = seededNoise(x, z, 2);
      const height = 3.5 + verticality * 9 + (Math.abs(x) >= 21 || Math.abs(z) >= 21 ? 1.8 : 0);

      const color = BUILDING_COLORS[Math.floor(seededNoise(x, z, 3) * BUILDING_COLORS.length)];
      const glow = WINDOW_GLOWS[Math.floor(seededNoise(x, z, 4) * WINDOW_GLOWS.length)];

      blocks.push({
        id: `city-bld-${index}`,
        position: [x, 0, z],
        height,
        color,
        glow,
      });
      index += 1;
    }
  }

  return blocks;
};

const COVER_POSITIONS: Vec3[] = [
  [-6, 0, -6],
  [6, 0, -6],
  [-6, 0, 6],
  [6, 0, 6],
  [0, 0, -10],
  [0, 0, 10],
  [-10, 0, 0],
  [10, 0, 0],
];

interface RegisteredBlockProps {
  id: string;
  position: Vec3;
  height: number;
  color: string;
  glow: string;
  withWindows?: boolean;
}

const RegisteredBlock = ({
  id,
  position,
  height,
  color,
  glow,
  withWindows = false,
}: RegisteredBlockProps) => {
  const ref = useRef<Group>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    gameRegistry.registerBlock(id, ref.current);
    return () => {
      gameRegistry.unregisterBlock(id);
    };
  }, [id]);

  const halfHeight = height * 0.5;

  return (
    <group ref={ref} position={[position[0], halfHeight, position[2]]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BLOCK_SIZE, height, BLOCK_SIZE]} />
        <meshStandardMaterial color={color} roughness={0.74} metalness={0.08} />
      </mesh>

      {withWindows && (
        <>
          <mesh position={[0, height * 0.2, BLOCK_SIZE * 0.51]}>
            <planeGeometry args={[1.26, Math.max(1.1, height * 0.48)]} />
            <meshBasicMaterial color={glow} transparent opacity={0.2} toneMapped={false} />
          </mesh>
          <mesh position={[0, height * 0.2, -BLOCK_SIZE * 0.51]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1.26, Math.max(1.1, height * 0.48)]} />
            <meshBasicMaterial color={glow} transparent opacity={0.2} toneMapped={false} />
          </mesh>
          <mesh position={[0, halfHeight + 0.04, 0]}>
            <boxGeometry args={[1.84, 0.08, 1.84]} />
            <meshBasicMaterial color={glow} toneMapped={false} />
          </mesh>
        </>
      )}
    </group>
  );
};

const StreetLamp = ({ position }: { position: Vec3 }) => (
  <group position={position}>
    <mesh castShadow position={[0, 1.7, 0]}>
      <cylinderGeometry args={[0.08, 0.11, 3.4, 8]} />
      <meshStandardMaterial color="#4d5e84" />
    </mesh>
    <mesh position={[0, 3.45, 0]}>
      <sphereGeometry args={[0.2, 10, 10]} />
      <meshStandardMaterial color="#f7dc9d" emissive="#ffe49b" emissiveIntensity={2.2} />
    </mesh>
    <pointLight position={[0, 3.45, 0]} intensity={0.9} distance={7.8} color="#ffe4a6" />
  </group>
);

const BoundaryWall = ({ position, rotation, width }: { position: Vec3; rotation: Vec3; width: number }) => (
  <group position={position} rotation={rotation}>
    <mesh receiveShadow>
      <boxGeometry args={[width, WALL_HEIGHT, 1]} />
      <meshStandardMaterial color="#6e7fa7" roughness={0.8} />
    </mesh>
    <mesh position={[0, WALL_HEIGHT * 0.35, 0.51]}>
      <planeGeometry args={[width, 0.18]} />
      <meshBasicMaterial color="#8be8ff" toneMapped={false} />
    </mesh>
  </group>
);

export const Arena = () => {
  const cityBlocks = useMemo(() => buildCityLayout(), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[ARENA_SIZE, ARENA_SIZE]} />
        <meshStandardMaterial color="#6f93bf" roughness={0.96} metalness={0.02} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[ARENA_SIZE, ROAD_WIDTH]} />
        <meshStandardMaterial color="#3e4d6b" roughness={0.92} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, ARENA_SIZE]} />
        <meshStandardMaterial color="#3e4d6b" roughness={0.92} />
      </mesh>

      <mesh position={[0, SIDEWALK_HEIGHT * 0.5, ROAD_WIDTH * 0.5 + 0.9]} receiveShadow>
        <boxGeometry args={[ARENA_SIZE, SIDEWALK_HEIGHT, 1.8]} />
        <meshStandardMaterial color="#8ea4c2" roughness={0.95} />
      </mesh>
      <mesh position={[0, SIDEWALK_HEIGHT * 0.5, -ROAD_WIDTH * 0.5 - 0.9]} receiveShadow>
        <boxGeometry args={[ARENA_SIZE, SIDEWALK_HEIGHT, 1.8]} />
        <meshStandardMaterial color="#8ea4c2" roughness={0.95} />
      </mesh>
      <mesh position={[ROAD_WIDTH * 0.5 + 0.9, SIDEWALK_HEIGHT * 0.5, 0]} receiveShadow>
        <boxGeometry args={[1.8, SIDEWALK_HEIGHT, ARENA_SIZE]} />
        <meshStandardMaterial color="#8ea4c2" roughness={0.95} />
      </mesh>
      <mesh position={[-ROAD_WIDTH * 0.5 - 0.9, SIDEWALK_HEIGHT * 0.5, 0]} receiveShadow>
        <boxGeometry args={[1.8, SIDEWALK_HEIGHT, ARENA_SIZE]} />
        <meshStandardMaterial color="#8ea4c2" roughness={0.95} />
      </mesh>

      {[-24, -16, -8, 8, 16, 24].map((x) => (
        <mesh key={`lane-h-${x}`} position={[x, 0.04, 0]}>
          <boxGeometry args={[2.4, 0.02, 0.26]} />
          <meshBasicMaterial color="#fce8b4" toneMapped={false} />
        </mesh>
      ))}
      {[-24, -16, -8, 8, 16, 24].map((z) => (
        <mesh key={`lane-v-${z}`} position={[0, 0.04, z]}>
          <boxGeometry args={[0.26, 0.02, 2.4]} />
          <meshBasicMaterial color="#fce8b4" toneMapped={false} />
        </mesh>
      ))}

      {cityBlocks.map((block) => (
        <RegisteredBlock
          key={block.id}
          id={block.id}
          position={block.position}
          height={block.height}
          color={block.color}
          glow={block.glow}
          withWindows
        />
      ))}

      {COVER_POSITIONS.map((position, index) => (
        <RegisteredBlock
          key={`cover-${index}`}
          id={`cover-${index}`}
          position={position}
          height={2.2}
          color="#5c6d89"
          glow="#8be8ff"
        />
      ))}

      {[
        [-11, 0, -11],
        [11, 0, -11],
        [-11, 0, 11],
        [11, 0, 11],
        [0, 0, -15],
        [0, 0, 15],
        [-15, 0, 0],
        [15, 0, 0],
      ].map((position, index) => (
        <StreetLamp key={`lamp-${index}`} position={position as Vec3} />
      ))}

      <BoundaryWall position={[0, WALL_HEIGHT * 0.5, -ARENA_SIZE * 0.5]} rotation={[0, 0, 0]} width={ARENA_SIZE} />
      <BoundaryWall position={[0, WALL_HEIGHT * 0.5, ARENA_SIZE * 0.5]} rotation={[0, 0, 0]} width={ARENA_SIZE} />
      <BoundaryWall
        position={[ARENA_SIZE * 0.5, WALL_HEIGHT * 0.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={ARENA_SIZE}
      />
      <BoundaryWall
        position={[-ARENA_SIZE * 0.5, WALL_HEIGHT * 0.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={ARENA_SIZE}
      />
    </group>
  );
};
