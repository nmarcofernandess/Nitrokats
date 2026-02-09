import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { CatShooter } from './Player/CatShooter';
import { CatTank } from './Player/CatTank';
import { LaserManager } from './Projectiles/LaserManager';
import { VFXManager } from './World/VFXManager';
import { Arena } from './World/Arena';
import { EnemyManager } from './Entities/EnemyManager';
import { useGameStore } from './store';
import { PowerUp } from './Entities/PowerUp';
import { CombatRuntime } from './systems/CombatRuntime';

export const Scene = () => {
  const powerUps = useGameStore((state) => state.powerUps);
  const gameState = useGameStore((state) => state.gameState);
  const gameMode = useGameStore((state) => state.gameMode);

  const gameplayVisible = gameState !== 'menu';

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      className="absolute inset-0"
      style={{ background: '#87afdb' }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <PerspectiveCamera makeDefault position={[0, 2.2, 6.4]} fov={64} near={0.1} far={220} />

      <fog attach="fog" args={['#9fc5ef', 45, 130]} />

      <ambientLight intensity={0.62} color="#edf5ff" />
      <hemisphereLight intensity={0.46} color="#f6fbff" groundColor="#4f5f7d" />
      <directionalLight
        position={[18, 28, 12]}
        intensity={1.28}
        color="#fff5dc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-14, 8, -12]} intensity={3.4} distance={30} color="#89deff" />
      <pointLight position={[14, 8, 12]} intensity={3.1} distance={30} color="#ffd395" />

      <Arena />

      {gameplayVisible && (
        <>
          <CombatRuntime />
          {gameMode === 'zombie' ? <CatShooter /> : <CatTank />}
          <LaserManager />
          <VFXManager />
          <EnemyManager />

          {powerUps.map((powerUp) => (
            <PowerUp key={powerUp.id} {...powerUp} />
          ))}
        </>
      )}

      <EffectComposer>
        <Bloom luminanceThreshold={0.3} mipmapBlur intensity={0.65} radius={0.42} />
      </EffectComposer>

      <color attach="background" args={['#87afdb']} />
    </Canvas>
  );
};
