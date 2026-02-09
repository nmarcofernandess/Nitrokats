import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { CatTank } from './Player/CatTank';
import { LaserManager } from './Projectiles/LaserManager';
import { TargetManager } from './World/TargetManager';
import { VFXManager } from './World/VFXManager';
import { Arena } from './World/Arena';
import { EnemyManager } from './Entities/EnemyManager';
import { useGameStore } from './store';
import { PowerUp } from './Entities/PowerUp';
import { aiManager } from './Utils/AIManager';

interface GameSystemsProps {
  active: boolean;
}

const GameSystems = ({ active }: GameSystemsProps) => {
  useFrame((_, delta) => {
    if (active) {
      aiManager.update(delta);
    }
  });

  return null;
};

export const Scene = () => {
  const powerUps = useGameStore((state) => state.powerUps);
  const gameState = useGameStore((state) => state.gameState);

  const gameplayVisible = gameState !== 'menu';

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      className="absolute inset-0"
      style={{ background: '#050505' }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <OrthographicCamera makeDefault position={[20, 25, 20]} zoom={50} near={-100} far={200} />

      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, 20, 10]} intensity={0.5} castShadow />

      <GameSystems active={gameState === 'playing'} />
      <Arena />

      {gameplayVisible && (
        <>
          <CatTank />
          <LaserManager />
          <TargetManager />
          <VFXManager />
          <EnemyManager />

          {powerUps.map((powerUp) => (
            <PowerUp key={powerUp.id} {...powerUp} />
          ))}
        </>
      )}

      <EffectComposer>
        <Bloom luminanceThreshold={0} mipmapBlur intensity={2.0} radius={0.4} />
      </EffectComposer>

      <color attach="background" args={['#050505']} />
    </Canvas>
  );
};
