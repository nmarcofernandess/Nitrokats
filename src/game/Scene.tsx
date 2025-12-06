import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { CatTank } from './Player/CatTank';
import { LaserManager } from './Projectiles/LaserManager';
import { TargetManager } from './World/TargetManager';
import { VFXManager } from './World/VFXManager';
import { Arena } from './World/Arena';
import { EnemyManager } from './Entities/EnemyTank';
import { useGameStore } from './store';
import { PowerUp } from './Entities/PowerUp';
import { useFrame } from '@react-three/fiber';
import { aiManager } from './Utils/AIManager';

export const Scene = () => {
    const powerUps = useGameStore((state) => state.powerUps);

    // Drive AI Simulation
    // System Loop Component
    const GameSystems = () => {
        useFrame((_, delta) => {
            aiManager.update(delta);
        });
        return null;
    };

    // Pass gameState to components if needed, or use it for scene logic
    // Currently UI handles menu/gameover overlay.
    // Maybe we want to hide game world when in menu?

    // Always render canvas, but world content depends on state? 
    // Actually, background effect works for menu too.
    return (
        <Canvas shadows className="absolute inset-0" style={{ background: '#050505' }}>
            {/* Camera positioned for isometric view - CatTank handles follow */}
            <OrthographicCamera
                makeDefault
                position={[20, 25, 20]}
                zoom={50}
                near={-100}
                far={200}
            />

            {/* Lighting */}
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} castShadow />
            <directionalLight position={[-10, 20, 10]} intensity={0.5} castShadow />

            {/* World */}
            <GameSystems />
            <Arena />
            <CatTank />
            <LaserManager />
            <TargetManager />
            <VFXManager />

            {/* Enemies */}
            <EnemyManager />

            {/* Power Ups */}
            {powerUps.map((p) => (
                <PowerUp key={p.id} {...p} />
            ))}

            {/* Post Processing */}
            <EffectComposer>
                <Bloom luminanceThreshold={0} mipmapBlur intensity={2.0} radius={0.4} />
            </EffectComposer>

            {/* Background Color */}
            <color attach="background" args={['#050505']} />
        </Canvas>
    );
};
